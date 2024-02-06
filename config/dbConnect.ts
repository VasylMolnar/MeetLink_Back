import mongoose from 'mongoose'
import signale from 'signale'

export default async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_CONNECT}`, {
            tls: true,
            tlsAllowInvalidCertificates: true,
            // useUnifiedTopology: true,
            // useNewUrlParser: true,
        })
        signale.success('Success Connected to MongoDB')
    } catch (e) {
        signale.fatal('Connected to MongoDB', e)
    }
}
