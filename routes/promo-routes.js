import {Router} from "express";
import {
  getPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getActivePromoCodes,
  validatePromoCode,
  incrementPromoCodeUsage,
} from "../controllers/promo-controller.js";
import {
  authenticateToken,
  authenticateAdmin,
} from "../middlewares/auth-middleware.js";

const promoRouter = Router();

// Public routes (before authentication)
promoRouter.post("/validate", validatePromoCode);
promoRouter.post("/increment", incrementPromoCodeUsage);

// Promo code routes (Admin only for management)
promoRouter.get("/", authenticateAdmin, getPromoCodes);
promoRouter.get("/active", getActivePromoCodes);
promoRouter.get("/:id", authenticateAdmin, getPromoCodeById);
promoRouter.post("/", authenticateAdmin, createPromoCode);
promoRouter.put("/:id", authenticateAdmin, updatePromoCode);
promoRouter.delete("/:id", authenticateAdmin, deletePromoCode);

export default promoRouter;
