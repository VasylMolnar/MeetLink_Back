import { whitelist } from './allowedOrigins'

export const corsOptions = {
    origin: (origin: any, callback: any) => {
        if (whitelist.includes(origin) || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200,
}
