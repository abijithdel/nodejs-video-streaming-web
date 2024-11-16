const mongoose = require('mongoose')

const PlaylistModel = mongoose.Schema({
    user_id : { type:String },
    videos: [{
        vid: { type:String }
    }]
})

module.exports = mongoose.model('playlist',PlaylistModel)