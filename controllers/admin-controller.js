import {db} from "../drizzle/index.js";
import {eq, desc, count, sql} from "drizzle-orm";
import {users, products, sales} from "../drizzle/schema/schema.js";

// Users Management
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const usersList = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db.select({count: count()}).from(users);
    const totalPages = Math.ceil(totalCount.count / limit);

    res.status(200).json({
      success: true,
      data: {
        users: usersList,
        totalPages,
        currentPage: page,
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const {name, email, role = "user"} = req.body;

    if (!name || !email) {
      const error = new Error("Name and email are required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      return next(error);
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        role,
        isVerified: true, // Admin created users are auto-verified
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {name, email, role} = req.body;

    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        email,
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const {id} = req.params;

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Products Management
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const productsList = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db.select({count: count()}).from(products);
    const totalPages = Math.ceil(totalCount.count / limit);

    res.status(200).json({
      success: true,
      data: {
        products: productsList,
        totalPages,
        currentPage: page,
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      isActive = true,
    } = req.body;

    if (!name || !description || !price || !category) {
      const error = new Error(
        "Name, description, price, and category are required"
      );
      error.statusCode = 400;
      return next(error);
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock) || 0,
        isActive: Boolean(isActive),
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {name, description, price, category, stock, isActive} = req.body;

    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        isActive: Boolean(isActive),
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
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const {id} = req.params;

    const [deletedProduct] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Orders Management
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    // Build query with user information
    let query = db
      .select({
        id: sales.id,
        orderNumber: sales.orderNumber,
        items: sales.items,
        subtotal: sales.subtotal,
        tax: sales.tax,
        discount: sales.discount,
        total: sales.total,
        paymentMethod: sales.paymentMethod,
        status: sales.status,
        shippingAddress: sales.shippingAddress,
        notes: sales.notes,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(sales)
      .leftJoin(users, eq(sales.userId, users.id))
      .orderBy(desc(sales.createdAt));

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.where(eq(sales.status, status));
    }

    // Get paginated results
    const orders = await query.limit(limit).offset(offset);

    // Get total count for pagination
    let countQuery = db.select({count: count()}).from(sales);
    if (status && status !== "all") {
      countQuery = countQuery.where(eq(sales.status, status));
    }
    const [totalCount] = await countQuery;
    const totalPages = Math.ceil(totalCount.count / limit);

    // Parse JSON fields in orders
    const formattedOrders = orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items),
      shippingAddress: order.shippingAddress
        ? JSON.parse(order.shippingAddress)
        : null,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      discount: parseFloat(order.discount || 0),
      total: parseFloat(order.total),
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        totalPages,
        currentPage: page,
        totalCount: totalCount.count,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {status} = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "completed",
    ];

    if (!validStatuses.includes(status)) {
      const error = new Error("Invalid status");
      error.statusCode = 400;
      return next(error);
    }

    const [updatedSale] = await db
      .update(sales)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id))
      .returning();

    if (!updatedSale) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedSale,
    });
  } catch (error) {
    next(error);
  }
};

export {
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
};
