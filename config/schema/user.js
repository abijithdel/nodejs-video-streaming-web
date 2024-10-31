const mongoose = require('mongoose')

const UserModel = new mongoose.Schema({
    email: { type:String, required: true},
    password: { type:String, required: true},
    img: { type:String, default:"default.jpg" },
    admin: { type:Boolean, default:false },
    auth_type: { type:String, default:"email" }
})

module.exports = mongoose.model('users',UserModel)