import express from 'express'
import validate, { AcceptMatchParamsSchema, AdminTagCreateSchema, AdminTagImportSchema, GetTFESchema, TFECreationSchema, TagIdParamsSchema } from './validate'
import { HttpError, ProjectApplicationService } from './services/projectApplicationService'

const PORT = process.env.PORT || 5002

const app = express()
app.use(express.json())
const projectService = new ProjectApplicationService()

app.get('/proposals', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.getProposals(userEmail)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposals' })
    }
})

app.get('/explore', async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.getExplore(userEmail)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error fetching explore proposals' })
    }
})

app.get('/tags', async (_req, res) => {
    try {
        const result = await projectService.getTags()
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error fetching tags' })
    }
})

app.post('/proposals', validate(TFECreationSchema), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const { title, description, tags: tagNames } = req.body

    try {
        const result = await projectService.createProposal(userEmail, { title, description, tags: tagNames })
        return res.status(201).json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error creating project proposal' })
    }
})

app.get('/proposals/:id', validate(GetTFESchema, 'params'), async (req, res) => {
    const projectId = Number(req.params.id)
    const userEmail = req.headers['x-user-email'] as string

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.getProposalById(userEmail, projectId)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposal' })
    }
})

app.patch('/proposals/:id/renew', validate(GetTFESchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.renewProposal(userEmail, projectId)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error renewing proposal' })
    }
})

app.post('/proposals/:id/like', validate(GetTFESchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.likeProposal(userEmail, projectId)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error creating like for proposal' })
    }
})

app.post('/proposals/:id/pass', validate(GetTFESchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.passProposal(userEmail, projectId)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error registering pass for proposal' })
    }
})

app.post('/proposals/:id/match/:userId', validate(AcceptMatchParamsSchema, 'params'), async (req, res) => {
    const userEmail = req.headers['x-user-email'] as string
    const projectId = Number(req.params.id)
    const interestedUserId = Number(req.params.userId)

    if (!userEmail) {
        return res.status(401).json({ error: 'Missing authenticated user email' })
    }

    try {
        const result = await projectService.acceptProposalMatch(userEmail, projectId, interestedUserId)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error accepting match for proposal' })
    }
})

app.get('/admin/tags', async (_req, res) => {
    try {
        const result = await projectService.listAdminTags()
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error fetching tags' })
    }
})

app.post('/admin/tags', validate(AdminTagCreateSchema), async (req, res) => {
    const { name } = req.body

    try {
        const result = await projectService.createAdminTag(name)
        return res.status(201).json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error creating tag' })
    }
})

app.post('/admin/tags/import', validate(AdminTagImportSchema), async (req, res) => {
    const { tags: tagList } = req.body

    try {
        const result = await projectService.importAdminTags(tagList)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error importing tags' })
    }
})

app.delete('/admin/tags/:id', validate(TagIdParamsSchema, 'params'), async (req, res) => {
    const tagId = Number(req.params.id)

    try {
        const result = await projectService.deleteAdminTag(tagId)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error deleting tag' })
    }
})

app.patch('/admin/tags/:id', validate(TagIdParamsSchema, 'params'), validate(AdminTagCreateSchema), async (req, res) => {
    const tagId = Number(req.params.id)
    const { name } = req.body

    try {
        const result = await projectService.updateAdminTag(tagId, name)
        return res.json(result)
    } catch (exception) {
        if (exception instanceof HttpError) {
            return res.status(exception.status).json(exception.payload)
        }

        console.error(exception)
        return res.status(500).json({ error: 'Error updating tag' })
    }
})

app.listen(PORT, () => {
    console.log(`Project Service is running on port ${PORT}`)
})