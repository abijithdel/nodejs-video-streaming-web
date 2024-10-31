const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/streamer")
  .then(() => console.log("connect db"))
  .catch((err) => console.log(err));
