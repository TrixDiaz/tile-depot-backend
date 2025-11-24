import nodemailer from "nodemailer";
import {MAIL_USER, MAIL_PASS, MAIL_PORT} from "./env.js";
import {sendOtpEmailHtml, sendContactEmailHtml} from "../utils/email-format.js";

// Gmail SMTP configuration with increased timeouts for cloud platforms
// Default to port 587 (TLS), but can be overridden with MAIL_PORT env variable
// If port 587 is blocked on your platform, set MAIL_PORT=465 in your .env file
const smtpPort = parseInt(MAIL_PORT) || 587;
const useSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: smtpPort,
  secure: useSecure, // true for 465, false for other ports
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
  connectionTimeout: 60000, // 60 seconds (increased from default 2 seconds)
  greetingTimeout: 30000, // 30 seconds (increased from default 5 seconds)
  socketTimeout: 60000, // 60 seconds (increased from default 10 seconds)
  // Retry configuration
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  // Additional options for better reliability
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates if needed
  },
});

// Verify connection on startup (optional - can be called manually)
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready to send emails");
    return true;
  } catch (error) {
    console.error("❌ SMTP connection verification failed:", error.message);
    return false;
  }
};

const sendOtpEmail = async ({to, otp, name}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Auth Service" <${MAIL_USER}>`,
      to,
      subject: "OTP Verification",
      text: `Your OTP for registration is ${otp}`,
      html: sendOtpEmailHtml(name, otp),
    });
    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
};

const sendContactEmail = async ({
  to,
  firstName,
  lastName,
  email,
  subject,
  message,
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Contact Form" <${MAIL_USER}>`,
      to,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `New contact form submission from ${firstName} ${lastName} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: sendContactEmailHtml(firstName, lastName, email, subject, message),
    });
    console.log("📧 Contact email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error sending contact email:", err);
    throw err;
  }
};

export {transporter, sendOtpEmail, sendContactEmail, verifyConnection};
