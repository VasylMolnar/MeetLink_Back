import User from '../model/User'
import { format } from 'date-fns'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

// Register new user
const handleRegister = async (req: any, res: any) => {
    const { email, username, surname, password } = req.body

    if (!email || !username || !surname || !password)
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
            password: hashedPwd,
            date: newData,
        })

        res.status(201).json({ message: `New user ${username} created!` })
    } catch (err) {
        res.status(500).json({ message: err })
    }
}

// Login user
const handleLogin = async (req: any, res: any) => {
    const { email, password } = req.body

    if (!email || !password)
        return res
            .status(400)
            .json({ message: 'Email and password are required.' })

    //find user
    const currentUser = await User.findOne({ email: email }).exec()

    if (!currentUser)
        return res.status(401).json({
            message: 'User not found. Maybe email  incorrect',
        })

    //check PWD
    const pwdMatch = await bcrypt.compare(password, currentUser.password)

    if (pwdMatch) {
        const accessToken = jwt.sign(
            {
                UserInfo: {
                    id: currentUser._id,
                    username: currentUser.username,
                },
            },
            `${process.env.ACCESS_TOKEN_SECRET}`,
            {
                expiresIn: '30m', //30s
            }
        )

        const refreshToken = jwt.sign(
            { email },
            `${process.env.REFRESH_TOKEN_SECRET}`,
            { expiresIn: '1d' }
        )

        currentUser.refreshToken = refreshToken
        currentUser.publicRoomId = uuidv4()
        await currentUser.save()

        res.cookie('NewRequestJWT', refreshToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        })

        res.json({ accessToken, publicRoomId: currentUser.publicRoomId })
    } else {
        return res.status(401).json({
            message: 'Email or password error.',
        })
    }
}

// Logout user
const handleLogout = async (req: any, res: any) => {
    const cookies = req.cookies

    if (!cookies.NewRequestJWT) return res.sendStatus(204)

    //find user by refreshJWT
    const currentUser = await User.findOne({
        refreshToken: cookies.NewRequestJWT,
    }).exec()

    if (!currentUser) {
        res.clearCookie('NewRequestJWT', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        })
        return res.sendStatus(204)
    }

    currentUser.refreshToken = ''
    currentUser.publicRoomId = ''
    await currentUser.save()

    res.clearCookie('NewRequestJWT', {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
    })
    res.sendStatus(204)
}

export { handleRegister, handleLogin, handleLogout }
