import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";

import { QP_values } from "../config/index.js";
import { encodeVideo } from "../utils/ffmpegUtils.js";
import {
  extractMetrics,
  getVideoBitrate,
  calculatePSNR,
} from "../utils/metricsUtils.js";
import upload from "../middlewares/multerConfig.js";

export const uploadVideo = async (req, res) => {
  /* the result array */
  let results = [];

  upload.single("video")(req, res, async (error) => {
    if (error) {
      if (error.status === 400) {
        return res.status(400).json({ error: error.message });
      }
      return res
        .status(500)
        .json({ error: "An internal server error occurred!" });
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

    try {
      for (const qp of QP_values) {
        const h264_output_path = path.relative(
          process.cwd(),
          path.join(h264_directory, `${file_name}_h264${qp}.mp4`)
        );
        const h265_output_path = path.relative(
          process.cwd(),
          path.join(h265_directory, `${file_name}_h265${qp}.mp4`)
        );

        await encodeVideo(input_file_path, h264_output_path, "libx264", qp);
        await encodeVideo(input_file_path, h265_output_path, "libx265", qp);

        const h264_metrics = await extractMetrics(h264_output_path);
        const h265_metrics = await extractMetrics(h265_output_path);

        const h264_bitrate = getVideoBitrate(h264_metrics);
        const h265_bitrate = getVideoBitrate(h265_metrics);

        const psnr_h264 = await calculatePSNR(
          h264_output_path,
          input_file_path
        );
        const psnr_h265 = await calculatePSNR(
          h265_output_path,
          input_file_path
        );

        // Append result for this QP value
        results.push({
          h264: {
            bitrate: h264_bitrate,
            qp: qp,
            psnr: psnr_h264,
          },
          h265: {
            bitrate: h265_bitrate,
            qp: qp,
            psnr: psnr_h265,
          },
          differences: {
            bitrate: Number(Math.abs(h264_bitrate - h265_bitrate).toFixed(7)),
            qp: qp,
            psnr: Number(Math.abs(psnr_h264 - psnr_h265).toFixed(7)),
          },
        });
      }

      /* Send success response */
      res.status(200).json({
        message: `Your video (${req.file.originalname}) uploaded and processed successfully!`,
        results,
      });
    } catch (error) {
      /* Send error response */
      res.status(500).json({ error: error.message });
    } finally {
      /* Delete the uploaded file */
      fs.unlinkSync(input_file_path);

      /* Delete the encoded videos for each (h264, h265) */
      for (const qp of QP_values) {
        fs.unlinkSync(path.join(h264_directory, `${file_name}_h264${qp}.mp4`));
        fs.unlinkSync(path.join(h265_directory, `${file_name}_h265${qp}.mp4`));
      }
    }
  });
};
