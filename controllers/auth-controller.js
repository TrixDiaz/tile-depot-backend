import {db} from "../drizzle/index.js";
import {eq} from "drizzle-orm";
import {users, otps} from "../drizzle/schema/schema.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import {generateOTP, generateOTPExpiresAt} from "../config/otp.js";
import {sendOtpEmail} from "../config/mailer.js";

const registerUser = async (req, res, next) => {
  try {
    const {email, name} = req.body;

    // Validate required fields
    if (!email || !name) {
      const error = new Error("Email and name are required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const error = new Error("Email already taken");
      error.statusCode = 409;
      return next(error);
    }

    // Insert new user into database
    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
      })
      .returning();

    // Return user data (without sensitive information)
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const generateOTPForUser = async (req, res, next) => {
  try {
    const {email} = req.body;

    // Check if email exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      const error = new Error("Account Not Found");
      error.statusCode = 404;
      return next(error);
    }

    if (existingUser.isVerified === false) {
      const error = new Error("Account Found but User is not verified");
      error.statusCode = 409;
      return next(error);
    }

    const existingOtp = await db
      .select()
      .from(otps)
      .where(eq(otps.userId, existingUser.id))
      .limit(1);

    if (existingOtp.length > 0) {
      const error = new Error(
        "OTP already exists for this user, please check your email"
      );
      error.statusCode = 409;
      return next(error);
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiresAt();

    // Send OTP to user given email
    await sendOtpEmail({to: email, otp, name: existingUser.name});

    // Insert OTP into database
    await db.insert(otps).values({
      userId: existingUser.id,
      otp,
      expiresAt,
    });

    // Return OTP
    res.status(200).json({
      success: true,
      message: "Account Found and User is verified",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        isVerified: existingUser.isVerified,
        createdAt: existingUser.createdAt,
      },
      otp,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

const regenerateOTPForUser = async (req, res, next) => {
  try {
    const {email} = req.body;

    // Check if email exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    // Delete any existing OTP for the user
    await db.delete(otps).where(eq(otps.userId, existingUser.id));

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = generateOTPExpiresAt();

    // Send OTP to user given email
    await sendOtpEmail({to: email, otp, name: existingUser.name});

    // Insert new OTP into database
    await db.insert(otps).values({
      userId: existingUser.id,
      otp,
      expiresAt,
    });

    // Return success response with new OTP
    res.status(200).json({
      success: true,
      message: "OTP regenerated successfully",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        isVerified: existingUser.isVerified,
        createdAt: existingUser.createdAt,
      },
      otp,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

const verifyUserOtp = async (req, res, next) => {
  try {
    const {email, otp} = req.body;

    // Validate required fields
    if (!email || !otp) {
      const error = new Error("Email and otp are required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if email exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if otp is correct
    const [existingOtp] = await db
      .select()
      .from(otps)
      .where(eq(otps.userId, existingUser.id))
      .limit(1);

    if (!existingOtp) {
      const error = new Error("OTP not found or expired");
      error.statusCode = 404;
      return next(error);
    }

    if (existingOtp.otp !== otp || existingOtp.expiresAt < new Date()) {
      const error = new Error("Invalid or expired OTP");
      error.statusCode = 400;
      return next(error);
    }

    // Generate tokens
    const accessToken = generateAccessToken({userId: existingUser.id});
    const refreshToken = generateRefreshToken({userId: existingUser.id});

    // Delete otp after successful login
    await db.delete(otps).where(eq(otps.userId, existingUser.id));

    // Return tokens and user data
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        isVerified: existingUser.isVerified,
        createdAt: existingUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    // The refreshAuth middleware already validated the refresh token
    // and generated new access and refresh tokens
    const newAccessToken = req.newAccessToken;
    const newRefreshToken = req.newRefreshToken;

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    // The auth middleware already validated the token and set req.user
    const user = req.user;
    console.log("getUserProfile - user from middleware:", user);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  registerUser,
  generateOTPForUser,
  regenerateOTPForUser,
  verifyUserOtp,
  refreshToken,
  getUserProfile,
};
