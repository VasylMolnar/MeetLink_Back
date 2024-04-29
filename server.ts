import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import signale from 'signale'
import dbConnect from './config/dbConnect'
import successLog from './middleware/successLog'
import errorLog from './middleware/errorLog'
import { corsOptions } from './config/corsOptions'
import { credentials } from './middleware/credentials'
import { verifyJWT } from './middleware/verifyJWT'
import { app, server } from './socket/socket'

dotenv.config()
const PORT = process.env.PORT

app.use(successLog)

// connect to MongoDB
dbConnect()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())
app.use(credentials)
app.use(cors(corsOptions))

//Routes
//public
app.use('/auth', require(path.join(__dirname, 'routes', 'authRoute')))
app.use('/refresh', require(path.join(__dirname, 'routes', 'refreshRoute')))

//private
app.use(verifyJWT)
app.use('/user', require(path.join(__dirname, 'routes', 'userRoute')))
app.use('/meet', require(path.join(__dirname, 'routes', 'meetRoute')))
app.use('/access', require(path.join(__dirname, 'routes', 'accessRoute')))

app.all('*', (req: any, res: any) => {
    res.status(404).json({ error: '404 Not Found' })
})

app.use(errorLog)

mongoose.connection.once('open', () => {
    signale.pending('Connected to MongoDB')
    server.listen(PORT, () => signale.success(`Server running on port ${PORT}`))
})
