import {Router} from "express";
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getActiveDiscounts,
} from "../controllers/discount-controller.js";
import {authenticateToken} from "../middlewares/auth-middleware.js";

const discountRouter = Router();

// All routes require authentication
discountRouter.use(authenticateToken);

// Discount routes
discountRouter.get("/", getDiscounts);
discountRouter.get("/active", getActiveDiscounts);
discountRouter.get("/:id", getDiscountById);
discountRouter.post("/", createDiscount);
discountRouter.put("/:id", updateDiscount);
discountRouter.delete("/:id", deleteDiscount);

export default discountRouter;
