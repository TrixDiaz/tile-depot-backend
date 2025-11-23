import {sendContactEmail} from "../config/mailer.js";
import {MAIL_USER} from "../config/env.js";

const submitContactForm = async (req, res, next) => {
  try {
    const {firstName, lastName, email, subject, message} = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      const error = new Error("All fields are required");
      error.statusCode = 400;
      return next(error);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      return next(error);
    }

    // Send email to the configured mail user (admin email)
    await sendContactEmail({
      to: MAIL_USER,
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    error.statusCode = error.statusCode || 500;
    error.message = error.message || "Failed to send message. Please try again later.";
    next(error);
  }
};

export {submitContactForm};

