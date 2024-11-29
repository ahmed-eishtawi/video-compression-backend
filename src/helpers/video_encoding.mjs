import ffmpeg from "fluent-ffmpeg";
import subprocess from "child_process";
import fs from "fs";

// Mapping of resolution options to actual dimensions for raw YUV files
const resOptions = {
  cif: "352x288", // CIF resolution
  qcif: "176x144", // QCIF resolution
};

// Video encoding function using FFmpeg
export const encodeVideo = (inputFilePath, outputPath, resolution, codec) => {
  return new Promise((resolve, reject) => {
    const res = resOptions[resolution]; // Retrieve the actual resolution
    if (!res) {
      return reject(new Error(`Invalid resolution: ${resolution}`));
    }

    // Encode video with FFmpeg
    ffmpeg(inputFilePath)
      .inputFormat("rawvideo") // Specify input format as raw video
      .inputOptions([`-s ${res}`, "-pix_fmt yuv420p"]) // Set resolution and pixel format
      .output(outputPath)
      .videoCodec(codec)
      .outputOptions(["-qp 28"]) // Control quality manually instead of using presets
      .on("end", () => resolve())
      .on("error", (err) =>
        reject(new Error(`Error during encoding: ${err.message}`))
      )
      .run();
  });
};

// Get bitrate using ffprobe
export const getBitrate = (filePath) => {
  return new Promise((resolve, reject) => {
    subprocess.exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of csv=p=0 ${filePath}`,
      (err, stdout, stderr) => {
        if (err) reject(new Error(`Error getting bitrate: ${stderr}`));
        resolve(parseFloat(stdout) / 1000); // Convert to kb/s
      }
    );
  });
};

// Get PSNR (Peak Signal-to-Noise Ratio) using FFmpeg
export const getPSNR = (encodedFile, originalFile) => {
  return new Promise((resolve, reject) => {
    const psnrLog = "psnr.log";
    subprocess.exec(
      `ffmpeg -i ${encodedFile} -i ${originalFile} -lavfi psnr="stats_file=${psnrLog}" -f null -`,
      (err, stdout, stderr) => {
        if (err) reject(new Error(`Error calculating PSNR: ${stderr}`));
        fs.readFile(psnrLog, "utf8", (err, data) => {
          if (err) reject(new Error(`Error reading PSNR log: ${err.message}`));
          const lines = data.split("\n");
          const psnrLine = lines[lines.length - 1];
          // Assuming PSNR value is always the 4th element in the line
          const psnr = parseFloat(psnrLine.split(" ")[3]);
          resolve(psnr);
        });
      }
    );
  });
};
