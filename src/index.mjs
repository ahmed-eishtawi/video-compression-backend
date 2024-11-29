import express from "express";
import multer from "multer";
import path from "path";
import { encodeVideo, getBitrate, getPSNR } from "./helpers/video_encoding.mjs";
import fs from "fs";
import mkdirp from "mkdirp"; // You can use mkdirp to ensure directories are created

// Set up Express app
const app = express();

// Set up port
const PORT = process.env.PORT || 3000;

// Set up Multer for file upload
const upload = multer({
  dest: "./uploads/",
});

// Define route to process video
app.post("/api/video_process", upload.single("video"), async (req, res) => {
  const input_file_path = `"${req.file.path}"`;
  const file_name = path.parse(req.file.originalname).name;
  const res_options = ["cif", "qcif"]; // Resolutions to encode

  console.log(input_file_path, req.file.path);

  let results = [];

  // Ensure the directories for output files exist
  try {
    // Create output directories if they don't exist
    mkdirp("public/encoded_h264");
    mkdirp("public/encoded_h265");

    // Process each resolution for the video
    for (const res of res_options) {
      // Output paths for encoded videos
      const h264_output_path = `"public/encoded_h264/${file_name}_h264.mp4"`;
      const h265_output_path = `"public/encoded_h265/${file_name}_h265.mp4"`;

      // H.264 Encoding
      await encodeVideo(input_file_path, h264_output_path, res, "libx264");

      // H.265 Encoding
      await encodeVideo(input_file_path, h265_output_path, res, "libx265");

      // Get metrics: Bitrate, QP, PSNR for both H.264 and H.265
      const [h264Bitrate, h265Bitrate, h264PSNR, h265PSNR] = await Promise.all([
        getBitrate(h264_output_path),
        getBitrate(h265_output_path),
        getPSNR(h264_output_path, input_file_path),
        getPSNR(h265_output_path, input_file_path),
      ]);

      const result = {
        Video: file_name,
        Resolution: res,
        "Bitrate H.264 (kb/s)": h264Bitrate,
        "Bitrate H.265 (kb/s)": h265Bitrate,
        "PSNR H.264": h264PSNR,
        "PSNR H.265": h265PSNR,
        "Def Bitrate (kb/s)": h264Bitrate - h265Bitrate,
        "Def PSNR": h264PSNR - h265PSNR,
      };

      results.push(result);
    }

    res.json({ results });
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
