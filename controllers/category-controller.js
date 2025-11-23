import {db} from "../drizzle/index.js";
import {categories, products} from "../drizzle/schema/schema.js";
import {eq, count, like, or, and, ne, asc, desc} from "drizzle-orm";
import {createNotification} from "./notification-controller.js";

// Get all categories with pagination and search
const getCategories = async (req, res, next) => {
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
      whereConditions.push(like(categories.name, searchTerm));
    }

    const whereClause =
      whereConditions.length > 0 ? or(...whereConditions) : undefined;

    // Get total count for pagination
    const [totalResult] = await db
      .select({count: count()})
      .from(categories)
      .where(whereClause);

    const totalCategories = totalResult.count;
    const totalPages = Math.ceil(totalCategories / limitNum);

    // Get categories with pagination
    let orderBy;
    if (sortBy === "name") {
      orderBy =
        sortOrder === "desc" ? desc(categories.name) : asc(categories.name);
    } else if (sortBy === "createdAt") {
      orderBy =
        sortOrder === "desc"
          ? desc(categories.createdAt)
          : asc(categories.createdAt);
    } else {
      orderBy = asc(categories.name); // default sort
    }

    const result = await db
      .select()
      .from(categories)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: {
        categories: result,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCategories,
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

// Get category by ID
const getCategoryById = async (req, res, next) => {
  try {
    const {id} = req.params;

    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      category: result[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create category
const createCategory = async (req, res, next) => {
  try {
    const {name} = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category already exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name));

    if (existingCategory.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const [newCategory] = await db
      .insert(categories)
      .values({name})
      .returning();

    // Create notification for category creation
    try {
      await createNotification(
        req.user?.id,
        "Category Created",
        `New category "${name}" has been created successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

// Update category
const updateCategory = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {name} = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Check if category already exists (excluding current category)
    const existingCategory = await db
      .select()
      .from(categories)
      .where(and(eq(categories.name, name), ne(categories.id, id)));

    if (existingCategory.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({name, updatedAt: new Date()})
      .where(eq(categories.id, id))
      .returning();

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Create notification for category update
    try {
      await createNotification(
        req.user?.id,
        "Category Updated",
        `Category "${name}" has been updated successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  try {
    const {id} = req.params;

    // Check if category is being used by any products
    const productsUsingCategory = await db
      .select({count: count()})
      .from(products)
      .where(eq(products.categoryId, id));

    if (productsUsingCategory[0].count > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete category. It is being used by existing products.",
      });
    }

    const deletedCategory = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!deletedCategory.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Create notification for category deletion
    try {
      await createNotification(
        req.user?.id,
        "Category Deleted",
        `Category "${deletedCategory[0].name}" has been deleted successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
