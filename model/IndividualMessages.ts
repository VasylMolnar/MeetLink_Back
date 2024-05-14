import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const individualMessages = new Schema({
    userList: [],

    chatRoomId: {
        type: String,
        required: true,
    },

    status: {
        type: String,
    },

    lastDelete: {
        type: Boolean,
        default: false,
    },

    messages: [
        {
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
        },
    ],
})

export default mongoose.model('IndividualMessages', individualMessages)
