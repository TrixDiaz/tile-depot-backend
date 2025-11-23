import {Router} from "express";
import {
  registerUser,
  generateOTPForUser,
  regenerateOTPForUser,
  verifyUserOtp,
  refreshToken,
  getUserProfile,
} from "../controllers/auth-controller.js";
import refreshAuth from "../middlewares/refresh-middleware.js";
import authMiddleware from "../middlewares/auth-middleware.js";

const authRouter = Router();

authRouter.post("/signup", registerUser);
authRouter.post("/generate-otp", generateOTPForUser);
authRouter.post("/resend-otp", regenerateOTPForUser);
authRouter.post("/verify-otp", verifyUserOtp);
authRouter.post("/refresh-token", refreshAuth, refreshToken);
authRouter.get("/me", authMiddleware, getUserProfile);

export {authRouter};
