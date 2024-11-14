const mongoose = require('mongoose')

const UserModel = new mongoose.Schema({
    email: { type:String },
    password: { type:String },
    img: { type:String, default:"default.jpg" },
    admin: { type:Boolean, default:false },
    auth_type: { type:String, default:"email" },
    Dc_uid: { type:String }
})

module.exports = mongoose.model('users',UserModel)