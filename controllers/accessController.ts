import mongoose from 'mongoose'
import Meet from '../model/Meet'
import User from '../model/User'

//Send  message to Admin
const handlerAccessReq = async (req: any, res: any) => {
    const { meetId, userId } = req.body
    if (!meetId || !userId)
        return res.status(400).json({ message: 'Id is required.' })

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
    console.log(req.body)
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
            await currentUser.save()
        }

        res.status(200).json({ message: `Successful` })
    } catch (error) {
        console.error('Error  send message to Admin:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

export { handlerAccessReq, handlerAccessRes }

//add api to delete message
