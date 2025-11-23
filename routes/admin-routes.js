import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
} from "../controllers/admin-controller.js";
import {authenticateAdmin} from "../middlewares/auth-middleware.js";

const router = express.Router();

// Apply admin authentication middleware to all admin routes
router.use(authenticateAdmin);

// User management routes
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Product management routes
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Order management routes
router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus);

export default router;
