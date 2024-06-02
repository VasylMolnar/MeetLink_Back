import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const userSchema = new Schema({
    publicRoomId: {
        type: String,
    },

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

    //list all meet
    meetList: [{ type: Schema.Types.Mixed }],

    //list all access message
    messages: [{ type: Schema.Types.Mixed }],

    //list all friends
    friendsList: [{ type: Schema.Types.Mixed }],

    //list individual message 2 person
    individualMessages: [{ type: Schema.Types.Mixed }],

    //individual call 2 person
    individualCall: [
        {
            userInfo: [],

            callRoomId: {
                type: String,
                required: true,
            },

            status: {
                type: String,
            },
        },
    ],

    refreshToken: {
        type: String,
    },
})

export default mongoose.model('User', userSchema)
