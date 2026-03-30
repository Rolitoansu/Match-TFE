import express from 'express'
import proxy from 'express-http-proxy'
import cors from 'cors'
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import projectRoutes from './routes/projectRoutes'
import adminRoutes from './routes/adminRoutes'
import notificationRoutes from './routes/notificationRoutes'

const HOST = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 3000
const FRONTEND_URL = `${HOST}:${PORT}`

const app = express()

app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/user', userRoutes)
app.use('/project', projectRoutes)
app.use('/admin', adminRoutes)
app.use('/notifications', notificationRoutes)

app.listen(PORT, () => {
    console.log(`Gateway Service is running on port ${PORT}`)
})