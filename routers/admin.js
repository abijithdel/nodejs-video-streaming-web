const express = require('express')
const routes = express.Router()
const upload = require('../config/multer')
const VideoModel = require('../config/schema/video')
const UserModel = require('../config/schema/user')

function isadmin(req, res, nest) {
    if (req.session.user.admin) {
        nest()
    } else {
        res.redirect('/')
    }
}

function islogin(req, res, nest) {
    if (req.session.login) {
        nest()
    } else {
        res.redirect('/')
    }
}



routes.get('/', islogin, isadmin, (req, res) => {
    res.status(200).render('admin/admin', { user: req.session.user })
})

routes.get('/new-video', islogin, isadmin, (req, res) => {
    res.status(200).render('admin/uploadvideo', { user: req.session.user })
})

routes.post('/new-video', islogin, isadmin, upload.fields([{ name: 'video' }, { name: 'thumbnail' }]), async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const videoFileName = req.files['video'] ? req.files['video'][0].filename : null;
        const thumbnailFileName = req.files['thumbnail'] ? req.files['thumbnail'][0].filename : null;

        const NewVideo = new VideoModel({
            title: title,
            description: description,
            video: videoFileName,
            img: thumbnailFileName,
            category: category
        })
        await NewVideo.save()
        res.status(200).redirect('/admin')
    } catch (error) {
        console.log(error)
        res.status(404).send('Server error')
    }
})

routes.get('/all-videos',islogin, isadmin, async (req,res) => {
    try {
        const video = await VideoModel.find()
        if(video.length > 0){
            for (let index = 0; index < video.length; index++) {    
                const title = video[index].title.substring(0,10) 
                video[index].title = title    
            }
        }
        res.status(200).render('admin/all-videos', {user:req.session.user,video})
    } catch (error) {
        console.log(error)
        res.status(400).send('Server Error')
    }
})

routes.get('/all-users', islogin, isadmin, async (req,res) => {
    try {
        const users = await UserModel.find()
        res.status(200).render('admin/all-users',{user:req.session.user, users})
    } catch (error) {
        console.log(error)
        res.status(400).send('Server Error')
    }
})

module.exports = routes;