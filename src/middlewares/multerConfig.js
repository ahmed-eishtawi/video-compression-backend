import multer from "multer";
import path from "path";

const multer_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve("uploads", "videos")); // save videos to "uploads/videos" dirctory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Add the current time to file name
  },
});

const multerFileFilter = (req, file, cb) => {
  const allowed_file_types =
    /mp4|avi|mov|wmv|flv|y4m|mkv|application\/octet-stream|video\/x-matroska/;

  const mime_type_valid = allowed_file_types.test(file.mimetype);

  const extension_name_valid = allowed_file_types.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mime_type_valid && extension_name_valid) {
    return cb(null, true);
  } else {
    const error = new Error("Only video files are allowed!");
    error.status = 400; // Custom status code for invalid file types
    return cb(error, false);
  }
};

const upload = multer({
  storage: multer_storage,
  limits: { fileSize: 1000000000 }, // 1 GB limit for video files
  fileFilter: multerFileFilter,
});

export default upload;
