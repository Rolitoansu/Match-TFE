import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { UserRepository } from '../repositories/userRepository'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notificationservice:5004'

export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly payload: Record<string, unknown>
    ) {
        super(String(payload.error ?? payload.message ?? 'Request failed'))
    }
}

type RegisterStudentInput = {
    email: string
    name: string
    surname: string
    password: string
}

type UpdateProfileInput = {
    biography?: string | null
    interests?: string[]
    notificationFrequency?: 'disabled' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
    notificationReminderHour?: number
}

export class UserApplicationService {
    private readonly userRepository = new UserRepository()

    constructor(private readonly jwtSecret: string) {}

    private async sendNotification(userId: number, type: string, content: string) {
        if (process.env.NODE_ENV === 'test') {
            return
        }

        try {
            await axios.post(`${NOTIFICATION_SERVICE_URL}/users`, { userId, type, content })
        } catch (error) {
            console.warn('[userservice] notification dispatch failed:', error)
        }
    }

    async registerStudent(input: RegisterStudentInput) {
        const existingUser = await this.userRepository.findByEmail(input.email)

        if (existingUser) {
            throw new HttpError(409, { error: 'User already exists' })
        }

        const passwordHash = await bcrypt.hash(input.password, 10)
        const registrationDate = new Date()
        let createdUserId: number | null = null

        await this.userRepository.transaction(async (trx) => {
            const createdUser = await this.userRepository.createStudent({
                email: input.email,
                name: input.name,
                surname: input.surname,
                passwordHash,
                registrationDate,
            }, trx)

            createdUserId = createdUser?.id ?? null
        })
        if (!createdUserId) {
            throw new Error('User creation failed')
        }

        const refreshToken = jwt.sign({ email: input.email }, this.jwtSecret, { expiresIn: '30d' })
        const accessToken = jwt.sign({ email: input.email }, this.jwtSecret, { expiresIn: '15m' })

        await this.sendNotification(
            createdUserId,
            'welcome_profile_setup',
            'Bienvenido a Match-TFE. Edita tus intereses en el perfil para mejorar tus matches.'
        )

        return {
            refreshToken,
            accessToken,
            user: {
                id: createdUserId,
                email: input.email,
                name: input.name,
                surname: input.surname,
                registrationDate,
                biography: null,
                notificationFrequency: 'disabled',
                notificationReminderHour: 9,
                role: 'student',
                interests: [],
            },
        }
    }

    async getUserProposals(userId: number) {
        const user = await this.userRepository.findRoleById(userId)

        if (!user) {
            throw new HttpError(404, { error: 'User not found' })
        }

        const proposalRows = await this.userRepository.getProposalsForUser(user.id, user.role)

        const proposalsWithTags = await Promise.all(
            proposalRows.map(async (proposal) => {
                const tags = await this.userRepository.getProposalTags(proposal.id)

                return {
                    ...proposal,
                    tags,
                }
            })
        )

        return { proposals: proposalsWithTags }
    }

    async getAuthenticatedProfile(userEmail: string) {
        const profile = await this.userRepository.findByEmail(userEmail)

        if (!profile) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        const interests = await this.userRepository.getInterests(profile.id)

        return {
            user: {
                ...profile,
                interests,
            },
        }
    }

    async updateAuthenticatedProfile(userEmail: string, input: UpdateProfileInput) {
        const currentUser = await this.userRepository.findRequesterByEmail(userEmail)

        if (!currentUser) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        if (input.biography !== undefined) {
            await this.userRepository.updateUser(currentUser.id, { biography: input.biography })
        }

        if (input.notificationFrequency !== undefined) {
            await this.userRepository.updateNotificationFrequency(currentUser.id, input.notificationFrequency)
        }

        if (input.notificationReminderHour !== undefined) {
            await this.userRepository.updateNotificationReminderHour(currentUser.id, input.notificationReminderHour)
        }

        if (input.interests !== undefined) {
            const normalizedInterests = [...new Set(input.interests.map((name) => name.trim()).filter(Boolean))]
            const tagRows = normalizedInterests.length > 0
                ? await this.userRepository.findTagsByNames(normalizedInterests)
                : []

            if (tagRows.length !== normalizedInterests.length) {
                throw new HttpError(400, { error: 'One or more interests are not valid tags' })
            }

            await this.userRepository.replaceUserInterests(currentUser.id, tagRows.map((tag) => tag.id))
        }

        const updatedUser = await this.userRepository.findById(currentUser.id)

        if (!updatedUser) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        const updatedInterests = await this.userRepository.getInterests(currentUser.id)

        return {
            user: {
                ...updatedUser,
                interests: updatedInterests,
            },
        }
    }

    async getPublicProfile(userId: number, requesterEmail: string) {
        const requester = await this.userRepository.findRequesterByEmail(requesterEmail)

        if (!requester) {
            throw new HttpError(404, { error: 'Authenticated user not found' })
        }

        const profile = await this.userRepository.findPublicProfileById(userId)

        if (!profile) {
            throw new HttpError(404, { error: 'User not found' })
        }

        const interests = await this.userRepository.getInterests(profile.id)

        const proposalRows = await this.userRepository.getProposalsForUser(profile.id, profile.role)

        const isOwnProfile = requester.id === profile.id
        let canSeeEmail = isOwnProfile

        if (!canSeeEmail) {
            canSeeEmail = await this.userRepository.hasAcceptedMatchBetweenUsers(requester.id, profile.id)
        }

        return {
            user: {
                ...profile,
                email: canSeeEmail ? profile.email : null,
                interests,
                proposals: proposalRows,
            },
        }
    }

    async importStudents(studentList: Array<{ email: string; name: string; surname: string }>) {
        let created = 0
        let skipped = 0
        const errors: string[] = []

        for (const student of studentList) {
            const { email, name, surname } = student

            if (!email || !name || !surname) {
                errors.push(`Datos incompletos para: ${email || 'sin correo'}`)
                skipped += 1
                continue
            }

            try {
                const existing = await this.userRepository.findByEmail(email)

                if (existing) {
                    skipped += 1
                    continue
                }

                const defaultPassword = email.split('@')[0]
                const passwordHash = await bcrypt.hash(defaultPassword, 10)
                let createdUserId: number | null = null

                await this.userRepository.transaction(async (trx) => {
                    const createdUser = await this.userRepository.createStudent({
                        email,
                        name,
                        surname,
                        passwordHash,
                        registrationDate: new Date(),
                    }, trx)

                    createdUserId = createdUser?.id ?? null
                })

                if (createdUserId) {
                    await this.sendNotification(
                        createdUserId,
                        'welcome_profile_setup',
                        'Bienvenido a Match-TFE. Edita tus intereses en el perfil para mejorar tus matches.'
                    )
                }

                created += 1
            } catch (error) {
                const reason = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`Error al crear ${email}: ${reason}`)
                skipped += 1
            }
        }

        return { created, skipped, errors }
    }

    async importProfessors(professorList: Array<{ email: string; name: string; surname: string }>) {
        let created = 0
        let skipped = 0
        const errors: string[] = []

        for (const professor of professorList) {
            const { email, name, surname } = professor

            if (!email || !name || !surname) {
                errors.push(`Datos incompletos para: ${email || 'sin correo'}`)
                skipped += 1
                continue
            }

            try {
                const existing = await this.userRepository.findByEmail(email)

                if (existing) {
                    skipped += 1
                    continue
                }

                const defaultPassword = email.split('@')[0]
                const passwordHash = await bcrypt.hash(defaultPassword, 10)
                let createdUserId: number | null = null

                await this.userRepository.transaction(async (trx) => {
                    const createdUser = await this.userRepository.createProfessor({
                        email,
                        name,
                        surname,
                        passwordHash,
                        registrationDate: new Date(),
                    }, trx)

                    createdUserId = createdUser?.id ?? null
                })

                if (createdUserId) {
                    await this.sendNotification(
                        createdUserId,
                        'welcome_profile_setup',
                        'Bienvenido a Match-TFE. Edita tus intereses en el perfil para mejorar tus matches.'
                    )
                }

                created += 1
            } catch (error) {
                const reason = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`Error al crear ${email}: ${reason}`)
                skipped += 1
            }
        }

        return { created, skipped, errors }
    }

    async updateUser(userId: number, update: { name?: string; surname?: string; email?: string; biography?: string | null }) {
        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new HttpError(404, { error: 'User not found' })
        }

        if (update.email && update.email !== user.email) {
            const existing = await this.userRepository.findByEmail(update.email)

            if (existing) {
                throw new HttpError(409, { error: 'Email already in use' })
            }
        }

        await this.userRepository.updateUser(userId, update)

        const updatedUser = await this.userRepository.findById(userId)

        return { user: updatedUser }
    }

    async deleteUser(userId: number) {
        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new HttpError(404, { error: 'User not found' })
        }

        await this.userRepository.transaction(async (trx) => {
            await this.userRepository.deleteUser(userId, trx)
        })

        return { message: 'User deleted successfully' }
    }

    async listUsers() {
        const usersList = await this.userRepository.listUsers()

        return { users: usersList }
    }
}
