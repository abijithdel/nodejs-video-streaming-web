const express = require('express')
const router = express.Router()
const UserModel = require('../config/schema/user')
const bcrypt = require('bcrypt')

router.get('/signin', (req, res) => {
    res.render('auth/signin', { user: req.session.user, error: undefined })
})

router.get('/signup', (req, res) => {
    res.render('auth/signup', { user: req.session.user, error: undefined })
})

// type email.POST Router

router.post('/signup', async (req, res) => {
    try {
        const { email, password, cpassword } = req.body;
        let error;

        if (password !== cpassword) {
            error = 'Passwords do not match';
            return res.render('auth/signup', { user: req.session.user, error });
        }

        const isUser = await UserModel.findOne({ email });
        if (isUser) {
            error = "User with this email already exists.";
            return res.render('auth/signup', { user: req.session.user, error });
        }

        const hash = await bcrypt.hash(password, 10)

        const newUser = new UserModel({
            email: email,
            password: hash
        });
        // session
        req.session.user = newUser;
        req.session.login = true;

        await newUser.save();

        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.send('Server Error');
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        let error
        const user = await UserModel.findOne({ email: email })
        if (!user) {
            error = "User not Found. Create a Account"
            res.render('auth/signin', { user: false, error })
        }
        const hash = await bcrypt.compare(password, user.password)
        if (!hash) {
            error = "incorrect password"
            res.render('auth/signin', { user: false, error })
        } else {
            req.session.user = user;
            req.session.login = true;
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
        res.send('Server Error')
    }
})


module.exports = router;