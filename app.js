import express from "express";
import dotenv from "dotenv";
import { uploadVideo } from "./src/controllers/videoController.js";

dotenv.config();

const PORT = process.env.PORT;

const app = express();

app.post("/api/upload_video", uploadVideo); /* endpoint to upload video */

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
