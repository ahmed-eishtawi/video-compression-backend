import ffmpeg from "fluent-ffmpeg";
import subprocess from "child_process";
import fs from "fs/promises";

const resOptions = {
  cif: "352x288",
  qcif: "176x144",
};

export const encodeVideo = (inputFilePath, outputPath, resolution, codec) => {
  return new Promise((resolve, reject) => {
    const res = resOptions[resolution];
    if (!res) return reject(new Error(`Invalid resolution: ${resolution}`));

    // Use FFmpeg with input format as raw YUV4MPEG pipe
    ffmpeg(inputFilePath)
      .inputFormat("yuv4mpegpipe") // Specify input format for .y4m files
      .output(outputPath)
      .videoCodec(codec)
      .outputOptions([
        `-vf scale=${res}`, // Scale video to the desired resolution
        "-qp 28",           // Set Quantization Parameter for H.264 or H.265 encoding
      ])
      .on("start", (commandLine) => {
        console.log("FFmpeg command:", commandLine); // For debugging
      })
      .on("end", () => {
        console.log(`Encoding completed for: ${outputPath}`);
        resolve(); // Resolve the promise once encoding is done
      })
      .on("error", (err) => {
        console.error("Encoding error:", err.message);
        reject(new Error(`Encoding error: ${err.message}`));
      })
      .run(); // Execute the FFmpeg command
  });
};


export const getBitrate = (filePath) => {
  return new Promise((resolve, reject) => {
    subprocess.exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of csv=p=0 ${filePath}`,
      (err, stdout) => {
        if (err) return reject(new Error(`Error getting bitrate: ${err.message}`));
        resolve(parseFloat(stdout) / 1000);
      }
    );
  });
};

export const getPSNR = (encodedFile, originalFile) => {
  return new Promise((resolve, reject) => {
    subprocess.exec(
      `ffmpeg -i ${encodedFile} -i ${originalFile} -lavfi psnr -f null -`,
      (err, stdout, stderr) => {
        if (err) return reject(new Error(`Error calculating PSNR: ${stderr}`));
        const psnrMatch = stderr.match(/average:(\d+\.\d+)/);
        resolve(psnrMatch ? parseFloat(psnrMatch[1]) : null);
      }
    );
  });
};

export const getQP = (filePath) => {
  return new Promise((resolve, reject) => {
    subprocess.exec(
      `ffmpeg -i ${filePath} -vf qp -f null - 2>&1`,
      (err, stdout) => {
        if (err) return reject(new Error(`Error calculating QP: ${err.message}`));
        const qpMatch = stdout.match(/average qp:(\d+\.\d+)/);
        resolve(qpMatch ? parseFloat(qpMatch[1]) : null);
      }
    );
  });
};
