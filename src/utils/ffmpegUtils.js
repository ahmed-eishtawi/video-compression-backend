import { exec } from "child_process";

export const encodeVideo = (inputFilePath, outputFilePath, codec) => {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${inputFilePath} -c:v ${codec} -preset fast ${outputFilePath}`;
    
    exec(command, (error, stdout) => {
      if (error) {
        return reject(new Error(`Error encoding video: ${error.message}`));
      }
      resolve(stdout);
    });
  });
};
