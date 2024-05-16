import User from '../model/User'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

export const handleRefreshJWT = async (req: any, res: any) => {
    const cookies = req.cookies
    if (!cookies?.NewRequestJWT)
        return res.status(401).json({ message: 'Unauthorized' })

    //check to DB
    const refreshToken = cookies.NewRequestJWT

    //find user by refreshToken
    const currentUser = await User.findOne({ refreshToken }).exec()
    if (!currentUser) return res.sendStatus(403) //Forbidden

    //check refresh
    jwt.verify(
        refreshToken,
        `${process.env.REFRESH_TOKEN_SECRET}`,
        async (err: any, decoded: any) => {
            //user email === REFRESH_TOKEN decoded {email} authCont...
            if (err || currentUser.email !== (await decoded.email)) {
                return res.sendStatus(403)
            }

            //create JWT token
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

            //res.json({ accessToken })
            res.json({ accessToken, publicRoomId: currentUser.publicRoomId })
        }
    )
}
