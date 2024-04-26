import signale from 'signale'
import Meet from '../model/Meet'
import User from '../model/User'

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

// chat
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

// video meet
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

    // add user to attendees list
    const currentUser = await User.findById(userId).exec()

    if (currentUser) {
        try {
            const currentTime = new Date()
            const currentHour = currentTime.getHours()
            const currentMinute = currentTime.getMinutes()
            const currentSecond = currentTime.getSeconds()

            const currentDate = new Date().toLocaleDateString()

            const currentAttendees = meet.attendees.find(
                (item) => item.date === currentDate
            )

            if (currentAttendees) {
                const user = currentAttendees.list.find(
                    (item) => item.userId === userId
                )

                if (user) {
                    user.joinTime = `${currentHour}:${currentMinute}:${currentSecond}`
                    user.leaveTime = null
                } else {
                    currentAttendees.list.push({
                        userId,
                        username: currentUser.username,
                        surname: currentUser.surname,
                        joinTime: `${currentHour}:${currentMinute}:${currentSecond}`,
                        leaveTime: null,
                    })
                }
            } else {
                meet.attendees.push({
                    date: currentDate,
                    list: [
                        {
                            userId,
                            username: currentUser.username,
                            surname: currentUser.surname,
                            joinTime: `${currentHour}:${currentMinute}:${currentSecond}`,
                            leaveTime: null,
                        },
                    ],
                })
            }

            await meet.save()
        } catch (e) {
            console.log('joinTime error', e)
        }
    }
    socket.join(conferenceId)
    socket.to(conferenceId).emit('user connected', userId, metadata)

    socket.on('disconnect', async () => {
        const currentMeet = await Meet.findById(meetId).exec()
        if (!currentMeet) {
            return socket.emit('error', { message: 'Meet not found' })
        }

        const currentTime = new Date()
        const currentHour = currentTime.getHours()
        const currentMinute = currentTime.getMinutes()
        const currentSecond = currentTime.getSeconds()

        signale.info(
            `A user  ${userId} from this meet ${meetId}  leave from conference ${conferenceId}`
        )

        if (currentUser) {
            try {
                const currentDate = new Date().toLocaleDateString()

                const currentAttendees = currentMeet.attendees.find(
                    (item) => item.date === currentDate
                )

                if (currentAttendees) {
                    const user = currentAttendees.list.find(
                        (item) => item.userId === userId
                    )

                    if (user) {
                        user.leaveTime = `${currentHour}:${currentMinute}:${currentSecond}`
                    }
                }

                await currentMeet.save()
            } catch (e) {
                console.log('DISCONNECT error leaveTime  ', e)
            }
        }

        socket.to(conferenceId).emit('user disconnected', userId)
        socket.leave(conferenceId)
    })
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

const handleSendNewMetaData = async ({
    meetId,
    conferenceId,
    userId,
    socket,
    newMetaData,
}: any) => {
    if (!meetId || !conferenceId || !userId || !newMetaData) {
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

    socket.to(conferenceId).emit('userChangeMetaData', userId, newMetaData)
}

const handlerSendNewMeetMessage = async ({ io, socket, data }: IRoom) => {
    const { meetId, conferenceId, message, senderId, username, surname } = data

    if (
        !meetId ||
        !conferenceId ||
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

    if (meet.conferenceId !== conferenceId) {
        return socket.emit('error', { message: 'Conference not found' })
    }

    if (!meet.userList.includes(senderId)) {
        return socket.emit('error', {
            message: 'Access denied! User not found',
        })
    }

    try {
        const message = {
            ...data,
            createdAt: Date.now(),
        }
        io.to(conferenceId).emit('getNewMeetMessage', message)
    } catch (error) {
        signale.error('Failed to save message to database:', error)

        return socket.emit('error', {
            message: 'Failed to save message',
        })
    }
}

export {
    handlerJoinRoom,
    handlerSendNewMessage,
    handlerJoinConference,
    handleToggleCamera,
    handleToggleMicrophone,
    handleSendNewMetaData,
    handlerSendNewMeetMessage,
}
