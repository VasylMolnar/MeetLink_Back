import mongoose from 'mongoose'
import Meet from '../model/Meet'
import User from '../model/User'

// ACCESS meet
//Send  message to Admin
const handlerAccessReq = async (req: any, res: any) => {
    const { meetId, userId } = req.body
    if (!meetId || !userId)
        return res.status(400).json({ message: 'Id is required.' })

    if (
        !mongoose.Types.ObjectId.isValid(meetId) ||
        !mongoose.Types.ObjectId.isValid(userId)
    ) {
        return res.status(400).json({ message: 'Invalid ID format.' })
    }

    //find meet
    const currentMeet = await Meet.findById(meetId).exec()
    if (!currentMeet)
        return res.status(501).json({ message: 'Meet not found.' })

    //find user
    const currentUser = await User.findById({ _id: userId })
    if (!currentUser)
        return res.status(401).json({ message: 'User not found.' })

    //find meet admin
    const currentMeetAdmin = await User.findById(
        currentMeet.adminID,
        '-password -date -refreshToken  -__v'
    ).exec()
    if (!currentMeetAdmin)
        return res.status(401).json({ message: 'Admin not found.' })

    try {
        currentMeetAdmin.messages.push({
            _id: new mongoose.Types.ObjectId(),
            meetId,
            userId,
            username: currentUser.username,
            surname: currentUser.surname,
            email: currentUser.email,
            type: 'Request',
        })

        await currentMeetAdmin.save()
        res.status(201).json({ message: `Message sent successfully` })
    } catch (error) {
        console.error('Error  send message to Admin:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

//Get message from Admin
const handlerAccessRes = async (req: any, res: any) => {
    const { meetId, userId, messageId, access } = req.body
    if (!meetId || !userId || !messageId)
        return res.status(400).json({ message: 'All field are required.' })

    //find meet
    const currentMeet = await Meet.findById(meetId).exec()
    if (!currentMeet)
        return res.status(501).json({ message: 'Meet not found.' })

    //find user
    const currentUser = await User.findById({ _id: userId })
    if (!currentUser)
        return res.status(401).json({ message: 'User not found.' })

    //find meet admin
    const currentMeetAdmin = await User.findById(
        currentMeet.adminID,
        '-password -date -refreshToken  -__v'
    ).exec()
    if (!currentMeetAdmin)
        return res.status(401).json({ message: 'Admin not found.' })

    try {
        currentMeetAdmin.messages = currentMeetAdmin.messages.filter(
            (message) => message._id.toString() !== messageId
        )
        await currentMeetAdmin.save()

        if (access) {
            currentMeet.userList.push(userId)
            await currentMeet.save()

            currentUser.meetList.push(meetId)
            currentUser.messages.push({
                _id: new mongoose.Types.ObjectId(),
                meetId,
                userId: currentMeetAdmin._id,
                username: currentMeetAdmin.username,
                surname: currentMeetAdmin.surname,
                email: currentMeetAdmin.email,
                type: 'Response',
            })
            await currentUser.save()
        }

        res.status(200).json({ message: `Successful` })
    } catch (error) {
        console.error('Error  send message to Admin:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

const handlerDeleteMessage = async (req: any, res: any) => {
    const { userId, messageId } = req.body
    if (!userId || !messageId)
        return res.status(400).json({ message: 'All field are required.' })

    //find user
    const currentUser = await User.findById({ _id: userId })
    if (!currentUser)
        return res.status(401).json({ message: 'User not found.' })

    try {
        currentUser.messages = currentUser.messages.filter(
            (message) => message._id.toString() !== messageId
        )
        await currentUser.save()

        res.status(200).json({ message: `Successful` })
    } catch (error) {
        console.error('Error  send message to Admin:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// ACCESS follow
//Send  message to User
const handlerAccessReqFollow = async (req: any, res: any) => {
    const { followUserId, userId } = req.body
    if (!followUserId || !userId)
        return res.status(400).json({ message: 'Id is required.' })

    //find user
    const currentUser = await User.findById({ _id: userId })
    if (!currentUser)
        return res.status(401).json({ message: 'User not found.' })

    //find follow user
    const followUser = await User.findById({ _id: followUserId })
    if (!followUser) return res.status(401).json({ message: 'User not found.' })

    try {
        followUser.messages.push({
            _id: new mongoose.Types.ObjectId(),
            userId,
            username: currentUser.username,
            surname: currentUser.surname,
            email: currentUser.email,
            type: 'Request',
        })

        await followUser.save()
        res.status(201).json({ message: `Message sent successfully` })
    } catch (error) {
        console.error('Error  send message to User:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

//Get message from User
const handlerAccessResFollow = async (req: any, res: any) => {
    const { followUserId, userId, messageId, access } = req.body
    if (!followUserId || !userId || !messageId)
        return res.status(400).json({ message: 'All field are required.' })

    //find follow user
    const followUser = await User.findById({ _id: followUserId })
    if (!followUser) return res.status(401).json({ message: 'User not found.' })

    //find user
    const currentUser = await User.findById({ _id: userId })
    if (!currentUser)
        return res.status(401).json({ message: 'User not found.' })

    try {
        currentUser.messages = currentUser.messages.filter(
            (message) => message._id.toString() !== messageId
        )

        if (access) {
            currentUser.friendsList.push(followUserId)
            followUser.friendsList.push(userId)

            followUser.messages.push({
                _id: new mongoose.Types.ObjectId(),
                userId: currentUser._id,
                username: currentUser.username,
                surname: currentUser.surname,
                email: currentUser.email,
                type: 'Response',
            })

            await followUser.save()
        }

        await currentUser.save()

        res.status(200).json({ message: `Successful` })
    } catch (error) {
        console.error('Error  send message to Admin:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

const handlerDeleteFollow = async (req: any, res: any) => {
    const { followUserId, userId } = req.body
    if (!followUserId || !userId)
        return res.status(400).json({ message: 'All field are required.' })

    //find follow user
    const followUser = await User.findById({ _id: followUserId })
    if (!followUser) return res.status(401).json({ message: 'User not found.' })

    //find user
    const currentUser = await User.findById({ _id: userId })
    if (!currentUser)
        return res.status(401).json({ message: 'User not found.' })

    try {
        //@ts-ignore
        currentUser.friendsList = currentUser.friendsList.filter(
            (friendId) => friendId !== followUserId
        )

        //@ts-ignore
        followUser.friendsList = followUser.friendsList.filter(
            (friendId) => friendId !== userId
        )

        await currentUser.save()
        await followUser.save()

        res.status(200).json({ message: `Successful` })
    } catch (error) {
        console.error('Error  send message to Admin:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

export {
    handlerAccessReq,
    handlerAccessRes,
    handlerDeleteMessage,
    handlerAccessReqFollow,
    handlerAccessResFollow,
    handlerDeleteFollow,
}
