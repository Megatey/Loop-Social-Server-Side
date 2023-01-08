const mongoose = require('mongoose')


 const connectDB = (url) => {
    mongoose.connect(url, () => {console.log("database connected")})
}

module.exports = connectDB