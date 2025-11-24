import dotenv from "dotenv";

dotenv.config({path: ".env"});

// Server configuration with deployment-friendly defaults
// PORT is commonly used by deployment platforms (Railway, Render, Heroku, etc.)
// SERVER_HOST defaults to undefined (Express will listen on all interfaces)
export const SERVER_PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
export const SERVER_HOST = process.env.SERVER_HOST || undefined; // undefined = listen on all interfaces (0.0.0.0)

export const {
  NODE_ENV,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  RESEND_API_KEY,
  MAIL_FROM_EMAIL,
  MAIL_FROM_NAME,
  ADMIN_EMAIL,
  DATABASE_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
  PAYMONGO_PUBLIC_KEY,
  PAYMONGO_SECRET_KEY,
} = process.env;
