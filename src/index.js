const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const mkdirp = require("mkdirp");

// Initialize Express app
const app = express();

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve("uploads", "videos")); // Resolve relative to project root
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Initialize multer with storage configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000000 }, // 1 GB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|avi|mov|wmv|flv|y4m|mkv|application\/octet-stream/;
    const mimeType = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimeType && extname) {
      return cb(null, true);
    } else {
      const error = new Error("Only video files are allowed!");
      error.status = 400; // Add custom status code to the error
      return cb(error, false);
    }
  },
});

// Function to encode video using FFmpeg
const encodeVideo = (inputFilePath, outputFilePath, codec) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${inputFilePath} -c:v ${codec} -preset fast ${outputFilePath}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error encoding video: ${error.message}`);
      }
      resolve(stdout);
    });
  });
};

// Function to extract metrics using FFprobe
const extractMetrics = (videoFilePath) => {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate,codec_name -show_entries frame=pkt_size -of default=noprint_wrappers=1 ${videoFilePath}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error extracting metrics: ${error.message}`);
      }
      resolve(stdout);
    });
  });
};

// Endpoint to handle video upload and processing
app.post("/api/upload_video", (req, res) => {
  upload.single("video")(req, res, async (err) => {
    if (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: "An internal error occurred!" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No file uploaded or file type not supported." });
    }

    const uploadedFileName = req.file.filename;

    const inputFilePath = path.relative(
      process.cwd(),
      `uploads/videos/${uploadedFileName}`
    );

    const fileName = path.parse(req.file.originalname).name;

    // Ensure output directories exist
    const h264Dir = path.resolve("public", "encoded_h264");
    const h265Dir = path.resolve("public", "encoded_h265");
    mkdirp.sync(h264Dir);
    mkdirp.sync(h265Dir);

    const h264OutputPath = path.relative(
      process.cwd(),
      path.join(h264Dir, `${fileName}_h264.mp4`)
    );
    const h265OutputPath = path.relative(
      process.cwd(),
      path.join(h265Dir, `${fileName}_h265.mp4`)
    );

    try {
      // Encode the video
      await encodeVideo(inputFilePath, h264OutputPath, "libx264");
      await encodeVideo(inputFilePath, h265OutputPath, "libx265");

      // Extract metrics for both videos
      const h264Metrics = await extractMetrics(h264OutputPath);
      const h265Metrics = await extractMetrics(h265OutputPath);

      // Parse metrics
      const h264BitrateMatch = h264Metrics.match(/bit_rate=(\d+)/);
      const h265BitrateMatch = h265Metrics.match(/bit_rate=(\d+)/);

      const h264Bitrate = h264BitrateMatch ? parseInt(h264BitrateMatch[1]) : 0;
      const h265Bitrate = h265BitrateMatch ? parseInt(h265BitrateMatch[1]) : 0;

      const results = {
        h264: {
          bitrate: h264Bitrate,
        },
        h265: {
          bitrate: h265Bitrate,
        },
        differences: {
          bitrate: h264Bitrate - h265Bitrate,
        },
      };

      res.status(200).json({
        message: "Video uploaded and processed successfully!",
        results,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      // Clean up uploaded files
      fs.unlinkSync(inputFilePath);
      fs.unlinkSync(h264OutputPath);
      fs.unlinkSync(h265OutputPath);
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
