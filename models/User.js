const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        minLength: 3,
        maxLength: 50,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide email address'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'please provide valid email.'],
        unique:  [
            true,
            "Please use unique mail to create an account",
          ],
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minLength: 6
    },
    profilePicture: {
        type: String,
        default: ""
    },
    coverPicture: {
        type: String,
        default: ""
    },
    followers: {
        type: Array,
        default: []
    },
    followings: {
        type: Array,
        default: []
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    desc: {
        type: String,
        maxLength: 100,
        default: ""
    },
    city: {
        type: String,
        maxLength: 50,
        default: ""
    },
    from: {
        type: String,
        maxLength: 50,
        default: ""
    },
    relationship: {
        type: Number,
        enum: [1, 2, 3, 4],
        default: null
    }

}, { timestamps: true })

//Password Hashing
userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

//Token Creation
userSchema.methods.createJwT = function () {
    return jwt.sign({ userId: this._id, name: this.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME, })
}

//comparation of Password for Verification
userSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    return isMatch
}

module.exports = mongoose.model('User', userSchema)
