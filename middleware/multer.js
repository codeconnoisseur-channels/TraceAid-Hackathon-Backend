const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only image is allowed!"), false);
  }
};

const limits = {
  fileSize: 1024 * 1024 * 5,
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = upload;
