import Meet from '../model/Meet'

//Create meet
const handlerCreateMeet = async (req: any, res: any) => {
    const { adminID, meetName, description, time, date } = req.body

    if (!adminID || !meetName || !description || !time || !date)
        return res.status(400).json({ message: 'All fields  are required.' })

    //Add new meet to DB
    try {
        await Meet.create({ adminID, meetName, description, time, date })

        res.status(201).json({ success: `New meet ${meetName} created!` })
    } catch (err) {
        res.status(500).json({ message: err })
    }
}

//Update meet
const handlerUpdateMeet = async (req: any, res: any) => {}

//Delete meet
const handlerDeleteMeet = async (req: any, res: any) => {}

export { handlerCreateMeet, handlerUpdateMeet, handlerDeleteMeet }
