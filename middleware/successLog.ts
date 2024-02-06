import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import signale from 'signale'

export default async (req: any, res: any, next: any) => {
    const data = `${format(new Date(), 'yyyy-MM-dd\tHH:mm:ss')}`
    const logItem = `\n ##${data} \t ${uuidv4()} \t ${req.method}\t${
        req.headers.origin
    }\t${req.url}`

    try {
        if (!fs.existsSync('logs')) await fsPromises.mkdir('logs')

        await fsPromises.appendFile(
            path.join(__dirname, '..', 'logs', 'successLog.txt'),
            logItem
        )

        signale.success(`${req.method} ${req.path}`)
        next()
    } catch (error) {
        signale.error(error)
    }
}
