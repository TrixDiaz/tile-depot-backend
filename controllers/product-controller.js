import {db} from "../drizzle/index.js";
import {products, categories, brands} from "../drizzle/schema/schema.js";
import {createNotification} from "./notification-controller.js";
import {
  eq,
  and,
  or,
  like,
  gte,
  lte,
  desc,
  asc,
  sql,
  count,
  isNotNull,
} from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = "uploads/products";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, {recursive: true});
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Get current date in Philippines timezone (Asia/Manila)
    const now = new Date();
    const philippinesDate = new Date(
      now.toLocaleString("en-US", {timeZone: "Asia/Manila"})
    );

    const month = String(philippinesDate.getMonth() + 1).padStart(2, "0");
    const day = String(philippinesDate.getDate()).padStart(2, "0");
    const year = philippinesDate.getFullYear();

    const uniqueSuffix = `${month}-${day}-${year}-${Math.round(
      Math.random() * 1e9
    )}`;
    const originalName = path.parse(file.originalname).name; // Get filename without extension
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "-" +
        originalName +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 11, // Max 11 files (1 thumbnail + 10 images)
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|jfif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files (jpeg, jpg, png, gif, jfif, webp) are allowed!"
        )
      );
    }
  },
});

// Get all products with pagination, filtering, search, and sorting
const getProducts = async (req, res, next) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
      isNew,
      isBestSeller,
      isTopRated,
      isOnSale,
      isTrending,
      isHot,
      isFeatured,
      inStock = true,
    } = req.query;

    // Validate and parse parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const whereConditions = [];

    // Search functionality
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm)
        )
      );
    }

    // Category filter
    if (category) {
      whereConditions.push(eq(products.categoryId, category));
    }

    // Brand filter
    if (brand) {
      whereConditions.push(eq(products.brandId, brand));
    }

    // Price range filters
    if (minPrice) {
      whereConditions.push(gte(products.price, minPrice));
    }
    if (maxPrice) {
      whereConditions.push(lte(products.price, maxPrice));
    }

    // Product flag filters
    if (isNew !== undefined) {
      whereConditions.push(eq(products.isNew, isNew === "true"));
    }
    if (isBestSeller !== undefined) {
      whereConditions.push(eq(products.isBestSeller, isBestSeller === "true"));
    }
    if (isTopRated !== undefined) {
      whereConditions.push(eq(products.isTopRated, isTopRated === "true"));
    }
    if (isOnSale !== undefined) {
      whereConditions.push(eq(products.isOnSale, isOnSale === "true"));
    }
    if (isTrending !== undefined) {
      whereConditions.push(eq(products.isTrending, isTrending === "true"));
    }
    if (isHot !== undefined) {
      whereConditions.push(eq(products.isHot, isHot === "true"));
    }
    if (isFeatured !== undefined) {
      whereConditions.push(eq(products.isFeatured, isFeatured === "true"));
    }

    // Stock filter
    if (inStock === "true") {
      whereConditions.push(sql`${products.stock} > 0`);
    }

    // Build sort order
    let orderBy;
    const validSortFields = [
      "name",
      "price",
      "rating",
      "createdAt",
      "updatedAt",
      "sold",
      "stock",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? asc : desc;

    switch (sortField) {
      case "name":
        orderBy = order(products.name);
        break;
      case "price":
        orderBy = order(products.price);
        break;
      case "rating":
        orderBy = order(products.rating);
        break;
      case "sold":
        orderBy = order(products.sold);
        break;
      case "stock":
        orderBy = order(products.stock);
        break;
      case "updatedAt":
        orderBy = order(products.updatedAt);
        break;
      default:
        orderBy = order(products.createdAt);
    }

    // Build the query
    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count for pagination
    const [totalResult] = await db
      .select({count: count()})
      .from(products)
      .where(whereClause);

    const totalProducts = totalResult.count;
    const totalPages = Math.ceil(totalProducts / limitNum);

    // Get products with pagination and joins
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        discount: products.discount,
        discountPrice: products.discountPrice,
        stock: products.stock,
        sold: products.sold,
        thumbnail: products.thumbnail,
        images: products.images,
        rating: products.rating,
        isNew: products.isNew,
        isBestSeller: products.isBestSeller,
        isTopRated: products.isTopRated,
        isOnSale: products.isOnSale,
        isTrending: products.isTrending,
        isHot: products.isHot,
        isFeatured: products.isFeatured,
        numReviews: products.numReviews,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: categories.name,
        brand: brands.name,
        categoryId: products.categoryId,
        brandId: products.brandId,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    // Parse images for each product
    const productsWithParsedImages = result.map((product) => ({
      ...product,
      images: JSON.parse(product.images || "[]").map((img) =>
        img.replace(/\\/g, "/")
      ),
      thumbnail: product.thumbnail
        ? product.thumbnail.replace(/\\/g, "/")
        : null,
    }));

    // Get available categories and brands for filter options
    let availableCategories = [];
    let availableBrands = [];

    try {
      // Get all categories that have products
      const categoriesWithProducts = await db
        .selectDistinct({id: categories.id, name: categories.name})
        .from(categories)
        .innerJoin(products, eq(categories.id, products.categoryId));

      // Get all brands that have products
      const brandsWithProducts = await db
        .selectDistinct({id: brands.id, name: brands.name})
        .from(brands)
        .innerJoin(products, eq(brands.id, products.brandId));

      availableCategories = categoriesWithProducts.map((cat) => cat.name);
      availableBrands = brandsWithProducts.map((brand) => brand.name);
    } catch (error) {
      console.warn("Error fetching filter options:", error.message);
      // Continue with empty arrays if there's an error
    }

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: {
        products: productsWithParsedImages,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum,
          offset,
        },
        filters: {
          availableCategories,
          availableBrands,
        },
        appliedFilters: {
          search: search || null,
          category: category || null,
          brand: brand || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          isNew: isNew || null,
          isBestSeller: isBestSeller || null,
          isTopRated: isTopRated || null,
          isOnSale: isOnSale || null,
          isTrending: isTrending || null,
          isHot: isHot || null,
          isFeatured: isFeatured || null,
          inStock: inStock || null,
          sortBy: sortField,
          sortOrder: sortOrder,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    const {id} = req.params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        discount: products.discount,
        discountPrice: products.discountPrice,
        stock: products.stock,
        sold: products.sold,
        thumbnail: products.thumbnail,
        images: products.images,
        rating: products.rating,
        isNew: products.isNew,
        isBestSeller: products.isBestSeller,
        isTopRated: products.isTopRated,
        isOnSale: products.isOnSale,
        isTrending: products.isTrending,
        isHot: products.isHot,
        isFeatured: products.isFeatured,
        numReviews: products.numReviews,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: categories.name,
        brand: brands.name,
        categoryId: products.categoryId,
        brandId: products.brandId,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(products.id, id));

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Parse images for the product
    const product = {
      ...result[0],
      images: JSON.parse(result[0].images || "[]").map((img) =>
        img.replace(/\\/g, "/")
      ),
      thumbnail: result[0].thumbnail
        ? result[0].thumbnail.replace(/\\/g, "/")
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: product,
    });
  } catch (error) {
    next(error);
  }
};

// Create product with multiple images and single thumbnail
const createProduct = async (req, res, next) => {
  try {
    const data = req.body;

    // Debug: Log the received data
    console.log("Received product data:", data);
    console.log("Name:", data.name, "Price:", data.price);
    console.log("Received files:", req.files);
    console.log("File keys:", req.files ? Object.keys(req.files) : "No files");

    // Validate required fields
    if (
      !data.name ||
      !data.price ||
      !data.categoryId ||
      !data.brandId ||
      data.name.trim() === "" ||
      data.price.trim() === "" ||
      data.categoryId.trim() === "" ||
      data.brandId.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price, category, and brand are required",
      });
    }

    // Validate price is a valid number
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    // Validate stock is a valid number
    const stock = parseInt(data.stock) || 0;
    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative number",
      });
    }

    // Handle thumbnail (single file)
    let thumbnailPath = null;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      // Normalize path separators to forward slashes
      thumbnailPath = req.files.thumbnail[0].path.replace(/\\/g, "/");
    }

    // Handle multiple images
    let imagesArray = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      imagesArray = req.files.images.map((file) =>
        file.path.replace(/\\/g, "/")
      );
    }

    console.log("Thumbnail path:", thumbnailPath);
    console.log("Images array:", imagesArray);

    // Prepare product data with proper type conversion and validation
    const productData = {
      name: data.name?.trim(),
      description: data.description?.trim(),
      price: data.price?.trim(),
      discount: data.discount === "true" || data.discount === true,
      discountPrice: data.discountPrice?.trim() || null,
      stock: parseInt(data.stock) || 0,
      sold: 0, // Default value
      thumbnail: thumbnailPath,
      images: JSON.stringify(imagesArray), // Store as JSON string
      categoryId: data.categoryId,
      brandId: data.brandId,
      rating: null, // Default value
      isNew: data.isNew === "true" || data.isNew === true,
      isBestSeller: data.isBestSeller === "true" || data.isBestSeller === true,
      isTopRated: data.isTopRated === "true" || data.isTopRated === true,
      isOnSale: data.isOnSale === "true" || data.isOnSale === true,
      isTrending: data.isTrending === "true" || data.isTrending === true,
      isHot: data.isHot === "true" || data.isHot === true,
      isFeatured: data.isFeatured === "true" || data.isFeatured === true,
      numReviews: 0, // Default value
    };

    const [newProduct] = await db
      .insert(products)
      .values(productData)
      .returning();

    // Parse images back to array for response
    const responseProduct = {
      ...newProduct,
      images: JSON.parse(newProduct.images || "[]").map((img) =>
        img.replace(/\\/g, "/")
      ),
      thumbnail: newProduct.thumbnail
        ? newProduct.thumbnail.replace(/\\/g, "/")
        : null,
    };

    // Create notification for product creation
    try {
      await createNotification(
        req.user?.id,
        "Product Created",
        `New product "${data.name}" has been created successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: responseProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  try {
    const {id} = req.params;
    const data = req.body;

    // Debug: Log the received data
    console.log("🔍 Update Product - Received data:", data);
    console.log("🔍 Update Product - req.body:", req.body);
    console.log("🔍 Update Product - req.files:", req.files);
    console.log("🔍 Update Product - req.params:", req.params);

    // Get existing product to handle file cleanup
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle thumbnail update
    let thumbnailPath = existingProduct.thumbnail; // Keep existing if no new file
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      // Delete old thumbnail if it exists
      if (
        existingProduct.thumbnail &&
        fs.existsSync(existingProduct.thumbnail)
      ) {
        try {
          fs.unlinkSync(existingProduct.thumbnail);
        } catch (fileError) {
          console.error("Error deleting old thumbnail:", fileError);
        }
      }
      // Normalize path separators to forward slashes
      thumbnailPath = req.files.thumbnail[0].path.replace(/\\/g, "/");
    }

    // Handle images update
    let imagesArray = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Delete old images if they exist
      if (existingProduct.images) {
        try {
          const oldImages = JSON.parse(existingProduct.images);
          oldImages.forEach((imagePath) => {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          });
        } catch (fileError) {
          console.error("Error deleting old images:", fileError);
        }
      }
      // Add new images
      imagesArray = req.files.images.map((file) =>
        file.path.replace(/\\/g, "/")
      );
    } else {
      // Keep existing images if no new files uploaded
      imagesArray = existingProduct.images
        ? JSON.parse(existingProduct.images)
        : [];
    }

    // Prepare update data with proper type conversion and validation
    const updateData = {
      name: data.name?.trim(),
      description: data.description?.trim(),
      price: data.price?.trim(),
      discount: data.discount === "true" || data.discount === true,
      discountPrice: data.discountPrice?.trim() || null,
      stock: parseInt(data.stock) || 0,
      thumbnail: thumbnailPath,
      images: JSON.stringify(imagesArray),
      categoryId: data.categoryId,
      brandId: data.brandId,
      isNew: data.isNew === "true" || data.isNew === true,
      isBestSeller: data.isBestSeller === "true" || data.isBestSeller === true,
      isTopRated: data.isTopRated === "true" || data.isTopRated === true,
      isOnSale: data.isOnSale === "true" || data.isOnSale === true,
      isTrending: data.isTrending === "true" || data.isTrending === true,
      isHot: data.isHot === "true" || data.isHot === true,
      isFeatured: data.isFeatured === "true" || data.isFeatured === true,
      updatedAt: new Date(),
    };

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Parse images back to array for response
    const responseProduct = {
      ...updatedProduct,
      images: JSON.parse(updatedProduct.images || "[]").map((img) =>
        img.replace(/\\/g, "/")
      ),
      thumbnail: updatedProduct.thumbnail
        ? updatedProduct.thumbnail.replace(/\\/g, "/")
        : null,
    };

    // Create notification for product update
    try {
      await createNotification(
        req.user?.id,
        "Product Updated",
        `Product "${
          data.name || existingProduct.name
        }" has been updated successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: responseProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const {id} = req.params;

    // Get product first to delete associated files
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete files from filesystem
    try {
      if (product.thumbnail && fs.existsSync(product.thumbnail)) {
        fs.unlinkSync(product.thumbnail);
      }

      if (product.images) {
        const images = JSON.parse(product.images);
        images.forEach((imagePath) => {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
    } catch (fileError) {
      console.error("Error deleting files:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    await db.delete(products).where(eq(products.id, id));

    // Create notification for product deletion
    try {
      await createNotification(
        req.user?.id,
        "Product Deleted",
        `Product "${product.name}" has been deleted successfully.`
      );
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue with the response even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  upload,
};
