import {db} from "../drizzle/index.js";
import {brands, products} from "../drizzle/schema/schema.js";
import {eq, count, like, or, and, ne, asc, desc} from "drizzle-orm";
import {createNotification} from "./notification-controller.js";

// Get all brands with pagination and search
const getBrands = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Validate and parse parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    let whereConditions = [];
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(like(brands.name, searchTerm));
    }

    const whereClause =
      whereConditions.length > 0 ? or(...whereConditions) : undefined;

    // Get total count for pagination
    const [totalResult] = await db
      .select({count: count()})
      .from(brands)
      .where(whereClause);

    const totalBrands = totalResult.count;
    const totalPages = Math.ceil(totalBrands / limitNum);

    // Get brands with pagination
    let orderBy;
    if (sortBy === "name") {
      orderBy = sortOrder === "desc" ? desc(brands.name) : asc(brands.name);
    } else if (sortBy === "createdAt") {
      orderBy =
        sortOrder === "desc" ? desc(brands.createdAt) : asc(brands.createdAt);
    } else {
      orderBy = asc(brands.name); // default sort
    }

    const result = await db
      .select()
      .from(brands)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data: {
        brands: result,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalBrands,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum,
          offset,
        },
        appliedFilters: {
          search: search || null,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get brand by ID
const getBrandById = async (req, res, next) => {
  try {
    const {id} = req.params;

    const result = await db.select().from(brands).where(eq(brands.id, id));

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
      brand: result[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create brand
const createBrand = async (req, res, next) => {
  try {
    const {name} = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    // Check if brand already exists
    const existingBrand = await db
      .select()
      .from(brands)
      .where(eq(brands.name, name));

    if (existingBrand.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Brand with this name already exists",
      });
    }

    const [newBrand] = await db.insert(brands).values({name}).returning();

    // Create notification for brand creation
    try {
      await createNotification(
        req.user?.id,
        "Brand Created",
        `New brand "${name}" has been created successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand: newBrand,
    });
  } catch (error) {
    next(error);
  }
};

// Update brand
const updateBrand = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {name} = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    // Check if brand already exists (excluding current brand)
    const existingBrand = await db
      .select()
      .from(brands)
      .where(and(eq(brands.name, name), ne(brands.id, id)));

    if (existingBrand.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Brand with this name already exists",
      });
    }

    const [updatedBrand] = await db
      .update(brands)
      .set({name, updatedAt: new Date()})
      .where(eq(brands.id, id))
      .returning();

    if (!updatedBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Create notification for brand update
    try {
      await createNotification(
        req.user?.id,
        "Brand Updated",
        `Brand "${name}" has been updated successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      brand: updatedBrand,
    });
  } catch (error) {
    next(error);
  }
};

// Delete brand
const deleteBrand = async (req, res, next) => {
  try {
    const {id} = req.params;

    // Check if brand is being used by any products
    const productsUsingBrand = await db
      .select({count: count()})
      .from(products)
      .where(eq(products.brandId, id));

    if (productsUsingBrand[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete brand. It is being used by existing products.",
      });
    }

    const deletedBrand = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning();

    if (!deletedBrand.length) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Create notification for brand deletion
    try {
      await createNotification(
        req.user?.id,
        "Brand Deleted",
        `Brand "${deletedBrand[0].name}" has been deleted successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {getBrands, getBrandById, createBrand, updateBrand, deleteBrand};
