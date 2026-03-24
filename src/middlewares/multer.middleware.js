import multer from "multer";
import path from "path";
import fs from "fs";
import { UPLOAD_PATH, ALLOWED_IMAGE_TYPES, ALLOWED_POST_TYPES, MAX_FILE_SIZE, MAX_VIDEO_SIZE } from "../utills/constants.js";

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = "";

    if (file.fieldname === "profilePicture") {
      uploadDir = path.join(UPLOAD_PATH, "profile/profilePicture");
    } else if (file.fieldname === "coverPhoto") {
      uploadDir = path.join(UPLOAD_PATH, "profile/coverphoto");
    } else if (file.fieldname === "postMedia") {
      if (file.mimetype.startsWith("image/")) {
        uploadDir = path.join(UPLOAD_PATH, "posts/images");
      } else {
        uploadDir = path.join(UPLOAD_PATH, "posts/videos");
      }
    }

    ensureDir(uploadDir);
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "postMedia") {
    if (ALLOWED_POST_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  } else {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  }
};

const fileSizeLimit = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, MAX_VIDEO_SIZE);
  } else {
    cb(null, MAX_FILE_SIZE);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE }, // set to max video size, images will still be checked
});

export default upload;