import {users} from "../drizzle/schema/schema.js";
import {db} from "../drizzle/index.js";
import {eq} from "drizzle-orm";
import {verifyAccessToken} from "../config/jwt.js";

const authorize = async (req, res, next) => {
  try {
    let token;

    // Check if the token is provided in the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If the token is not provided, return an unauthorized error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, no token provided",
      });
    }

    // Remove development bypass - use proper JWT verification

    // Verify the token
    const decoded = verifyAccessToken(token);
    console.log("Auth middleware - decoded token userId:", decoded.userId);

    if (!decoded.userId) {
      console.log("Auth middleware - no userId in decoded token");
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    console.log("Auth middleware - user found:", user.length > 0);
    console.log("Auth middleware - searching for userId:", decoded.userId);

    if (!user || user.length === 0) {
      console.log(
        "Auth middleware - user not found for userId:",
        decoded.userId
      );
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
        debug: {
          userId: decoded.userId,
          tokenProvided: !!token,
        },
      });
    }

    // Attach the user to the request object
    req.user = user[0];
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access",
      error: error.message,
    });
  }
};

// Admin authentication middleware (now just regular auth without role checking)
const authenticateAdmin = async (req, res, next) => {
  try {
    let token;

    // Check if the token is provided in the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If the token is not provided, return an unauthorized error
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, no token provided",
      });
    }

    // Verify the token
    const decoded = verifyAccessToken(token);
    console.log(
      "Admin auth middleware - decoded token userId:",
      decoded.userId
    );

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    console.log("Admin auth middleware - user found:", user.length > 0);

    if (!user || user.length === 0) {
      console.log(
        "Admin auth middleware - user not found for userId:",
        decoded.userId
      );
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, user not found",
      });
    }

    // No role checking - any authenticated user can access admin endpoints
    console.log("Admin auth middleware - user authenticated:", user[0].email);

    // Attach the user to the request object
    req.user = user[0];
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access",
      error: error.message,
    });
  }
};

export default authorize;
export {authorize as authenticateToken, authenticateAdmin};
