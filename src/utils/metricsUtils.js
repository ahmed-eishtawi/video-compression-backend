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
  const bitrateMatch = metrics.match(/bit_rate=(\d+)/);
  return bitrateMatch ? parseInt(bitrateMatch[1]) : 0;
};

// Function to calculate PSNR (Peak Signal-to-Noise Ratio) between the encoded and original video
export const calculatePSNR = (encodedFile, originalFile) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${encodedFile} -i ${originalFile} -lavfi psnr -f null -`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`Error calculating PSNR: ${stderr || err.message}`));
      }
      const psnrMatch = stderr.match(/average:(\d+\.\d+)/);
      resolve(psnrMatch ? parseFloat(psnrMatch[1]) : null);
    });
  });
};

export const calculateQP = (filePath) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${filePath} -vf "showinfo" -f null - 2>&1`;

    // Increase the maxBuffer size to handle large output
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => { // 10MB buffer
      if (err) {
        return reject(new Error(`Error calculating QP: ${err.message}`));
      }

      // Look for the QP value in the output logs
      const qpMatch = stderr.match(/qp:\s*(\d+\.\d+)/);
      if (qpMatch) {
        resolve(parseFloat(qpMatch[1])); // QP value found
      } else {
        resolve(0); // If QP not found, return 0
      }
    });
  });
};


