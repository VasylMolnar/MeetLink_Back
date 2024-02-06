import User from '../model/User'
import { format } from 'date-fns'
import bcrypt from 'bcrypt'

// Register new user
const handleRegister = async (req: any, res: any) => {
    const { email, username, surname, password, phoneNumber } = req.body

    if (!email || !username || !surname || !password || !phoneNumber)
        return res.status(400).json({ message: 'All fields  are required.' })

    // check for duplicate email in the db
    const emailDuplicate = await User.findOne({ email: email }).exec()

    if (emailDuplicate)
        return res.status(409).json({ message: 'Email is already in use' })

    //Add new user to DB
    try {
        const hashedPwd = await bcrypt.hash(password, 10)
        const newData = format(new Date(), 'yyyy-MM-dd\tHH:mm:ss')

        await User.create({
            email,
            username,
            surname,
            phoneNumber,
            password: hashedPwd,
            date: newData,
        })

        res.status(201).json({ success: `New user ${username} created!` })
    } catch (err) {
        res.status(500).json({ message: err })
    }
}
// Login user
const handleLogin = async (req: any, res: any) => {}

// Logout user
const handleLogout = async (req: any, res: any) => {}

export { handleRegister, handleLogin, handleLogout }
