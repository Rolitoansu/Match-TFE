import express from 'express'
import proxy from 'express-http-proxy'
import cors from 'cors'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://authservice:5000'
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://userservice:5001'
const PORT = process.env.PORT || 8000

const app = express()
app.set('trust proxy', 1)

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}))
app.use(express.json())
app.use('/auth', proxy(AUTH_SERVICE_URL, {
  userResHeaderDecorator(headers) {
    return headers;
  }
}))


app.listen(PORT, () => {
    console.log(`Gateway Service is running on port ${PORT}`)
})