const express = require('express')
const routes = express.Router()

routes.get('/',(req,res)=>{
    res.render('user/index',{ user:req.session.user})
})

module.exports = routes;