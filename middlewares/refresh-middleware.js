import {users} from "../drizzle/schema/schema.js";
import {db} from "../drizzle/index.js";
import {eq} from "drizzle-orm";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../config/jwt.js";

const refreshAuth = async (req, res, next) => {
  try {
    let refreshToken;

    // Check if refresh token is provided in the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      refreshToken = req.headers.authorization.split(" ")[1];
    }

    // If the refresh token is not provided, return an unauthorized error
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user || user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new access token and new refresh token
    const newAccessToken = generateAccessToken({userId: decoded.userId});
    const newRefreshToken = generateRefreshToken({userId: decoded.userId});

    // Attach the user and new tokens to the request object
    req.user = user[0];
    req.newAccessToken = newAccessToken;
    req.newRefreshToken = newRefreshToken;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      error: error.message,
    });
  }
};

export default refreshAuth;
