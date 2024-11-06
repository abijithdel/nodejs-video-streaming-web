const express = require('express')
const routes = express.Router()
const VideoModel = require('../config/schema/video')
const HistoryModel = require('../config/schema/history')
const LikeModel = require('../config/schema/likes')


function islogin(req, res, nest) {
    if (req.session.login) {
        nest()
    } else {
        res.redirect('/auth/signin')
    }
}


routes.get('/', async (req, res) => {
    try {
        let allvideo = [];
        let historylog = [];
        const videos = await VideoModel.find();
        for (var x = 0; x < videos.length; x++) {
            let video = videos[x]
            let title = video.title.substring(0, 30)
            video.title = title
            allvideo.push(video)
        }
        if (req.session.login) {
            const userid = req.session.user._id
            const history = await HistoryModel.findOne({ user_id: userid })
            if(history){
                for (var key = 0; key < history.vidoes.length; key++) {
                    const video = await VideoModel.findById(history.vidoes[key].vid)
                    const title = video.title.substring(0, 17)
                    video.title = title
                    historylog.push(video)
                }
            }else{
                console.log('New user log in')
            }

        }
        res.render('user/index', { user: req.session.user, allvideo, historylog });
    } catch (error) {
        console.log(error)
    }
})

routes.get('/video/:id', islogin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user._id;
        const video = await VideoModel.findById(id)
        const videos = await VideoModel.find()
        let isliked;
        const history = await HistoryModel.findOne({
            user_id: userId,
            vidoes: { $elemMatch: { vid: id } }
        });

        const inlike = await LikeModel.findOne({
            user_id: userId,
            vidoes: { $elemMatch: { vid: id } }
        });

        for(let key in videos){
            const title = videos[key].title.substring(0,30)
            videos[key].title = title
        }

        if(inlike){
            isliked = true
        }else{
            isliked = false
        }

        if (history) {
            return res.status(200).render('user/video', { user: req.session.user, video, isliked, videos});
        } else {
            const newHistory = await HistoryModel.findOneAndUpdate(
                { user_id: userId },
                { $push: { vidoes: { vid: id } } },
                { new: true, upsert: true }
            );
            await VideoModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
            return res.status(200).render('user/video', { user: req.session.user, video, isliked, videos});
        }
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send("An error occurred while processing your request.");
    }
});

routes.get('/likeaction', async (req, res) => {
    try {
        const { videoId } = req.query;
        const userId = req.session.user._id;
        let isliked;

        // Check if the video is already liked by this user
        const inlike = await LikeModel.findOne({
            user_id: userId,
            vidoes: { $elemMatch: { vid: videoId } }
        });

        if (inlike) {
            // Video is already liked by the user; remove the like
            await LikeModel.findOneAndUpdate(
                { user_id: userId },
                { $pull: { vidoes: { vid: videoId } } },
                { new: true }
            );

            // Decrement the like count in the video
            const video = await VideoModel.findByIdAndUpdate(
                videoId,
                { $inc: { like: -1 } },
                { new: true, upsert: true}
            );

            if (!video) {
                return res.status(404).json({ error: 'Video not found' });
            }

            return res.status(200).json({ like: video.like, message: 'Like removed', isliked: false });
        } else {
            // Video is not yet liked; add the like
            await LikeModel.findOneAndUpdate(
                { user_id: userId },
                { $addToSet: { vidoes: { vid: videoId } } }, // Corrected 'videos' field
                { new: true, upsert: true }
            );

            // Increment the like count in the video
            const video = await VideoModel.findByIdAndUpdate(
                videoId,
                { $inc: { like: 1 } },
                { new: true }
            );

            if (!video) {
                return res.status(404).json({ error: 'Video not found' });
            }

            return res.status(200).json({ like: video.like, message: 'Like added', isliked: true });
        }
    } catch (error) {
        console.error('Error in /likeaction route:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

module.exports = routes;