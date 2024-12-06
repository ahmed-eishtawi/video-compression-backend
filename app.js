import express from "express";
import cors from 'cors'
import dotenv from "dotenv";
import { uploadVideo } from "./src/controllers/videoController.js";
// import { cors_config } from "./src/config/index.js";

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
  res.send('Hello World');
});

/* endpoint to upload video */
app.post("/api/upload_video", uploadVideo); 

/* Start server */
app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
