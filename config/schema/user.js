const mongoose = require('mongoose')

const UserModel = new mongoose.Schema({
    email: { type:String, required: true},
    password: { type:String, required: true},
    img: { type:String, default:"default.jpg" },
    admin: { type:Boolean, default:false },
    auth_type: { type:String, default:"email" },
    Dc_uid: { type:String }
})

module.exports = mongoose.model('users',UserModel)