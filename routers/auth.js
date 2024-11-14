const express = require("express");
const router = express.Router();
const UserModel = require("../config/schema/user");
const bcrypt = require("bcrypt");
const axios = require("axios");
const config = require("../config");
const passport = require('passport');


function islogin(req,res,nest){
    if(req.session.login){
        res.redirect('/')
    }else{
        nest()
    }
}


router.get("/signin",islogin, (req, res) => {
    res.render("auth/signin", { user: req.session.user, error: undefined });
});

router.get("/signup",islogin, (req, res) => {
    res.render("auth/signup", { user: req.session.user, error: undefined });
});

// type email.POST Router

router.post("/signup", async (req, res) => {
    try {
        const { email, password, cpassword } = req.body;
        let error;

        if (password !== cpassword) {
            error = "Passwords do not match";
            return res.render("auth/signup", { user: req.session.user, error });
        }

        const isUser = await UserModel.findOne({ email });
        if (isUser) {
            error = "User with this email already exists.";
            return res.render("auth/signup", { user: req.session.user, error });
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            email: email,
            password: hash,
        });
        // session
        req.session.user = newUser;
        req.session.login = true;

        await newUser.save();

        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.send("Server Error");
    }
});

router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        let error;
        const user = await UserModel.findOne({ email: email });
        if (!user) {
            error = "User not Found. Create a Account";
            return res.render("auth/signin", { user: false, error });
        }
        const hash = await bcrypt.compare(password, user.password);
        if (!hash) {
            error = "incorrect password";
            return res.render("auth/signin", { user: false, error });
        } else {
            req.session.user = user;
            req.session.login = true;
            res.redirect("/");
        }
    } catch (error) {
        console.log(error);
        res.send("Server Error");
    }
});

// discord

router.get("/discord/callback", async (req, res) => {
    try {
        let error;
        const code = req.query.code;
        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams({
                client_id: config.CLIENT_ID,
                client_secret: config.CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: config.CALL_BACK_URL,
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const accessToken = tokenResponse.data.access_token;

        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (userResponse.data.email) {
            const user = await UserModel.findOne({ email: userResponse.data.email });

            if (user) {
                // Check auth_type only if the user exists
                if (user.auth_type === "discord") {
                    req.session.user = user;
                    req.session.login = true;
                    return res.status(200).redirect("/");
                } else {
                    error = "Check Account type";
                    return res.status(406).render('auth/signup', { user: false, error });
                }
            } else {
                // If no user found, create a new one
                const type = 'discord';
                const NewUser = new UserModel({
                    email: userResponse.data.email,
                    password: accessToken,
                    img: userResponse.data.avatar,
                    auth_type: type,
                    Dc_uid: userResponse.data.id
                });

                req.session.user = NewUser;
                req.session.login = true;
                await NewUser.save();
                return res.status(200).redirect("/");
            }
        } else {
            res.status(406).send('Add Email Id Your Discord Account..!');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
});

// google

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback', passport.authenticate('google', { failureRedirect: 'auth/signup' }),
    async (req, res) => {
        try {
            const { email } = req.user._json
            const user = await UserModel.findOne({ email: email })
            req.session.user = user;
            req.session.login = true;
            res.redirect('/');
        } catch (error) {
            console.log(error)
            res.status(404).send('Error')
        }
    });


router.get('/error', (req, res) => {
    res.render('error', { message: 'There was an issue with Google authentication.' });
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err); 
            return res.redirect('/'); 
        }
        req.session.destroy((err) => {
            if (err) {
                console.error(err); 
            }
            res.redirect('/'); 
        });
    });
});

module.exports = router;
