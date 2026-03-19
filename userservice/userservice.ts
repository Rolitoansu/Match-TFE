import express from 'express'
import { validate, registerSchema, adminStudentSchema, adminProfessorSchema, adminUpdateUserSchema, updateProfileSchema, userIdParamsSchema } from './validate'
import { HttpError, UserApplicationService } from './services/userApplicationService'

const PORT = process.env.PORT || 5001
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())
const userService = new UserApplicationService(JWT_SECRET)

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
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error creating user' })
    }
})

app.get('/proposals/:id', validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)

    try {
        const result = await userService.getUserProposals(userId)
        return res.json(result)

    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposals' })
    }
})

app.get('/profile', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await userService.getAuthenticatedProfile(userEmail)
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error fetching user profile' })
    }
})

app.patch('/profile', validate(updateProfileSchema), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    const biography = req.body.biography !== undefined
        ? (req.body.biography?.trim() || null)
        : undefined
    const interests = req.body.interests as string[] | undefined

    try {
        const result = await userService.updateAuthenticatedProfile(userEmail, { biography, interests })
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error updating user profile' })
    }
})

app.get('/:id', validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)

    try {
        const result = await userService.getPublicProfile(userId)
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error fetching user profile' })
    }
})

app.post('/admin/students/import', validate(adminStudentSchema), async (req, res) => {
    const { students: studentList } = req.body

    try {
        const result = await userService.importStudents(studentList)
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error importing students' })
    }
})

app.post('/admin/professors/import', validate(adminProfessorSchema), async (req, res) => {
    const { professors: professorList } = req.body

    try {
        const result = await userService.importProfessors(professorList)
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error importing professors' })
    }
})

app.get('/admin/users', async (req, res) => {
    try {
        const result = await userService.listUsers()
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error fetching users' })
    }
})

app.patch('/admin/users/:id', validate(adminUpdateUserSchema), validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)
    const { name, surname, email, biography } = req.body

    try {
        const result = await userService.updateUser(userId, { name, surname, email, biography })
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error updating user' })
    }
})

app.delete('/admin/users/:id', validate(userIdParamsSchema, 'params'), async (req, res) => {
    const userId = Number(req.params.id)

    try {
        const result = await userService.deleteUser(userId)
        return res.json(result)
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json(error.payload)
        }

        console.error(error)
        return res.status(500).json({ error: 'Error deleting user' })
    }
})

app.listen(PORT, () => {
    console.log(`User Service is running on port ${PORT}`)
})