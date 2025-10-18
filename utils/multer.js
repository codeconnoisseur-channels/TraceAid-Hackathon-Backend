const multer = require("multer");
const fs = require("fs")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync('./images', {recursive: true})
    cb(null, "./images");
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = file.mimetype.split("/")[1];
    cb(null, `IMG_${uniqueSuffix}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format: Images only"));
  }
};

const limits = {
  fileSize: 1024 * 1024 * 10,
};

const uploads = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = uploads;
