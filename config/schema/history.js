const mongoose = require('mongoose')

const HistoryModel = new mongoose.Schema({
    user_id: { type:String },
    vidoes: [{
        vid: { type:String }
    }]
})

module.exports = mongoose.model('history',HistoryModel)