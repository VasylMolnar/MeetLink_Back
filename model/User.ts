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

    password: {
        type: String,
        required: true,
    },

    phoneNumber: {
        type: String,
    },

    region: {
        type: String,
    },

    city: {
        type: String,
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

    // meetList: [{ type: String }],
    meetList: [{ type: Schema.Types.Mixed }],

    messages: [{ type: Schema.Types.Mixed }],

    refreshToken: {
        type: String,
    },
})

export default mongoose.model('User', userSchema)
