import Meet from '../model/Meet'
import User from '../model/User'

//Create meet
const handlerCreateMeet = async (req: any, res: any) => {
    const { adminID, meetName, description, time, date } = JSON.parse(
        req.body.values
    )
    const imageInfo = req.file

    if (!adminID || !meetName || !description || !time || !date || !imageInfo)
        return res.status(400).json({ message: 'All fields  are required.' })

    //find user
    const currentUser = await User.findById(adminID).exec()
    if (!currentUser)
        return res.status(501).json({ message: 'User not found.' })

    //Add new meet to DB
    try {
        const response = await Meet.create({
            adminID,
            meetName,
            description,
            time,
            date,
            userList: [adminID],
            img: {
                name: imageInfo.originalname,
                data: imageInfo.buffer,
                contentType: imageInfo.mimetype,
            },
        })

        const meetId = response['_id'].toString()
        currentUser.meetList.push(meetId)
        await currentUser.save()

        res.status(201).json({ message: `New meet ${meetName} created!` })
    } catch (err) {
        res.status(500).json({ message: err })
    }
}

//Update meet
const handlerUpdateMeet = async (req: any, res: any) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'Meet id is required.' })

    const updateMeetInfo = { ...req.body }
    if (!updateMeetInfo)
        return res.status(400).json({ message: 'All field are required.' })

    //find meet by meet id
    const currentMeet = await Meet.findById(id).exec()
    if (!currentMeet)
        return res.status(501).json({ message: 'Meet not found.' })

    try {
        await currentMeet.updateOne({ ...updateMeetInfo }, { ...currentMeet })

        res.status(200).json({
            message: 'Meet successfully update',
        })
    } catch (err) {
        res.status(501).json({ message: 'Meet cant be update' })
    }
}

//Delete meet
const handlerDeleteMeet = async (req: any, res: any) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'Meet id is required.' })

    //find meet by meet id
    const currentMeet = await Meet.findById(id).exec()
    if (!currentMeet)
        return res.status(501).json({ message: 'Meet cant be deleted' })

    //find user
    const currentUser = await User.findById(currentMeet.adminID).exec()
    if (!currentUser)
        return res.status(501).json({ message: 'User not found.' })

    try {
        await currentMeet.deleteOne()

        currentUser.meetList = currentUser.meetList.filter(
            (meetId) => meetId !== id
        )

        await currentUser.save()

        res.status(200).json({ message: 'Meet successfully deleted' })
    } catch (err) {
        res.status(501).json({ message: 'Meet cant be deleted' })
    }
}

//Upload img
const handleUploadImg = async (req: any, res: any) => {
    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'Meet id is required.' })

    const imageInfo = req.file

    const currentMeet = await Meet.findById({ _id: id }).exec()
    if (!currentMeet) return res.status(501).json({ message: 'Meet not found' })

    try {
        currentMeet.img = {
            name: imageInfo.originalname,
            data: imageInfo.buffer,
            contentType: imageInfo.mimetype,
        }

        await currentMeet.save()

        res.status(201).json({
            message: 'Img save successfully',
        })
    } catch (e) {
        res.status(501).json({ message: 'Meet cant be update' })
    }
}

export {
    handlerCreateMeet,
    handlerUpdateMeet,
    handlerDeleteMeet,
    handleUploadImg,
}
