import cors from "cors";

// List of websites that can access your API
// Use "*" to allow all origins, or specify exact origins like ["https://example.com", "https://app.example.com"]
const allowedOrigins = ["*"]; // Allow all origins

// CORS settings
const corsOptions = {
  // Which websites can access your API
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Check if wildcard is enabled (allow all origins)
    if (allowedOrigins.includes("*")) {
      return callback(null, true);
    }

    // In production, check against allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },

  // Which HTTP methods are allowed
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],

  // Allow cookies and authentication headers
  credentials: true,

  // For older browsers compatibility
  optionsSuccessStatus: 204,

  // How long browsers can cache CORS settings (1 hour)
  maxAge: 3600,

  // Allow all headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  // Expose headers to the client
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
};

// Export the CORS configuration
export default cors(corsOptions);

/*
HOW TO USE:

1. In your Express app:
   import corsConfig from './this-file.js';
   app.use(corsConfig);

2. Add your frontend URL to allowedOrigins array above

3. If you get CORS errors, make sure your frontend URL
   is exactly the same in the allowedOrigins array
*/
