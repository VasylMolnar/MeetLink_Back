import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import User from '../model/User'
import Meet from '../model/Meet'

//Get user
const handleGetUser = async (req: any, res: any) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: 'User id is required.' })

    //find user by id
    try {
        let currentUser = await User.findById(
            id,
            '-password -date -refreshToken  -__v'
        ).exec()

        if (!currentUser)
            return res.status(401).json({ message: 'User not found.' })

        //Find all meet when user is invited
        //if user is not invited
        if (currentUser.meetList.length === 0) {
            return res.status(200).json(currentUser)
        }

        //if user is invited we find all meet by meetList -> id
        const meetIds = currentUser.meetList

        const meetDetails = await Meet.find({
            _id: { $in: meetIds },
            userList: id,
        })

        // filter incorrect meetId (if admin delete meet)
        const validMeetIds = meetDetails.map((meet) => meet._id.toString())
        currentUser.meetList = currentUser.meetList.filter((meetId) =>
            validMeetIds.includes(meetId)
        )

        await currentUser.save()

        currentUser.meetList = meetDetails
        res.status(201).send(currentUser)
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

        res.cookie('jwt', updateData.refreshToken, {
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
        })
    } catch (e) {
        res.status(501).json({ message: 'User cant be update' })
    }
}

export { handleGetUser, handlerUpdateUser, handlerDeleteUser, handleUploadImg }
