import { exec } from "child_process";

export const encodeVideo = (inputFilePath, outputFilePath, codec, qp) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${inputFilePath} -c:v ${codec} -qp ${qp} -preset fast ${outputFilePath}`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Error encoding video: ${error.message}`));
      }
      resolve(stdout);
    });
  });
};
