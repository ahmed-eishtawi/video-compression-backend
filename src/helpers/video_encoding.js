import ffmpeg from "fluent-ffmpeg";
import subprocess from "child_process";
import { res_options } from "../config";

export const encodeVideo = (inputFilePath, outputPath, resolution, codec) => {
  return new Promise((resolve, reject) => {
    const res = res_options[resolution];
    if (!res) return reject(new Error(`Invalid resolution: ${resolution}`));

    // Construct FFmpeg command dynamically
    const ffmpegCommand = `
      ffmpeg -i ${inputFilePath} 
      -c:v ${codec} 
      -vf scale=${res} 
      -qp 28 
      ${outputPath}
    `;

    // Debugging the generated FFmpeg command
    console.log("FFmpeg command:", ffmpegCommand);

    subprocess.exec(ffmpegCommand, (err, stdout, stderr) => {
      if (err) {
        console.error("Encoding error:", stderr);
        return reject(new Error(`Encoding error: ${stderr}`));
      }
      console.log(`Encoding completed for: ${outputPath}`);
      resolve(stdout);
    });
  });
};

export const getBitrate = (filePath) => {
  return new Promise((resolve, reject) => {
    subprocess.exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of csv=p=0 ${filePath}`,
      (err, stdout) => {
        if (err)
          return reject(new Error(`Error getting bitrate: ${err.message}`));
        resolve(parseFloat(stdout) / 1000); // Return bitrate in kbps
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
        if (err)
          return reject(new Error(`Error calculating QP: ${err.message}`));
        const qpMatch = stdout.match(/average qp:(\d+\.\d+)/);
        resolve(qpMatch ? parseFloat(qpMatch[1]) : null);
      }
    );
  });
};
