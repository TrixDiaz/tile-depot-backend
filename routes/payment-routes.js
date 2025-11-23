import express from "express";
import {authenticateToken} from "../middlewares/auth-middleware.js";
import {
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentIntent,
  createPaymentSource,
  getPaymentIntentStatus,
  getPaymentSourceStatus,
  createCheckoutSession,
  getCheckoutSessionStatus,
  handlePaymongoWebhook,
} from "../controllers/payment-controller.js";

const router = express.Router();

// Webhook route (no authentication needed - PayMongo sends this)
router.post("/webhook", handlePaymongoWebhook);

// All other routes require authentication
router.use(authenticateToken);

// Create payment intent
router.post("/intent", createPaymentIntent);

// Create payment method
router.post("/method", createPaymentMethod);

// Attach payment method to intent
router.post("/intent/attach", attachPaymentIntent);

// Create payment source (for GCash/Maya redirect flow)
router.post("/source", createPaymentSource);

// Get payment intent status
router.get("/intent/:id", getPaymentIntentStatus);

// Get payment source status
router.get("/source/:id", getPaymentSourceStatus);

// Create checkout session (recommended for GCash/Maya)
router.post("/checkout", createCheckoutSession);

// Get checkout session status
router.get("/checkout/:id", getCheckoutSessionStatus);

export default router;
