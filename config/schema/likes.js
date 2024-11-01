const mongoose = require('mongoose')

const LikeModel = new mongoose.Schema({
    user_id: { type:String },
    vidoes: [{
        vid: { type:String }
    }]
})

module.exports = mongoose.model('like',LikeModel)