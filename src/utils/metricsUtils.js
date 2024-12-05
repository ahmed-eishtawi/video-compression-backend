import { exec } from "child_process";

// Function to extract metrics like bitrate, codec name, and packet size
export const extractMetrics = (videoFilePath) => {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate,codec_name -show_entries frame=pkt_size -of default=noprint_wrappers=1 ${videoFilePath}`;
    exec(command, (error, stdout) => {
      if (error) {
        return reject(new Error(`Error extracting metrics: ${error.message}`));
      }
      resolve(stdout);
    });
  });
};

// Function to get the bitrate of a video from the extracted metrics
export const getVideoBitrate = (metrics) => {
  const bitrate_match = metrics.match(/bit_rate=(\d+)/);
  return bitrate_match ? parseInt(bitrate_match[1]) : 0;
};

// Function to calculate PSNR (Peak Signal-to-Noise Ratio) of a video
export const calculatePSNR = (encodedFile, originalFile) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${encodedFile} -i ${originalFile} -lavfi psnr -f null -`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return reject(
          new Error(`Error calculating PSNR: ${stderr || err.message}`)
        );
      }
      const psnr_match = stderr.match(/average:(\d+\.\d+)/);
      resolve(psnr_match ? parseFloat(psnr_match[1]) : null);
    });
  });
};
