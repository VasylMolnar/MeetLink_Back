import signale from 'signale'
import Meet from '../model/Meet'

const handlerJoinRoom = async (
    socket: any,
    meetId: any,
    roomId: any,
    userId: any
) => {
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
}

const handlerSendNewMessage = async (io: any, socket: any, data: any) => {
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

export { handlerJoinRoom, handlerSendNewMessage }
