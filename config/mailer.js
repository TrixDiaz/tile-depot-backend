import { Resend } from "resend";
import {RESEND_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME} from "./env.js";
import {sendOtpEmailHtml, sendContactEmailHtml} from "../utils/email-format.js";

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

// Verify connection on startup (optional - can be called manually)
const verifyConnection = async () => {
  try {
    // Resend doesn't have a verify method, but we can test by checking if API key is set
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.log("✅ Resend is ready to send emails");
    return true;
  } catch (error) {
    console.error("❌ Resend connection verification failed:", error.message);
    return false;
  }
};

const sendOtpEmail = async ({to, otp, name}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${MAIL_FROM_NAME || "Auth Service"} <${MAIL_FROM_EMAIL}>`,
      to,
      subject: "OTP Verification",
      text: `Your OTP for registration is ${otp}`,
      html: sendOtpEmailHtml(name, otp),
    });

    if (error) {
      throw error;
    }

    console.log("📧 Email sent:", data?.id);
    return data;
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
    const { data, error } = await resend.emails.send({
      from: `${MAIL_FROM_NAME || "Contact Form"} <${MAIL_FROM_EMAIL}>`,
      to,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `New contact form submission from ${firstName} ${lastName} (${email})\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: sendContactEmailHtml(firstName, lastName, email, subject, message),
    });

    if (error) {
      throw error;
    }

    console.log("📧 Contact email sent:", data?.id);
    return data;
  } catch (err) {
    console.error("❌ Error sending contact email:", err);
    throw err;
  }
};

export {resend, sendOtpEmail, sendContactEmail, verifyConnection};
