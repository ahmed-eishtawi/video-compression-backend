import express from "express";
import { uploadVideo } from "./src/controllers/videoController.js";

const app = express();

app.post("/api/upload_video", uploadVideo); /* endpoint to upload video */

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
