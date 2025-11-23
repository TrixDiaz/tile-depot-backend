import rateLimit from "express-rate-limit";

const ratelimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5, // Maximum 5 requests per minute
  message: {
    success: false,
    message: "Rate limit exceeded. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default ratelimiter;
