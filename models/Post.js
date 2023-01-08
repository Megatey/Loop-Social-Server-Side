const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    desc: {
        type: String,
        maxLength: 500,
        default: ''
    },
    images: {
        type: Array,
        default: []
    },
    likes: {
        type: Array,
        default: []
    },
    comments: {
        type: Array,
        default: []
    },
    createdBy:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required: [true, 'Please provide user']
    }

}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)