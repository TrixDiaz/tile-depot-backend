import {db} from "../drizzle/index.js";
import {eq, desc, count, and, gte, lte, like} from "drizzle-orm";
import {createNotification} from "./notification-controller.js";

// Mock promo codes data for now (in production, you'd create a proper table)
let promoCodes = [
  {
    id: "1",
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    usageLimit: 100,
    usedCount: 25,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    code: "SAVE50",
    discountType: "fixed",
    discountValue: 50,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    usageLimit: 50,
    usedCount: 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Get all promo codes
const getPromoCodes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    let filteredCodes = promoCodes;

    if (search) {
      filteredCodes = promoCodes.filter((code) =>
        code.code.toLowerCase().includes(search.toLowerCase())
      );
    }

    const totalCount = filteredCodes.length;
    const paginatedCodes = filteredCodes.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: {
        promoCodes: paginatedCodes,
        totalPages,
        currentPage: page,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get promo code by ID
const getPromoCodeById = async (req, res, next) => {
  try {
    const {id} = req.params;

    const promoCode = promoCodes.find((code) => code.id === id);

    if (!promoCode) {
      const error = new Error("Promo code not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Create promo code
const createPromoCode = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
      isActive = true,
    } = req.body;

    if (!code || !discountType || !discountValue) {
      const error = new Error(
        "Code, discount type, and discount value are required"
      );
      error.statusCode = 400;
      return next(error);
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      const error = new Error("Discount type must be 'percentage' or 'fixed'");
      error.statusCode = 400;
      return next(error);
    }

    // Check if code already exists
    const existingCode = promoCodes.find((pc) => pc.code === code);
    if (existingCode) {
      const error = new Error("Promo code already exists");
      error.statusCode = 409;
      return next(error);
    }

    const newPromoCode = {
      id: (promoCodes.length + 1).toString(),
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate
        ? new Date(endDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive,
      usageLimit: usageLimit || null,
      usedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    promoCodes.push(newPromoCode);

    // Create notification for promo code creation
    try {
      await createNotification(
        req.user?.id,
        "Promo Code Created",
        `New promo code "${code}" has been created successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Promo code created successfully",
      data: newPromoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Update promo code
const updatePromoCode = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {
      code,
      discountType,
      discountValue,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    const promoCodeIndex = promoCodes.findIndex((pc) => pc.id === id);
    if (promoCodeIndex === -1) {
      const error = new Error("Promo code not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check if new code already exists (if code is being changed)
    if (code && code !== promoCodes[promoCodeIndex].code) {
      const existingCode = promoCodes.find(
        (pc) => pc.code === code && pc.id !== id
      );
      if (existingCode) {
        const error = new Error("Promo code already exists");
        error.statusCode = 409;
        return next(error);
      }
    }

    if (discountType && !["percentage", "fixed"].includes(discountType)) {
      const error = new Error("Discount type must be 'percentage' or 'fixed'");
      error.statusCode = 400;
      return next(error);
    }

    const updatedPromoCode = {
      ...promoCodes[promoCodeIndex],
      ...(code && {code: code.toUpperCase()}),
      ...(discountType && {discountType}),
      ...(discountValue !== undefined && {
        discountValue: parseFloat(discountValue),
      }),
      ...(startDate && {startDate: new Date(startDate)}),
      ...(endDate && {endDate: new Date(endDate)}),
      ...(usageLimit !== undefined && {usageLimit}),
      ...(isActive !== undefined && {isActive}),
      updatedAt: new Date(),
    };

    promoCodes[promoCodeIndex] = updatedPromoCode;

    // Create notification for promo code update
    try {
      await createNotification(
        req.user?.id,
        "Promo Code Updated",
        `Promo code "${
          code || promoCodes[promoCodeIndex].code
        }" has been updated successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Promo code updated successfully",
      data: updatedPromoCode,
    });
  } catch (error) {
    next(error);
  }
};

// Delete promo code
const deletePromoCode = async (req, res, next) => {
  try {
    const {id} = req.params;

    const promoCodeIndex = promoCodes.findIndex((pc) => pc.id === id);
    if (promoCodeIndex === -1) {
      const error = new Error("Promo code not found");
      error.statusCode = 404;
      return next(error);
    }

    const deletedPromoCode = promoCodes[promoCodeIndex];
    promoCodes.splice(promoCodeIndex, 1);

    // Create notification for promo code deletion
    try {
      await createNotification(
        req.user?.id,
        "Promo Code Deleted",
        `Promo code "${deletedPromoCode.code}" has been deleted successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get active promo codes
const getActivePromoCodes = async (req, res, next) => {
  try {
    const now = new Date();

    const activeCodes = promoCodes.filter(
      (code) =>
        code.isActive &&
        new Date(code.startDate) <= now &&
        new Date(code.endDate) >= now &&
        (code.usageLimit === null || code.usedCount < code.usageLimit)
    );

    res.status(200).json({
      success: true,
      data: activeCodes,
    });
  } catch (error) {
    next(error);
  }
};

// Validate promo code
const validatePromoCode = async (req, res, next) => {
  try {
    const {code} = req.body;

    if (!code) {
      const error = new Error("Promo code is required");
      error.statusCode = 400;
      return next(error);
    }

    const promoCode = promoCodes.find((pc) => pc.code === code.toUpperCase());

    if (!promoCode) {
      const error = new Error("Invalid promo code");
      error.statusCode = 404;
      return next(error);
    }

    const now = new Date();
    const isValid =
      promoCode.isActive &&
      new Date(promoCode.startDate) <= now &&
      new Date(promoCode.endDate) >= now &&
      (promoCode.usageLimit === null ||
        promoCode.usedCount < promoCode.usageLimit);

    if (!isValid) {
      const error = new Error("Promo code is not valid or has expired");
      error.statusCode = 400;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        promoCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Increment promo code usage
const incrementPromoCodeUsage = async (req, res, next) => {
  try {
    const {code} = req.body;

    if (!code) {
      const error = new Error("Promo code is required");
      error.statusCode = 400;
      return next(error);
    }

    const promoCodeIndex = promoCodes.findIndex(
      (pc) => pc.code === code.toUpperCase()
    );

    if (promoCodeIndex === -1) {
      const error = new Error("Promo code not found");
      error.statusCode = 404;
      return next(error);
    }

    promoCodes[promoCodeIndex].usedCount += 1;
    promoCodes[promoCodeIndex].updatedAt = new Date();

    res.status(200).json({
      success: true,
      message: "Promo code usage incremented successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getPromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getActivePromoCodes,
  validatePromoCode,
  incrementPromoCodeUsage,
};
