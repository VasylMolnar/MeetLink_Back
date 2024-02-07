import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import path from 'path'
import signale from 'signale'
import dbConnect from './config/dbConnect'
import successLog from './middleware/successLog'
import errorLog from './middleware/errorLog'

dotenv.config()
const app = express()
const PORT = process.env.PORT

app.use(successLog)

// connect to MongoDB
dbConnect()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())

//Routes
//public
app.use('/auth', require(path.join(__dirname, 'routes', 'authRoute')))

//private
app.use('/user', require(path.join(__dirname, 'routes', 'userRoute')))
app.use('/meet', require(path.join(__dirname, 'routes', 'meetRoute')))

app.all('*', (req: any, res: any) => {
    res.status(404).json({ error: '404 Not Found' })
})

app.use(errorLog)

mongoose.connection.once('open', () => {
    signale.pending('Connected to MongoDB')
    app.listen(PORT, () => signale.success(`Server running on port ${PORT}`))
})
function cookiesParser(): any {
    throw new Error('Function not implemented.')
}
