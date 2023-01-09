require('dotenv').config()
const connectDB = require("./db/connect")
const Post = require('./models/Post')
const User = require('./models/User')


const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        console.log('connected')
        // await Post.deleteMany({})
        // console.log('delete many post')
        await User.deleteMany({})
        console.log('delete many user')
    } catch (error) {
        console.log(error, 'error occured....')
    }

}

start()