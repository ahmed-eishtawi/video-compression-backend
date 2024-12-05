import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";

import { encodeVideo } from "../utils/ffmpegUtils.js";
import { extractMetrics, getVideoBitrate, calculatePSNR, calculateQP } from "../utils/metricsUtils.js"; // Updated imports for clarity
import upload from "../middlewares/multerConfig.js";

export const uploadVideo = (req, res) => {
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
        .json({ error: "No file uploaded or file type not supported." });
    }

    const uploaded_file_name = req.file.filename;
    const input_file_path = path.relative(
      process.cwd(),
      `uploads/videos/${uploaded_file_name}`
    );

    const file_name = path.parse(req.file.originalname).name;

    // Create output directories for both H.264 and H.265 encoded videos
    const h264_directory = path.resolve("public", "encoded_h264");
    const h265_directory = path.resolve("public", "encoded_h265");
    mkdirp.sync(h264_directory);
    mkdirp.sync(h265_directory);

    const h264_output_path = path.relative(
      process.cwd(),
      path.join(h264_directory, `${file_name}_h264.mp4`)
    );
    const h265_output_path = path.relative(
      process.cwd(),
      path.join(h265_directory, `${file_name}_h265.mp4`)
    );

    try {
      // Encode the video with both H.264 and H.265 codecs
      await encodeVideo(input_file_path, h264_output_path, "libx264");
      await encodeVideo(input_file_path, h265_output_path, "libx265");

      // Extract metrics (bitrate, PSNR, and QP) for both H.264 and H.265 videos
      const h264_metrics = await extractMetrics(h264_output_path);
      const h265_metrics = await extractMetrics(h265_output_path);

      const h264_bitrate = getVideoBitrate(h264_metrics);
      const h265_bitrate = getVideoBitrate(h265_metrics);

      // Calculate QP and PSNR for both H.264 and H.265 videos
      const h264_qp = await calculateQP(h264_output_path);
      const h265_qp = await calculateQP(h265_output_path);
      const psnr_h264 = await calculatePSNR(h264_output_path, input_file_path);
      const psnr_h265 = await calculatePSNR(h265_output_path, input_file_path);

      res.status(200).json({
        message: `Your video (${req.file.originalname}) uploaded and processed successfully!`,
        results: {
          h264: {
            bitrate: h264_bitrate,
            qp: h264_qp,
            psnr: psnr_h264,
          },
          h265: {
            bitrate: h265_bitrate,
            qp: h265_qp,
            psnr: psnr_h265,
          },
          differences: {
            bitrate: h264_bitrate - h265_bitrate,
            qp: h264_qp - h265_qp,
            psnr: psnr_h264 - psnr_h265,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      // Clean up by deleting the uploaded and encoded files
      fs.unlinkSync(input_file_path);
      fs.unlinkSync(h264_output_path);
      fs.unlinkSync(h265_output_path);
    }
  });
};
