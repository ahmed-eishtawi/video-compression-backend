import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";

import { valid_qp_values } from "../config/index.js";
import { encodeVideo } from "../utils/ffmpegUtils.js";
import {
  extractMetrics,
  getVideoBitrate,
  calculatePSNR,
} from "../utils/metricsUtils.js";
import upload from "../middlewares/multerConfig.js";

export const uploadVideo = (req, res) => {
  let results = [];

  /* check for the uploads Directory if not exist it will be created */
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
    fs.mkdirSync("uploads/videos");
  }

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

    let is_valid_qp_value = true; /* flag to check the value of qp */

    const qp_values = String(req.body.qp)
      .replace("[", "")
      .replace("]", "")
      .split(",")
      .map((qp) => {
        return parseInt(qp.trim());
      });

    /* validate all qp_values */
    qp_values.forEach((qp) => {
      if (!valid_qp_values.includes(qp)) {
        is_valid_qp_value = false;
      }
      if (isNaN(qp)) {
        is_valid_qp_value = false;
      }
    });

    /* check if qp_value is valid */
    if (!is_valid_qp_value) {
      /* delete uploaded file */
      fs.unlinkSync(`uploads/videos/${req.file.filename}`);

      /* return error response */
      return res.status(400).json({
        error: `Invalid QP value`,
      });
    }

    /* check if qp_values is empty */
    if (qp_values.length === 0) {
      /* delete uploaded file */
      fs.unlinkSync(`uploads/videos/${req.file.filename}`);

      /* return error response */
      return res.status(400).json({
        error: `No QP value provided`,
      });
    }

    if (qp_values.length > 3) {
      /* delete uploaded file */
      fs.unlinkSync(`uploads/videos/${req.file.filename}`);

      /* return error response */
      return res.status(400).json({
        error: `You can only provide a maximum of 3 QP values`,
      });
    }
    /* end of the validations */

    /* get uploaded file name */
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
      for (const qp of qp_values) {
        const h264_output_path = path.relative(
          process.cwd(),
          path.join(h264_directory, `${file_name}_h264_qp_${qp}.mp4`)
        );
        const h265_output_path = path.relative(
          process.cwd(),
          path.join(h265_directory, `${file_name}_h265_qp_${qp}.mp4`)
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
          qp: qp,
          h264: {
            bitrate: h264_bitrate,
            psnr: psnr_h264,
          },
          h265: {
            bitrate: h265_bitrate,
            psnr: psnr_h265,
          },
          differences: {
            bitrate: Number(Math.abs(h264_bitrate - h265_bitrate).toFixed(7)),
            psnr: Number(Math.abs(psnr_h264 - psnr_h265).toFixed(7)),
          },
        });
      }
    } catch (error) {
      /* Send error response if any error occurs*/
      res.status(500).json({ error: error.message });
    } finally {
      /* Delete the uploaded file */
      fs.unlinkSync(input_file_path);

      /* Delete the encoded videos for each (h264, h265) */
      for (const qp of qp_values) {
        fs.unlinkSync(
          path.join(h264_directory, `${file_name}_h264_qp_${qp}.mp4`)
        );
        fs.unlinkSync(
          path.join(h265_directory, `${file_name}_h265_qp_${qp}.mp4`)
        );
      }
    }

    /* Send success response */
    res.status(200).json({
      message: `Your video (${req.file.originalname}) uploaded and processed successfully!`,
      results,
    });
  });
};
