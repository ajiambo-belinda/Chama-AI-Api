import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import groupRoutes from './routes/groupRoutes.js'
import contributionRoutes from './routes/contributionRoutes.js'
import loanRoutes from './routes/loanRoutes.js'
import dividendRoutes from './routes/dividendRoutes.js'
import userRoutes from './routes/userRoutes.js'
import mpesaRoutes from './routes/mpesaRoutes.js'

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())


app.use('/api/auth', authRoutes)


app.use('/api/groups', groupRoutes)


app.use('/api/contributions', contributionRoutes)


app.use('/api/loans', loanRoutes)


app.use('/api/dividends', dividendRoutes)


app.use('/api/users', userRoutes)


app.use('/api/mpesa', mpesaRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Chama AI API is running' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})