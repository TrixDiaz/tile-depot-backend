import {db} from "../drizzle/index.js";
import {eq, desc, count, and, gte, lte} from "drizzle-orm";
import {products} from "../drizzle/schema/schema.js";

// Get all discounts
const getDiscounts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const discounts = await db
      .select()
      .from(products)
      .where(eq(products.discount, true))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db
      .select({count: count()})
      .from(products)
      .where(eq(products.discount, true));

    const totalPages = Math.ceil(totalCount.count / limit);

    res.status(200).json({
      success: true,
      data: {
        discounts,
        totalPages,
        currentPage: page,
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get discount by ID
const getDiscountById = async (req, res, next) => {
  try {
    const {id} = req.params;

    const [discount] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.discount, true)));

    if (!discount) {
      const error = new Error("Discount not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error) {
    next(error);
  }
};

// Create discount
const createDiscount = async (req, res, next) => {
  try {
    const {
      productId,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    if (!productId || !discountType || !discountValue) {
      const error = new Error(
        "Product ID, discount type, and discount value are required"
      );
      error.statusCode = 400;
      return next(error);
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      const error = new Error("Discount type must be 'percentage' or 'fixed'");
      error.statusCode = 400;
      return next(error);
    }

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      return next(error);
    }

    // Calculate discount price
    let discountPrice;
    if (discountType === "percentage") {
      discountPrice = product.price * (1 - discountValue / 100);
    } else {
      discountPrice = Math.max(0, product.price - discountValue);
    }

    // Update product with discount
    const [updatedProduct] = await db
      .update(products)
      .set({
        discount: true,
        discountPrice: discountPrice.toString(),
        isOnSale: true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    res.status(201).json({
      success: true,
      message: "Discount created successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Update discount
const updateDiscount = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {discountType, discountValue, isActive} = req.body;

    // Get current product
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.discount, true)));

    if (!product) {
      const error = new Error("Discount not found");
      error.statusCode = 404;
      return next(error);
    }

    let updateData = {updatedAt: new Date()};

    if (discountType && discountValue !== undefined) {
      if (!["percentage", "fixed"].includes(discountType)) {
        const error = new Error(
          "Discount type must be 'percentage' or 'fixed'"
        );
        error.statusCode = 400;
        return next(error);
      }

      // Calculate new discount price
      let discountPrice;
      if (discountType === "percentage") {
        discountPrice = parseFloat(product.price) * (1 - discountValue / 100);
      } else {
        discountPrice = Math.max(0, parseFloat(product.price) - discountValue);
      }

      updateData.discountPrice = discountPrice.toString();
    }

    if (isActive !== undefined) {
      updateData.discount = isActive;
      updateData.isOnSale = isActive;
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete discount (remove discount from product)
const deleteDiscount = async (req, res, next) => {
  try {
    const {id} = req.params;

    const [updatedProduct] = await db
      .update(products)
      .set({
        discount: false,
        discountPrice: null,
        isOnSale: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Discount removed successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Get active discounts
const getActiveDiscounts = async (req, res, next) => {
  try {
    const now = new Date();

    const activeDiscounts = await db
      .select()
      .from(products)
      .where(and(eq(products.discount, true), eq(products.isOnSale, true)))
      .orderBy(desc(products.createdAt));

    res.status(200).json({
      success: true,
      data: activeDiscounts,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getActiveDiscounts,
};
