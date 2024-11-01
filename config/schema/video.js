const mongoose = require('mongoose')

const VideoModel = new mongoose.Schema({
    video: { type:String },
    img: { type:String },
    title: { type:String },
    title: { type:String },
    description: { type:String },
    category: { type:String },
    like: { type:Number, default:0 },
    views: { type:Number, default:0 }
})

module.exports = mongoose.model('video',VideoModel)