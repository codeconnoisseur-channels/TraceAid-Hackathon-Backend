const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const ext = file.mimetype.split("/")[1] || path.extname(file.originalname).slice(1);
    cb(null, `${file.fieldname}_${uniqueSuffix}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mkv",
    "application/pdf",
    "application/msword",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format: Only images, videos, and documents are allowed."), false);
  }
};

const limits = {
  fileSize: 1024 * 1024 * 50,
};

const uploads = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = uploads;
