const express = require('express')
const routes = express.Router()
const VideoModel = require('../config/schema/video')
const HistoryModel = require('../config/schema/history')


function islogin(req, res, nest) {
    if (req.session.login) {
        nest()
    } else {
        res.redirect('/')
    }
}


routes.get('/', async (req, res) => {
    try {
        let allvideo = [];
        const videos = await VideoModel.find();
        for (var x = 0; x < videos.length; x++) {
            let video = videos[x]
            let title = video.title.substring(0, 30)
            video.title = title
            allvideo.push(video)
        }
        res.render('user/index', { user: req.session.user, allvideo });
    } catch (error) {
        console.log(error)
    }
})

routes.get('/video/:id', islogin, async (req, res) => {
    try {
        const { id } = req.params; 
        const userId = req.session.user._id; 
        const history = await HistoryModel.findOne({
            user_id: userId,
            vidoes: { $elemMatch: { vid: id } }
        });

        if (history) {
            return res.status(200).render('user/video', { user: req.session.user });
        } else {
            const newHistory = await HistoryModel.findOneAndUpdate(
                { user_id: userId },
                { $push: { vidoes: { vid: id } } }, 
                { new: true, upsert: true } 
            );
            await VideoModel.findByIdAndUpdate(id, { $inc: { views: 1 } }); 
            return res.status(200).render('user/video', { user: req.session.user });
        }
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send("An error occurred while processing your request."); 
    }
});

module.exports = routes;