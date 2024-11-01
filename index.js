const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require("./config");
const UserModel = require("./config/schema/user");

const app = express();
require("./config/mongoose");
require("./config/discordBot");

const UserRouter = require("./routers/user");
const AuthRouter = require("./routers/auth");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "./layouts/layout");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(
    session({
        secret: "key", 
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        async function (accessToken, refreshToken, profile, done) {
            try {
                const { picture, email, sub } = profile._json;
                const user = await UserModel.findOne({ email: email });
                if (!user) {
                    const NewUser = new UserModel({
                        email: email,
                        password: sub,
                        img: picture,
                        auth_type: "google",
                    });

                    await NewUser.save();
                    return done(null, profile);
                } else {
                    if (user.auth_type === "google") {
                        return done(null, profile);
                    } else {
                        throw new Error(
                            "Account exists with a different authentication method."
                        );
                    }
                }
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use("/", UserRouter);
app.use("/auth", AuthRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running..!"));
