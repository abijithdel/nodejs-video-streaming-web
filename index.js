const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const session = require('express-session');

const app = express();
require('./config/mongoose')
require('./config/discordBot')

const UserRouter = require("./routers/user");
const AuthRouter = require("./routers/auth");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "./layouts/layout");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: false
}));

app.use("/", UserRouter);
app.use("/auth", AuthRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running..!"));
