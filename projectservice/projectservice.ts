import express from 'express'
import db from '@match-tfe/db'
import { users, projects, tags, projectTags } from '@match-tfe/db/schema'
import validate, { GetTFESchema, TFECreationSchema } from './validate'
import { eq, inArray, sql } from 'drizzle-orm'

const PORT = process.env.PORT || 5002

const app = express()
app.use(express.json())

app.get('/proposals', async (req, res) => {
    try {
        const proposals = await db
            .select({
                id: projects.id,
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
                tags: sql`json_agg(${tags.name})`.as('tags')
            })
            .from(projects)
            .leftJoin(projectTags, eq(projectTags.projectId, projects.id))
            .leftJoin(tags, eq(tags.id, projectTags.tagId))
            .groupBy(projects.id)
            .limit(10)

        return res.json({ proposals })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposals' })
    }
})

app.get('/proposals/:id', validate(GetTFESchema, 'params'), async (req, res) => {
    const projectId = Number(req.params.id)

    try {
        const [proposal] = await db
            .select({
                title: projects.title,
                description: projects.description,
                publicationDate: projects.publicationDate,
                status: projects.status,
            })
            .from(projects)
            .where(eq(projects.id, projectId))

        if (!proposal) {
            return res.status(404).json({ error: 'Project proposal not found' })
        }

        const proposalTags = await db
            .select({ name: tags.name })
            .from(tags)
            .innerJoin(projectTags, eq(projectTags.tagId, tags.id))
            .where(eq(projectTags.projectId, projectId))
        
        const [proposalUser] = await db
            .select({ name: users.name, surname: users.surname })
            .from(users)
            .innerJoin(projects, eq(projects.id, projectId))
            .where(eq(projects.studentId, users.id))
        
        const proposalData = {
            ...proposal,
            tags: proposalTags.map(tag => tag.name),
            user: proposalUser
        }
        return res.json({ proposal: proposalData })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching project proposal' })
    }
})

app.post('/proposals', validate(TFECreationSchema), async (req, res) => {
    const user = req.headers['x-user-email'] as string
    const { title, description, tags: tagNames } = req.body

    try {
        const [userId] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, user))
            .limit(1)

        if (!userId) {
            return res.status(404).json({ error: 'User not found' }) 
        }

        await db.transaction(async (trx) => {
            // IMPORTANTE: Cambiar cuando se tenga IAM. Por ahora se asume que el usuario es un estudiante.
            const [project] = await trx
                .insert(projects)
                .values({ title, description, studentId: userId.id })
                .returning({ id: projects.id })
            
            if (tagNames?.length > 0) {
                const tagIds = await trx
                    .select({ id: tags.id })
                    .from(tags)
                    .where(inArray(tags.name, tagNames)) 
                
                if (tagIds.length > 0) {
                    await trx
                        .insert(projectTags)
                        .values(tagIds.map(tag => ({ projectId: project.id, tagId: tag.id })))
                }
            }
        })

        return res.status(201).json({ message: 'Project proposal created successfully' })
        
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error creating project proposal' })
    }
})

// ── Admin: Tags management ──

app.get('/admin/tags', async (_req, res) => {
    try {
        const allTags = await db.select().from(tags).orderBy(tags.name)
        return res.json({ tags: allTags })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error fetching tags' })
    }
})

app.post('/admin/tags', async (req, res) => {
    const { name } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Tag name is required' })
    }

    try {
        const [existing] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, name.trim()))
            .limit(1)

        if (existing) {
            return res.status(409).json({ error: 'Tag already exists' })
        }

        const [tag] = await db
            .insert(tags)
            .values({ name: name.trim() })
            .returning({ id: tags.id, name: tags.name })

        return res.status(201).json({ tag })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error creating tag' })
    }
})

app.delete('/admin/tags/:id', async (req, res) => {
    const tagId = Number(req.params.id)

    if (isNaN(tagId)) {
        return res.status(400).json({ error: 'Invalid tag ID' })
    }

    try {
        const [deleted] = await db
            .delete(tags)
            .where(eq(tags.id, tagId))
            .returning({ id: tags.id })

        if (!deleted) {
            return res.status(404).json({ error: 'Tag not found' })
        }

        return res.json({ message: 'Tag deleted' })
    } catch (exception) {
        console.error(exception)
        return res.status(500).json({ error: 'Error deleting tag' })
    }
})

app.listen(PORT, () => {
    console.log(`Project Service is running on port ${PORT}`)
})