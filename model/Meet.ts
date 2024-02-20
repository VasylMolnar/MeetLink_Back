import mongoose from 'mongoose'
import { Schema } from 'mongoose'

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

    // userList: [{ type: String }],
    userList: [{ type: Schema.Types.Mixed }],
})

export default mongoose.model('Meet', meetSchema)
