const express = require('express')
const app = express()
require('dotenv').config()
const helmet = require("helmet")
const morgan = require("morgan")
const mongoose = require("mongoose")
const connectDB = require("./db/connect")
const userRoutes = require("./routes/users")
const authRoutes = require("./routes/auth")
const postRoutes = require("./routes/posts")
const authenticateUser = require('./middleware/authentication')




//middleware
app.use(express.json())
app.use(helmet())
app.use(morgan("common"))


//routes
app.use('/api/users', authenticateUser, userRoutes)
app.use('/api/posts', authenticateUser, postRoutes)
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
    res.send('<h1>Welcome to Loop Social API...</h1>')
})
const port = process.env.PORT || 8800



const start = async() => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, () => {
            console.log("Server is runnning at port", port)
        })
        
    } catch (error) {
        console.log(error, 'An error occured when trying to connnect to server or database')
    }
}


start()


//