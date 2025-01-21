import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { cors_config } from "./src/config/index.js";
import { uploadVideo } from "./src/controllers/videoController.js";

/* Load environment variables */
dotenv.config();

/* Set up express server Port*/
const PORT = process.env.PORT || 4000;

/* Create express app */
const app = express();

/* Enable CORS for all origins*/
app.use(cors("*"));
/* config for production */
// app.use(cors(cors_config));
// app.use(cors("*"));
//

/*default endpoint for heroku requirements*/
app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      `<div style="text-align:center; font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif"><h2>Video Compression App <br /> Created by: <strong style="color:#42B883">Ahmed Eishtawi</strong></h2><p><a href="https://github.com/ahmed-eishtawi">Visit my Profile on GitHub</a></p></div>`
    );
});

/* endpoint to upload video */
app.post("/api/upload_video", uploadVideo);

/* Start server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
