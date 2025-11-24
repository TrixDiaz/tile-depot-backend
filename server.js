import express from "express";
import helmetConfig from "./config/helmet.js";
import corsConfig from "./config/cors.js";
import {SERVER_HOST, SERVER_PORT} from "./config/env.js";
import {authRouter} from "./routes/auth-routes.js";
import errorMiddleware from "./middlewares/error-middleware.js";
import cookieParser from "cookie-parser";
import {userRouter} from "./routes/user-routes.js";
import {oauthRouter} from "./routes/oauth-routes.js";
import {productRouter} from "./routes/product-routes.js";
import {brandRouter} from "./routes/brand-routes.js";
import {categoryRouter} from "./routes/category-routes.js";
import adminRouter from "./routes/admin-routes.js";
import discountRouter from "./routes/discount-routes.js";
import promoRouter from "./routes/promo-routes.js";
import notificationRouter from "./routes/notification-routes.js";
import salesRouter from "./routes/sales-routes.js";
import reviewRouter from "./routes/review-routes.js";
import analyticsRouter from "./routes/analytics-routes.js";
import paymentRouter from "./routes/payment-routes.js";
import {contactRouter} from "./routes/contact-routes.js";

const app = express();

// Security middleware
app.use(helmetConfig); // Security headers
app.use(corsConfig); // CORS
// app.use(ratelimiter); // Rate limiting - commented out temporarily

// Body parsing middleware
app.use(express.json({limit: "100mb"}));
app.use(express.urlencoded({extended: true, limit: "100mb"}));
app.use(cookieParser());

// Serve static files (uploaded images) with proper headers
app.use(
  "/uploads",
  (req, res, next) => {
    // Set CORS headers for static files
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Cross-Origin-Embedder-Policy", "unsafe-none");

    // Set cache headers
    res.header("Cache-Control", "public, max-age=3600");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  },
  express.static("uploads")
);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/oauth", oauthRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/discounts", discountRouter);
app.use("/api/v1/promos", promoRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/admin/analytics", analyticsRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/contact", contactRouter);
// Health check route
app.get("/", (_req, res) => {
  res.json({
    message: "Backend Authentication Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
// If SERVER_HOST is undefined, Express listens on all interfaces (0.0.0.0)
// This is ideal for deployment platforms
const server = app.listen(SERVER_PORT, SERVER_HOST, () => {
  const host = SERVER_HOST || "0.0.0.0";
  const port = SERVER_PORT;
  console.log(`🚀 Server is running on http://${host}:${port}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  if (SERVER_HOST) {
    console.log(`🌐 Listening on specific host: ${SERVER_HOST}`);
  } else {
    console.log(`🌐 Listening on all network interfaces (0.0.0.0)`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
