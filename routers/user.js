const express = require('express')
const routes = express.Router()
const VideoModel = require('../config/schema/video')
const HistoryModel = require('../config/schema/history')
const LikeModel = require('../config/schema/likes')
const UserModel = require('../config/schema/user')
const upload = require('../config/multer')
const PlaylistModel = require('../config/schema/playlist')

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
            if (history) {
                for (var key = 0; key < history.vidoes.length; key++) {
                    const video = await VideoModel.findById(history.vidoes[key].vid)
                    if (video) {
                        const title = video.title.substring(0, 17)
                        video.title = title
                        historylog.push(video)
                    }
                }
            } else {
                console.log('log in')
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

        const playlist = await PlaylistModel.findOne({
            user_id: userId,
            videos: { $elemMatch: { vid: id } }
        });

        for (let key in videos) {
            const title = videos[key].title.substring(0, 30)
            videos[key].title = title
        }

        if (inlike) {
            isliked = true
        } else {
            isliked = false
        }

        if (history) {
            return res.status(200).render('user/video', { user: req.session.user, video, isliked, videos, playlist });
        } else {
            const newHistory = await HistoryModel.findOneAndUpdate(
                { user_id: userId },
                { $push: { vidoes: { vid: id } } },
                { new: true, upsert: true }
            );
            await VideoModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
            return res.status(200).render('user/video', { user: req.session.user, video, isliked, videos, playlist });
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
                { new: true, upsert: true }
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

routes.get('/account/:id', islogin, async (req, res) => {
    const { id } = req.params
    const uid = req.session.user._id
    if (id === uid) {
        try {
            let historyCount = 0
            let likeCount = 0
            let playlistCount = 0
            const history = await HistoryModel.findOne({ user_id: id })
            const likes = await LikeModel.findOne({ user_id: id })
            const playlist = await PlaylistModel.findOne({ user_id: id })
            if (history) {
                historyCount = history.vidoes.length
            }
            if (likes) {
                likeCount = likes.vidoes.length
            }
            if(playlist){
                playlistCount = playlist.videos.length
            }
            res.status(200).render('user/account', { user: req.session.user, historyCount, likeCount, playlistCount })
        } catch (error) {
            res.status(400).send('Server Error')
        }
    } else {
        res.status(406).render('error', { statusCode: 406, user: req.session.user })
    }
})

routes.get('/ac/history/:id', islogin, async (req, res) => {
    const { id } = req.params
    const uid = req.session.user._id
    if (id === uid) {
        try {
            let historyVid = [];
            const history = await HistoryModel.findOne({ user_id: uid })
            if (history) {
                for (let key in history.vidoes) {
                    const video = await VideoModel.findById(history.vidoes[key].vid)
                    if (video) {
                        const title = video.title.substring(0, 59)
                        video.title = title
                        const description = video.description.substring(0, 100)
                        video.description = description
                        historyVid.push(video)
                    }
                }
            }
            res.status(200).render('user/history', { user: req.session.user, historyVid })
        } catch (error) {
            console.log(error)
            res.status(400).send('Server Error')
        }
    } else {
        res.status(406).render('error', { statusCode: 406, user: req.session.user })
    }
})

routes.get('/ac/likes/:id', islogin, async (req, res) => {
    const id = req.params.id
    const uid = req.session.user._id
    if (id === uid) {
        let likesVid = [];
        const likes = await LikeModel.findOne({ user_id: uid })
        if (likes) {
            for (let key in likes.vidoes) {
                const video = await VideoModel.findById(likes.vidoes[key].vid)
                if (video) {
                    const title = video.title.substring(0, 59)
                    video.title = title
                    const description = video.description.substring(0, 100)
                    video.description = description
                    likesVid.push(video)
                }
            }
        }
        res.status(200).render('user/likes', { user: req.session.user, likesVid })
    } else {
        res.status(406).render('error', { statusCode: 406, user: req.session.user })
    }
})

routes.get('/ac/edit-profile/:id', islogin, async (req, res) => {
    try {
        const id = req.params.id
        const uid = req.session.user._id
        if (id === uid) {
            res.status(200).render('user/edit-ac', { user: req.session.user })
        } else {
            res.status(406).render('error', { statusCode: 406, user: req.session.user })
        }
    } catch (error) {

    }
})

routes.post('/ac/edit/', upload.fields([{ name: 'profile' }]), async (req, res) => {
    try {
        const uid = req.session.user._id;
        const { email } = req.body;
        const ProfileImg = req.files['profile'] ? req.files['profile'][0].filename : null;
        const user = await UserModel.findById(uid)
        if (ProfileImg) {
            user.img = ProfileImg
        } else {
            user.email = email
        }
        await user.save()
        req.session.user = user
        res.status(200).redirect(`/account/${uid}`)
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).render('error', { statusCode: 500, message: "An error occurred while updating the profile", user: req.session.user });
    }
});

routes.post('/search', async (req, res) => {
    try {
        const { search } = req.body
        const video = await VideoModel.find({ title: new RegExp(search, "i") });
        if (video) {
            for (let x in video) {
                video[x].title = video[x].title.substring(0, 50)
            }
        }
        res.status(200).render('user/search', { user: req.session.user, video, search })
    } catch (error) {
        console.log(error)
        res.send('Error')
    }
})

routes.get('/add-play-list/:id', async (req, res) => {
    try {
        let videoindb
        const userId = req.session.user._id
        const videoId = req.params.id
        const playlist = await PlaylistModel.findOne({
            user_id: userId,
            videos: { $elemMatch: { vid: videoId } }
        });
        if (playlist) {
            videoindb = true;
            await PlaylistModel.findOneAndUpdate(
                { user_id: userId },
                { $pull: { videos: { vid: videoId } } },
                { new: true }
            );
        } else {
            videoindb = false;
            await PlaylistModel.findOneAndUpdate(
                { user_id: userId },
                { $push: { videos: { vid: videoId } } },
                { new: true, upsert: true }
            );
        }
        res.status(200).json({ videoindb ,status:true })
    } catch (error) {
        res.status(406).json({ status:false })
        console.error(error)
    }
})

routes.get('/ac/playlist/:id',islogin, async (req,res) => {
    try {
        const uid = req.session.user._id
        let status
        let playlistvid = []
        const playlist = await PlaylistModel.findOne({ user_id:uid })
        if(playlist.videos.length > 0){
            status = true
            for(var key = 0;key < playlist.videos.length; key++){
                const vid = playlist.videos[key].vid
                const video = await VideoModel.findById(vid)
                video.title = video.title.substring(0,50)
                playlistvid.push(video)
            }
        }else{
            status = false
        }
        res.render('user/playlist',{user:req.session.user, status, playlistvid})
    } catch (error) {
        console.log(error)
    }  
})

module.exports = routes;