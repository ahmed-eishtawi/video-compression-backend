/* set Allowed origins */
const allowed_origins = [
  "http://localhost:3000",
  "https://video-compression.netlify.app",
  "https://www.esnad-tech.ly",
];

/* CORS configuration */
export const cors_config = {
  origin: (origin, callback) => {
    // If the origin is allowed or there is no origin (in case of server-to-server requests), allow it
    if (!origin || allowed_origins.indexOf(origin) !== -1) {
      callback(null, true);
    }
    // If the origin is not allowed, reject the request
    else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};
//

// standard Video resolutions
export const res_options = {
  qcif: "176x144",
  cif: "352x288",
  vga: "640x480",
  hd: "1280x720",
  full_hd: "1920x1080",
  uhd: "3840x2160",
};

export const valid_qp_values = Array.from({ length: 52 }, (_, i) => i);
// standard values for QP (Quantization Parameter)
/* 
    0-19: very high quality, very low compression
    20-25: high quality, low compression
    26-35: medium quality, medium compression
    36-45: low quality, high compression
    46-51: very low quality, very high compression
*/
