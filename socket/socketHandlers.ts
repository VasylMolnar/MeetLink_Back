import signale from 'signale'
import Meet from '../model/Meet'

interface IRoom {
    io?: any
    socket?: any
    meetId?: string
    roomId?: string
    userId?: string
    conferenceId?: string
    data?: any
    metadata?: any
}

const conferenceUsers: Record<string, string[]> = {}

const handlerJoinRoom = async ({ socket, meetId, roomId, userId }: IRoom) => {
    if (!meetId || !roomId || !userId) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

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
        `A user  ${userId} from this meet ${meetId}  join to room ${roomId}`
    )

    socket.join(roomId)

    const messages = meet.messages
    socket.emit('loadMessageHistory', messages)

    // User Leave from room
    socket.on('disconnect', () => {
        signale.info(
            `A user  ${userId} from this meet ${meetId}  leave from room ${roomId}`
        )

        socket.leave(roomId)
    })
}

const handlerSendNewMessage = async ({ io, socket, data }: IRoom) => {
    const { meetId, roomId, message, senderId, username, surname, avatar } =
        data

    if (!meetId || !roomId || !message || !senderId || !username || !surname) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    const meet = await Meet.findById(meetId)
    if (!meet) {
        return socket.emit('error', { message: 'Meet not found' })
    }

    if (meet.roomId !== roomId) {
        return socket.emit('error', { message: 'Room not found' })
    }

    if (!meet.userList.includes(senderId)) {
        return socket.emit('error', {
            message: 'Access denied! User not found',
        })
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
}

const handlerJoinConference = async ({
    io,
    socket,
    meetId,
    userId,
    conferenceId,
    metadata,
}: IRoom) => {
    if (!meetId || !conferenceId || !userId) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    const meet = await Meet.findById(meetId).exec()
    if (!meet) {
        return socket.emit('error', { message: 'Meet not found' })
    }

    if (meet.conferenceId !== conferenceId) {
        return socket.emit('error', { message: 'Conference not found' })
    }

    if (!meet.userList.includes(userId)) {
        return socket.emit('error', {
            message: 'Access denied! User not found',
        })
    }

    signale.info(
        `A user  ${userId} from this meet  ${meetId}  join to conference ${conferenceId}`
    )

    socket.join(conferenceId)

    // if (!conferenceUsers[conferenceId]) {
    //     conferenceUsers[conferenceId] = []
    // }
    // conferenceUsers[conferenceId].push(userId) //or other info about user

    socket.to(conferenceId).emit('user connected', userId, metadata)

    socket.on('disconnect', () => {
        signale.info(
            `A user  ${userId} from this meet ${meetId}  leave from conference ${conferenceId}`
        )
        socket.to(conferenceId).emit('user disconnected', userId)
        socket.leave(conferenceId)
    })

    // io.to(conferenceId).emit('updateUserList', conferenceUsers[conferenceId])

    // // User Leave from conference
    // socket.on('disconnect', () => {
    //     signale.info(
    //         `A user  ${userId} from this meet ${meetId}  leave from conference ${conferenceId}`
    //     )

    //     socket.leave(conferenceId)

    //     conferenceUsers[conferenceId] = conferenceUsers[conferenceId].filter(
    //         (id) => id !== userId
    //     )

    //     io.to(conferenceId).emit(
    //         'updateUserList',
    //         conferenceUsers[conferenceId]
    //     )
    // })
}

const handleToggleCamera = async ({
    meetId,
    conferenceId,
    userId,
    socket,
    isCameraOn,
}: any) => {
    if (!meetId || !conferenceId || !userId) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    const meet = await Meet.findById(meetId).exec()
    if (!meet) {
        return socket.emit('error', { message: 'Meet not found' })
    }

    if (meet.conferenceId !== conferenceId) {
        return socket.emit('error', { message: 'Conference not found' })
    }

    if (!meet.userList.includes(userId)) {
        return socket.emit('error', {
            message: 'Access denied! User not found',
        })
    }

    socket.to(conferenceId).emit('userToggleCamera', userId, isCameraOn)
}

const handleToggleMicrophone = async ({
    meetId,
    conferenceId,
    userId,
    socket,
    isMicrophoneOn,
}: any) => {
    if (!meetId || !conferenceId || !userId) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    const meet = await Meet.findById(meetId).exec()
    if (!meet) {
        return socket.emit('error', { message: 'Meet not found' })
    }

    if (meet.conferenceId !== conferenceId) {
        return socket.emit('error', { message: 'Conference not found' })
    }

    if (!meet.userList.includes(userId)) {
        return socket.emit('error', {
            message: 'Access denied! User not found',
        })
    }

    socket.to(conferenceId).emit('userToggleMicro', userId, isMicrophoneOn)
}

export {
    handlerJoinRoom,
    handlerSendNewMessage,
    handlerJoinConference,
    handleToggleCamera,
    handleToggleMicrophone,
}
