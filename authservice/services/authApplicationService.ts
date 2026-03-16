import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '@match-tfe/db'
import { administrators, tags, userTags, users } from '@match-tfe/db/schema'
import { eq } from 'drizzle-orm'

export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly payload: Record<string, unknown>
    ) {
        super(String(payload.error ?? payload.message ?? 'Request failed'))
    }
}

export class AuthApplicationService {
    constructor(private readonly jwtSecret: string) {}

    async refreshUserSession(refreshToken: string) {
        const payload = jwt.verify(refreshToken, this.jwtSecret) as jwt.JwtPayload

        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                registrationDate: users.registrationDate,
                biography: users.biography,
                role: users.role,
            })
            .from(users)
            .where(eq(users.email, payload.email as string))
            .limit(1)

        if (!user) {
            throw new HttpError(401, { message: 'User no longer exists' })
        }

        const interestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, user.id))

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
                role: user.role,
                interests: interestRows.map((row) => row.name),
            },
        }
    }

    async refreshAdminSession(refreshToken: string) {
        const payload = jwt.verify(refreshToken, this.jwtSecret) as jwt.JwtPayload

        if (payload.role !== 'admin') {
            throw new HttpError(401, {})
        }

        const [admin] = await db
            .select({ id: administrators.id, email: administrators.email })
            .from(administrators)
            .where(eq(administrators.email, payload.email as string))
            .limit(1)

        if (!admin) {
            throw new HttpError(401, { message: 'Admin no longer exists' })
        }

        const accessToken = jwt.sign({ email: payload.email, role: 'admin' }, this.jwtSecret, { expiresIn: '15m' })

        return { accessToken, admin }
    }

    async loginUser(email: string, password: string) {
        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                surname: users.surname,
                passwordHash: users.passwordHash,
                registrationDate: users.registrationDate,
                biography: users.biography,
                role: users.role,
            })
            .from(users)
            .where(eq(users.email, email))
            .limit(1)

        if (!user) {
            throw new HttpError(401, { message: 'Invalid credentials' })
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatches) {
            throw new HttpError(401, { message: 'Invalid credentials' })
        }

        const interestRows = await db
            .select({ name: tags.name })
            .from(userTags)
            .innerJoin(tags, eq(tags.id, userTags.tagId))
            .where(eq(userTags.userId, user.id))

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
                role: user.role,
                interests: interestRows.map((row) => row.name),
            },
        }
    }

    async loginAdmin(email: string, password: string) {
        const [admin] = await db
            .select({
                id: administrators.id,
                email: administrators.email,
                passwordHash: administrators.passwordHash,
            })
            .from(administrators)
            .where(eq(administrators.email, email))
            .limit(1)

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
