const express = require('express')
const routes = express.Router()
const upload = require('../config/multer')
const VideoModel = require('../config/schema/video')

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

module.exports = routes;