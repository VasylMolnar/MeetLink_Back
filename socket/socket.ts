import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { whitelist } from '../config/allowedOrigins'
import signale from 'signale'
import Meet from '../model/Meet'

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

        const meet = await Meet.findById(meetId).exec()
        if (!meet) {
            return socket.emit('error', { message: 'Meet not found' })
        }

        if (meet.roomId !== roomId) {
            return socket.emit('error', { message: 'Room not found' })
        }

        if (!meet.userList.includes(userId)) {
            return socket.emit('error', {
                message: 'Access denied! User not found',
            })
        }

        signale.info(
            `A user  ${userId} join to meet ${meetId} with secret roomId`,
            roomId
        )

        socket.join(roomId)

        const messages = meet.messages
        socket.emit('loadMessageHistory', messages)
    })

    socket.on('sendNewMessage', async (data) => {
        const { meetId, roomId, message, senderId, username, surname, avatar } =
            data

        if (
            !meetId ||
            !roomId ||
            !message ||
            !senderId ||
            !username ||
            !surname
        ) {
            return socket.emit('error', { message: 'Missing required fields' })
        }

        const meet = await Meet.findById(meetId)
        if (!meet) {
            return socket.emit('error', { message: 'Meet not found' })
        }

        try {
            meet.messages.push({
                senderId,
                username,
                surname,
                message,
                avatar,
            })

            await meet.save()
            const messages = meet.messages

            // io.to(roomId).emit('getNewMessage', messages)
            io.to(roomId).emit('loadMessageHistory', messages)
        } catch (error) {
            signale.error('Failed to save message to database:', error)

            return socket.emit('error', {
                message: 'Failed to save message',
            })
        }
    })

    socket.on('disconnect', () => {
        signale.info('A user disconnected ')
    })
})

export { app, io, server }
