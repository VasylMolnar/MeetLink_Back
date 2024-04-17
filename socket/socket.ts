import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { whitelist } from '../config/allowedOrigins'
import signale from 'signale'
import {
    handlerJoinRoom,
    handlerSendNewMessage,
    handlerJoinConference,
    handleToggleCamera,
    handleToggleMicrophone,
} from './socketHandlers'

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
    signale.info('A user connected to Socket')

    socket.on('joinRoom', async (meetId, roomId, userId) => {
        // Join to Room and Load message history
        await handlerJoinRoom({ socket, meetId, roomId, userId })
    })

    socket.on('sendNewMessage', async (data) => {
        // Send new message
        await handlerSendNewMessage({ io, socket, data })
    })

    socket.on(
        'joinConference',
        async (meetId, conferenceId, userId, metadata) => {
            //Join to conference
            await handlerJoinConference({
                io,
                socket,
                meetId,
                conferenceId,
                userId,
                metadata,
            })
        }
    )

    socket.on(
        'toggleCamera',
        async (meetId, conferenceId, userId, isCameraOn) => {
            await handleToggleCamera({
                socket,
                meetId,
                conferenceId,
                userId,
                isCameraOn,
            })
        }
    )

    socket.on(
        'toggleMicrophone',
        async (meetId, conferenceId, userId, isMicrophoneOn) => {
            await handleToggleMicrophone({
                socket,
                meetId,
                conferenceId,
                userId,
                isMicrophoneOn,
            })
        }
    )

    socket.on('disconnect', () => {
        signale.info('A user disconnected ')
        socket.disconnect()
    })
})

export { app, io, server }
