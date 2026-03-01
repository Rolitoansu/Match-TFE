import express from 'express'
import db from '@match-tfe/db'
import { TFESchema, validate } from './validate'
import { users, projects, tags, projectTags } from '@match-tfe/db/schema'
import { eq, inArray } from 'drizzle-orm'

const PORT = process.env.PORT || 5002
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())

app.post('/proposals', validate(TFESchema), async (req, res) => {
    console.log('Received proposal creation request with body:', req.body) // Log the request body for debugging
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
            
            if (tagNames && tagNames.length > 0) {
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

app.listen(PORT, () => {
    console.log(`Project Service is running on port ${PORT}`)
})