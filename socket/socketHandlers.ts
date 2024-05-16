import signale from 'signale'
import Meet from '../model/Meet'
import User from '../model/User'
import IndividualMessages from '../model/IndividualMessages'

interface IRoom {
    io?: any
    socket?: any
    meetId?: string
    roomId?: string
    userId?: string
    conferenceId?: string
    data?: any
    metadata?: any
    chatId?: any
    individualMessageId?: any
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

            const currentDate = new Date()
            const day = currentDate.getDate()
            const month = currentDate.getMonth() + 1
            const year = currentDate.getFullYear()

            const currentAttendees = meet.attendees.find(
                (item) => item.date === `${day}/${month}/${year}`
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
                    date: `${day}/${month}/${year}`,
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
                const currentDate = new Date()
                const day = currentDate.getDate()
                const month = currentDate.getMonth() + 1
                const year = currentDate.getFullYear()

                const currentAttendees = currentMeet.attendees.find(
                    (item) => item.date === `${day}/${month}/${year}`
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

//individual messages
const handlerJoinMessageRoom = async ({
    socket,
    individualMessageId,
    roomId,
    userId,
}: IRoom) => {
    if (!individualMessageId || !roomId || !userId) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    //find individual Message
    const currentMessage = await IndividualMessages.findById(
        individualMessageId
    ).exec()

    if (!currentMessage) {
        return socket.emit('error', { message: 'Message not found' })
    }

    if (!currentMessage.userList.some((id) => id === userId)) {
        return socket.emit('error', {
            message: 'Access denied!',
        })
    }

    try {
        if (currentMessage.status === userId) {
            currentMessage.status = ''
            await currentMessage.save()
        }
    } catch (error) {
        signale.error('Failed to save:', error)

        return socket.emit('error', {
            message: 'Failed to save',
        })
    }

    signale.info(`A user ${userId} join to chat room ${roomId}`)
    socket.join(roomId)

    socket.emit('loadMessage', currentMessage.messages)

    // User Leave from room
    socket.on('disconnect', () => {
        signale.info(`A user ${userId} leave from chat room ${roomId}`)
        socket.leave(roomId)
    })
}

const handlerSendMessage = async ({ io, socket, data }: IRoom) => {
    const {
        messageId,
        roomId,
        message,
        senderId,
        username,
        surname,
        avatar,
        recipient,
    } = data

    if (
        !messageId ||
        !roomId ||
        !message ||
        !senderId ||
        !username ||
        !surname ||
        !recipient
    ) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    //find individual Message
    const currentMessage = await IndividualMessages.findById(messageId).exec()

    if (!currentMessage) {
        return socket.emit('error', { message: 'Message not found' })
    }

    if (currentMessage.chatRoomId !== roomId) {
        return socket.emit('error', { message: 'Room not found' })
    }

    if (!currentMessage.userList.some((user) => user === senderId)) {
        return socket.emit('error', {
            message: 'Access denied!',
        })
    }

    try {
        const socketsInRoom = io.of('/').adapter.rooms.get(roomId)
        const numUsersInRoom = socketsInRoom ? socketsInRoom.size : 0

        if (currentMessage.lastDelete === true) {
            const currentUser = await User.findById({ _id: recipient }).exec()
            if (!currentUser)
                return socket.emit('error', {
                    message: 'Message cant be sent',
                })

            currentUser.individualMessages.push(currentMessage._id.toString())
            currentMessage.lastDelete = false

            await currentUser.save()
        }

        currentMessage.messages.push({
            senderId,
            username,
            surname,
            message,
            avatar,
        })

        currentMessage.status = recipient
        await currentMessage.save()

        //emit reload status in recipient
        if (numUsersInRoom === 1) {
            const currentUser = await User.findById({ _id: recipient }).exec()
            if (!currentUser)
                return socket.emit('error', {
                    message: 'Message cant be sent',
                })

            const recipientPublicRoomId = currentUser.publicRoomId

            //user is online by not see our message
            if (recipientPublicRoomId) {
                signale.info(
                    `A user  ${senderId} join to user public room ${recipientPublicRoomId}`
                )
                await socket.join(recipientPublicRoomId)
                await socket
                    .to(recipientPublicRoomId)
                    .emit('reloadState', {
                        state: 'message',
                        username,
                        surname,
                    })

                // User Leave from room
                signale.info(
                    `A user  ${senderId} leave from user public room ${recipientPublicRoomId}`
                )
                await socket.leave(recipientPublicRoomId)
            }
        }

        io.to(roomId).emit('loadMessage', currentMessage.messages)
    } catch (error) {
        signale.error('Failed to save message to database:', error)

        return socket.emit('error', {
            message: 'Failed to save message',
        })
    }
}

// Join Public Room
const handlerJoinPublicRoom = async ({ socket, publicRoomId, userId }: any) => {
    if (!userId || !publicRoomId) {
        return socket.emit('error', { message: 'Missing required fields' })
    }

    const currentUser = await User.findById(userId).exec()
    if (!currentUser) {
        signale.error('A user cant be connected to Socket')
        return socket.emit('error', { message: 'User not found' })
    }

    if (
        !currentUser.publicRoomId ||
        currentUser.publicRoomId !== publicRoomId
    ) {
        signale.error('A user cant be connected to Socket. Access denied!')
        return socket.emit('error', { message: 'Access denied!' })
    }

    signale.info(`A user  ${userId} join to room ${publicRoomId}`)
    socket.join(publicRoomId)

    // User Leave from room
    socket.on('disconnect', () => {
        signale.info(`A user  ${userId} leave from room ${publicRoomId}`)
        socket.leave(publicRoomId)
    })
}

export {
    handlerJoinPublicRoom,
    handlerJoinRoom,
    handlerSendNewMessage,
    handlerJoinConference,
    handleToggleCamera,
    handleToggleMicrophone,
    handleSendNewMetaData,
    handlerSendNewMeetMessage,
    handlerJoinMessageRoom,
    handlerSendMessage,
}
