import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import User from '../model/User'
import Meet from '../model/Meet'
import IndividualMessages from '../model/IndividualMessages'
import { v4 as uuidv4 } from 'uuid'

//Get users list
const handleGetUsersList = async (req: any, res: any) => {
    const { id: search } = req.params
    if (!search) return res.status(400).json({ message: 'Search is required.' })

    //find user by id
    try {
        const usersList = await User.find(
            {
                $or: [
                    { email: search },
                    { username: search },
                    { surname: search },
                ],
            },
            '-password -publicRoomId -date -refreshToken -meetList -messages -individualMessages -individualCall -friendsList -__v'
        ).exec()
        res.status(201).send(usersList)
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

//Get user info
const handleGetUserInfo = async (req: any, res: any) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'User id is required.' })

    //find user by id
    try {
        let currentUser = await User.findById(
            id,
            '-password -publicRoomId -date -refreshToken -meetList -messages -individualMessages -individualCall -__v'
        ).exec()

        if (!currentUser)
            return res.status(401).json({ message: 'User not found.' })
        res.status(200).send(currentUser)
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

//Get user
const handleGetUser = async (req: any, res: any) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: 'User id is required.' })

    //find user by id
    try {
        let currentUser = await User.findById(
            id,
            '-password -publicRoomId -date -refreshToken  -__v'
        ).exec()

        if (!currentUser)
            return res.status(401).json({ message: 'User not found.' })

        let meetDetails: any = []
        let userDetails: any = []
        let individualMessagesDetails: any = []

        //Find all meet when user is invited
        if (currentUser.meetList.length !== 0) {
            //if user is invited we find all meet by meetList -> id
            const meetIds = currentUser.meetList

            meetDetails = await Meet.find({
                _id: { $in: meetIds },
                userList: id,
            })

            // filter incorrect meetId (if admin delete meet)
            //@ts-ignore
            const validMeetIds = meetDetails.map((meet) => meet._id.toString())
            currentUser.meetList = currentUser.meetList.filter((meetId) =>
                validMeetIds.includes(meetId)
            )

            await currentUser.save()
        }

        if (currentUser.friendsList.length !== 0) {
            const userIds = currentUser.friendsList

            userDetails = await User.find(
                {
                    _id: { $in: userIds },
                    friendsList: id,
                },
                '-password -publicRoomId -date -refreshToken -meetList -messages -__v'
            )

            // filter incorrect userId
            //@ts-ignore
            const validUserIds = userDetails.map((user) => user._id.toString())

            currentUser.friendsList = currentUser.friendsList.filter(
                (friendId) => validUserIds.includes(friendId)
            )

            await currentUser.save()
        }

        if (currentUser.individualMessages.length !== 0) {
            const messagesId = currentUser.individualMessages

            const messagesCollection = await IndividualMessages.find({
                _id: { $in: messagesId },
                userList: id,
            })

            individualMessagesDetails = await Promise.all(
                messagesCollection.map(async (messages) => {
                    const userIds = messages.userList
                    const userInfo = await User.find(
                        {
                            _id: { $in: userIds },
                        },
                        '-password -publicRoomId -date -friendsList -email -city -phoneNumber -region -refreshToken -meetList -individualCall -individualMessages -messages -__v'
                    )

                    return { messageInfo: messages, userInfo }
                })
            )
        }

        currentUser.individualMessages = individualMessagesDetails
        currentUser.meetList = meetDetails
        currentUser.friendsList = userDetails

        res.status(200).send(currentUser)
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Update user
const handlerUpdateUser = async (req: any, res: any) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'User id is required.' })

    let updateData = { ...req.body }

    //find user
    const currentUser = await User.findById({ _id: id }).exec()
    if (!currentUser)
        return res.status(501).json({ message: 'User not found.' })

    if (currentUser.email !== updateData.email) {
        updateData.refreshToken = jwt.sign(
            { email: updateData.email }, //decoded new Email for refreshTokenController
            `${process.env.REFRESH_TOKEN_SECRET}`,
            { expiresIn: '1d' }
        )

        res.cookie('NewRequestJWT', updateData.refreshToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        })
    }

    if (updateData.password === '') {
        updateData = { ...updateData, password: currentUser.password }
    } else {
        const hashedPwd = await bcrypt.hash(updateData.password, 10)
        updateData = { ...updateData, password: hashedPwd }
    }

    //save update data to User
    try {
        await currentUser.updateOne({ ...updateData }, { ...currentUser })

        res.status(200).json({
            message: 'User successfully update',
        })
    } catch (e) {
        res.status(501).json({ message: 'User cant be update' })
    }
}

//Delete user
const handlerDeleteUser = async (req: any, res: any) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: 'User id is required.' })

    //find user
    const currentUser = await User.findOneAndDelete({ _id: id }).exec()

    if (!currentUser) {
        res.status(501).json({ message: 'User cant be deleted' })
    } else {
        res.status(200).json({ message: 'User successfully deleted' })
    }
}

//Upload img
const handleUploadImg = async (req: any, res: any) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'User id is required.' })

    const imageInfo = req.file

    const folderToSave = req.body.folder
    // console.log(folderToSave, id, imageInfo)

    // find User
    const currentUser = await User.findById({ _id: id }).exec()
    if (!currentUser) return res.status(501).json({ message: 'User not found' })

    try {
        currentUser.avatar = {
            name: imageInfo.originalname,
            data: imageInfo.buffer,
            contentType: imageInfo.mimetype,
        }

        await currentUser.save()

        res.status(201).json({
            message: 'Зображення успішно завантажено на сервер!',
            avatar: currentUser.avatar,
        })
    } catch (e) {
        res.status(501).json({ message: 'User cant be update' })
    }
}

//User individual messages
const handlerCreateMessages = async (req: any, res: any) => {
    const { myId, userId } = req.body

    if (!myId || !userId)
        return res.status(400).json({ message: 'User id is required.' })

    //find myId
    const myInfo = await User.findById({ _id: myId }).exec()
    if (!myInfo) return res.status(501).json({ message: 'User not found.' })

    //find userId
    const currentUser = await User.findById({ _id: userId }).exec()
    if (!currentUser)
        return res.status(501).json({ message: 'User not found.' })

    try {
        const currentMessage = await IndividualMessages.create({
            userList: [myId, userId],
            chatRoomId: uuidv4(),
            messages: [],
        })

        myInfo.individualMessages.push(currentMessage._id.toString())
        currentUser.individualMessages.push(currentMessage._id.toString())

        await myInfo.save()
        await currentUser.save()

        res.status(200).json({
            message: `Message created!`,
            id: currentMessage._id,
        })
    } catch (e) {
        res.status(501).json({ message: 'Message cant be create' })
    }
}

const handlerDeleteMessages = async (req: any, res: any) => {
    const { messageId, userId } = req.body

    if (!messageId || !userId)
        return res.status(400).json({ message: 'User id is required.' })

    //find current user
    const currentUser = await User.findById({ _id: userId }).exec()
    if (!currentUser)
        return res.status(501).json({ message: 'User not found.' })

    const currentMessage = await IndividualMessages.findById({
        _id: messageId,
    }).exec()
    if (!currentMessage)
        return res.status(501).json({ message: 'Message not found.' })

    try {
        currentUser.individualMessages = currentUser.individualMessages.filter(
            (id) => id !== messageId
        )

        await currentUser.save()

        if (currentMessage.lastDelete === true) {
            await IndividualMessages.findByIdAndDelete({ _id: messageId })
        } else {
            currentMessage.lastDelete = true
            await currentMessage.save()
        }

        res.status(200).json({
            message: `Message delete!`,
        })
    } catch (e) {
        res.status(501).json({ message: 'Message cant be delete' })
    }
}

export {
    handleGetUsersList,
    handleGetUser,
    handlerUpdateUser,
    handlerDeleteUser,
    handleUploadImg,
    handleGetUserInfo,
    handlerCreateMessages,
    handlerDeleteMessages,
}
