import {Router} from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  upload,
} from "../controllers/product-controller.js";
import {
  authenticateToken,
  authenticateAdmin,
} from "../middlewares/auth-middleware.js";

const productRouter = Router();

// Get all products
productRouter.get("/", getProducts);

// Get product by ID
productRouter.get("/:id", getProductById);

// Create product with thumbnail and multiple images (Admin only)
productRouter.post(
  "/",
  authenticateAdmin,
  upload.fields([
    {name: "thumbnail", maxCount: 1},
    {name: "images", maxCount: 10},
  ]),
  createProduct
);

// Update product with thumbnail and multiple images (Admin only)
productRouter.put(
  "/:id",
  authenticateAdmin,
  upload.fields([
    {name: "thumbnail", maxCount: 1},
    {name: "images", maxCount: 10},
  ]),
  updateProduct
);

// Delete product (Admin only)
productRouter.delete("/:id", authenticateAdmin, deleteProduct);

export {productRouter};
