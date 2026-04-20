import express from 'express'
import { validate, registerSchema, adminStudentSchema, adminProfessorSchema, adminUpdateUserSchema, updateProfileSchema, userIdParamsSchema } from './validate'
import { HttpError, UserApplicationService } from './services/userApplicationService'

const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())
const userService = new UserApplicationService(JWT_SECRET)

function getAuthenticatedEmail(req: express.Request, res: express.Response) {
    const userEmail = req.headers['x-user-email'] as string | undefined

    if (!userEmail) {
        res.status(401).json({ error: 'Missing authenticated user email' })
        return null
    }

    return userEmail
}

function handleServiceError(error: unknown, res: express.Response, fallbackMessage: string) {
    if (error instanceof HttpError) {
        return res.status(error.status).json(error.payload)
    }

    console.error(error)
    return res.status(500).json({ error: fallbackMessage })
}

app.post('/register', validate(registerSchema), async (req, res) => {
    const { email, name, surname, password } = req.body

    try {
        const result = await userService.registerStudent({ email, name, surname, password })

        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true, 
            sameSite: 'strict',
            secure: process.env.STAGE === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        return res.json({ access_token: result.accessToken, user: result.user })
    } catch (error) {
        return handleServiceError(error, res, 'Error creating user')
    }
})

app.get('/proposals/:id', validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)

    try {
        const result = await userService.getUserProposals(userId)
        return res.json(result)

    } catch (exception) {
        return handleServiceError(exception, res, 'Error fetching project proposals')
    }
})

app.get('/profile', async (req, res) => {
    const userEmail = getAuthenticatedEmail(req, res)
    if (!userEmail) return

    try {
        const result = await userService.getAuthenticatedProfile(userEmail)
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error fetching user profile')
    }
})

app.patch('/profile', validate(updateProfileSchema), async (req, res) => {
    const userEmail = getAuthenticatedEmail(req, res)
    if (!userEmail) return

    const biography = req.body.biography !== undefined
        ? (req.body.biography?.trim() || null)
        : undefined
    const interests = req.body.interests as string[] | undefined
    const notificationFrequency = req.body.notificationFrequency as 'disabled' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | undefined
    const notificationReminderHour = req.body.notificationReminderHour as number | undefined

    try {
        const result = await userService.updateAuthenticatedProfile(userEmail, { biography, interests, notificationFrequency, notificationReminderHour })
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error updating user profile')
    }
})

app.get('/:id', validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)
    const requesterEmail = getAuthenticatedEmail(req, res)
    if (!requesterEmail) return

    try {
        const result = await userService.getPublicProfile(userId, requesterEmail)
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error fetching user profile')
    }
})

app.post('/admin/students/import', validate(adminStudentSchema), async (req, res) => {
    const { students: studentList } = req.body

    try {
        const result = await userService.importStudents(studentList)
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error importing students')
    }
})

app.post('/admin/professors/import', validate(adminProfessorSchema), async (req, res) => {
    const { professors: professorList } = req.body

    try {
        const result = await userService.importProfessors(professorList)
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error importing professors')
    }
})

app.get('/admin/users', async (req, res) => {
    try {
        const result = await userService.listUsers()
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error fetching users')
    }
})

app.patch('/admin/users/:id', validate(adminUpdateUserSchema), validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)
    const { name, surname, email, biography } = req.body

    try {
        const result = await userService.updateUser(userId, { name, surname, email, biography })
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error updating user')
    }
})

app.delete('/admin/users/:id', validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)

    try {
        const result = await userService.deleteUser(userId)
        return res.json(result)
    } catch (error) {
        return handleServiceError(error, res, 'Error deleting user')
    }
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})