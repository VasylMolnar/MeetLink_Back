import User from '../model/User'
import jwt from 'jsonwebtoken'

export const verifyJWT = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401)

    //select token
    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        `${process.env.ACCESS_TOKEN_SECRET}`,
        async (err: any, decoded: any) => {
            if (err) return res.sendStatus(403) //invalid token

            const id = decoded.UserInfo.id
            const username = decoded.UserInfo.username

            //check sign token to user
            const currentUser = await User.findOne({
                _id: id,
                username,
            })
            if (!currentUser) return res.sendStatus(401)

            //if token is valid
            next()
        }
    )
}
