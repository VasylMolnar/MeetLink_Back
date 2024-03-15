import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const messageSchema = new Schema({
    senderId: {
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
    avatar: {
        type: String,
    },
    message: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const meetSchema = new Schema({
    adminID: {
        type: String,
        required: true,
    },

    meetName: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    time: {
        type: String,
    },

    date: {
        type: String,
    },

    img: {
        name: { type: String },
        data: { type: Buffer },
        contentType: { type: String },
    },

    roomId: {
        type: String,
        required: true,
    },

    conferenceId: {
        type: String,
        required: true,
    },

    // userList: [{ type: String }],
    userList: [{ type: Schema.Types.Mixed }],

    messages: [messageSchema],
})

export default mongoose.model('Meet', meetSchema)
