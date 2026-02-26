import express from 'express'

const PORT = process.env.PORT || 5002
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

const app = express()
app.use(express.json())

app.get('/tfe', async (req, res) => {
    
})

app.listen(PORT, () => {
    console.log(`Project Service is running on port ${PORT}`)
})