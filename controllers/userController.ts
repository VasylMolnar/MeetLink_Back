import User from '../model/User'
import Meet from '../model/Meet'

//Get user
const handleGetUser = async (req: any, res: any) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: 'User id is required.' })

    //find user by id
    try {
        const currentUser = await User.findById(
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

        const meetDetails = await Meet.find({ _id: { $in: meetIds } })

        res.status(201).json({
            ...currentUser.toObject(),
            meetList: meetDetails,
        })
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}

// Update user
const handlerUpdateUser = async (req: any, res: any) => {}

//Delete user
const handlerDeleteUser = async (req: any, res: any) => {}

export { handleGetUser, handlerUpdateUser, handlerDeleteUser }
