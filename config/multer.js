const multer = require('multer');
const path = require('path');

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video') {
      cb(null, 'public/videos/video');
    } else if (file.fieldname === 'thumbnail') {
      cb(null, 'public/videos/img');
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});

// Set up multer with the storage configuration
const upload = multer({
  storage: videoStorage,
  fileFilter: function (req, file, cb) {
    // Allow only specific file types
    const filetypes = /jpeg|jpg|png|mp4|avi|mov/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb("Error: Only images and video files are allowed!");
    }
  }
});

module.exports = upload;
