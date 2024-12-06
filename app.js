import express from "express";
import dotenv from "dotenv";
import cors from 'cors'
// import { cors_config } from "./src/config/index.js";
import { uploadVideo } from "./src/controllers/videoController.js";

/* Load environment variables */
dotenv.config();

/* Set up express server Port*/
const PORT = process.env.PORT || 3000;

/* Create express app */
const app = express();

/* Enable CORS */
app.use(cors())
// 


/*default endpoint for heroku requirements*/
app.get('/', (req, res) => {
  res.status(200).send('Video Compression App');
});

/* endpoint to upload video */
app.post("/api/upload_video", uploadVideo); 

/* Start server */
app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
