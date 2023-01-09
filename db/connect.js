const mongoose = require('mongoose')


 const connectDB = (url) => {
    mongoose.connect(url, {
        useNewUrlParser:true,
        useCreateIndex:true,
        useFindAndModify:true,
        useUnifiedTopology: true
    }, () => {console.log("database connected")})
}

module.exports = connectDB