import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { whitelist } from '../config/allowedOrigins'
import signale from 'signale'
import { handlerJoinRoom, handlerSendNewMessage } from './socketHandlers'

const app = express()
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: (origin: any, callback: any) => {
            if (whitelist.includes(origin) || !origin) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        methods: ['GET', 'POST'],
    },
})

// WebSocket
io.on('connection', (socket) => {
    signale.info('A user connected')

    socket.on('joinRoom', async (meetId, roomId, userId) => {
        // Join to Room and Load message history
        await handlerJoinRoom(socket, meetId, roomId, userId)
    })

    socket.on('sendNewMessage', async (data) => {
        // Send new message
        await handlerSendNewMessage(io, socket, data)
    })

    socket.on('signal', (data) => {
        io.to(data.roomId).emit('signal', {
            userId: data.userId,
            signal: data.signal,
        })
    })

    socket.on('disconnect', () => {
        signale.info('A user disconnected ')
    })
})

export { app, io, server }
