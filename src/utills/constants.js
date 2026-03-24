export const UPLOAD_PATH = "uploads/";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/mkv",
  "video/webm",
  "video/quicktime",
];

export const ALLOWED_POST_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

export const MAX_FILE_SIZE = 2 * 1024 * 1024;        // 2MB for images
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;       // 50MB for videos