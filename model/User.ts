import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },

    username: {
        type: String,
        required: true,
    },

    surname: {
        type: String,
        required: true,
    },

    phoneNumber: {
        type: String,
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    avatar: {
        name: { type: String },
        data: { type: Buffer },
        contentType: { type: String },
    },

    meetList: [{ type: String }],

    refreshToken: {
        type: String,
    },
})

export default mongoose.model('User', userSchema)
