import { whitelist } from '../config/allowedOrigins'

export const credentials = (req: any, res: any, next: any) => {
    // console.log('headers', req.headers)
    // console.log('body', req.body)

    const origin = req.headers.origin

    if (whitelist.includes(origin)) {
        res.header('Access-Control-Allow-Credentials', true)
    }

    next()
}
