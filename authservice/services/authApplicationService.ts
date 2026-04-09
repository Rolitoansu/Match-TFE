import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { AuthRepository } from '../repositories/authRepository'

export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly payload: Record<string, unknown>
    ) {
        super(String(payload.error ?? payload.message ?? 'Request failed'))
    }
}

export class AuthApplicationService {
    private readonly authRepository = new AuthRepository()

    constructor(private readonly jwtSecret: string) {}

    async refreshUserSession(refreshToken: string) {
        const payload = jwt.verify(refreshToken, this.jwtSecret) as jwt.JwtPayload

        const user = await this.authRepository.getUserSessionByEmail(payload.email as string)

        if (!user) {
            throw new HttpError(401, { message: 'User no longer exists' })
        }

        const interests = await this.authRepository.getUserInterests(user.id)

        const accessToken = jwt.sign({ email: payload.email }, this.jwtSecret, { expiresIn: '15m' })

        return {
            accessToken,
            user: {
                id: user.id,
                email: payload.email,
                name: user.name,
                surname: user.surname,
                registrationDate: user.registrationDate,
                biography: user.biography,
                notificationFrequency: user.notificationFrequency,
                notificationReminderHour: user.notificationReminderHour,
                role: user.role,
                interests,
            },
        }
    }

    async refreshAdminSession(refreshToken: string) {
        const payload = jwt.verify(refreshToken, this.jwtSecret) as jwt.JwtPayload

        if (payload.role !== 'admin') {
            throw new HttpError(401, {})
        }

        const admin = await this.authRepository.getAdminByEmail(payload.email as string)

        if (!admin) {
            throw new HttpError(401, { message: 'Admin no longer exists' })
        }

        const accessToken = jwt.sign({ email: payload.email, role: 'admin' }, this.jwtSecret, { expiresIn: '15m' })

        return { accessToken, admin }
    }

    async loginUser(email: string, password: string) {
        const user = await this.authRepository.getUserPasswordByEmail(email)

        if (!user) {
            throw new HttpError(401, { message: 'Invalid credentials' })
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatches) {
            throw new HttpError(401, { message: 'Invalid credentials' })
        }

        const interests = await this.authRepository.getUserInterests(user.id)

        const refreshToken = jwt.sign({ email }, this.jwtSecret, { expiresIn: '30d' })
        const accessToken = jwt.sign({ email }, this.jwtSecret, { expiresIn: '15m' })

        return {
            refreshToken,
            accessToken,
            user: {
                id: user.id,
                email,
                name: user.name,
                surname: user.surname,
                registrationDate: user.registrationDate,
                biography: user.biography,
                notificationFrequency: user.notificationFrequency,
                notificationReminderHour: user.notificationReminderHour,
                role: user.role,
                interests,
            },
        }
    }

    async loginAdmin(email: string, password: string) {
        const admin = await this.authRepository.getAdminByEmail(email)

        if (!admin) {
            throw new HttpError(401, { message: 'Invalid credentials' })
        }

        const passwordMatches = await bcrypt.compare(password, admin.passwordHash)

        if (!passwordMatches) {
            throw new HttpError(401, { message: 'Invalid credentials' })
        }

        const refreshToken = jwt.sign({ email, role: 'admin' }, this.jwtSecret, { expiresIn: '30d' })
        const accessToken = jwt.sign({ email, role: 'admin' }, this.jwtSecret, { expiresIn: '15m' })

        return {
            refreshToken,
            accessToken,
            admin: {
                id: admin.id,
                email: admin.email,
            },
        }
    }
}
