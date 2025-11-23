import {db, pool} from "../drizzle/index.js";
import {sales, products} from "../drizzle/schema/schema.js";
import {eq, desc, and, gte, lte, sql} from "drizzle-orm";
import {createNotification} from "./notification-controller.js";

// Create a new sale/order
export const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      items,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      shippingAddress,
      notes,
      promoCode,
    } = req.body;
    const userId = req.user.id;

    // Validate that user exists and is valid
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log("Creating sale for user ID:", userId);

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Items are required and must be a non-empty array");
    }

    if (
      !paymentMethod ||
      !["cash", "cod", "gcash", "maya"].includes(paymentMethod)
    ) {
      throw new Error(
        "Valid payment method is required (cash, cod, gcash, or maya)"
      );
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Determine status based on payment method
    // POS transactions (cash, gcash, maya) are immediately completed
    // COD orders remain pending until delivery
    const orderStatus = paymentMethod === "cod" ? "pending" : "completed";

    // Create notes with promo code if applied
    let orderNotes = notes || "";
    if (promoCode) {
      orderNotes = orderNotes
        ? `${orderNotes} | Promo Code: ${promoCode}`
        : `Promo Code: ${promoCode}`;
    }

    // Create the sale record
    const newSale = await db
      .insert(sales)
      .values({
        userId,
        orderNumber,
        items: JSON.stringify(items),
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        discount: discount.toString(),
        total: total.toString(),
        paymentMethod,
        shippingAddress: shippingAddress
          ? JSON.stringify(shippingAddress)
          : null,
        notes: orderNotes,
        status: orderStatus,
      })
      .returning();

    // Update product stock and sold quantities
    for (const item of items) {
      // Get current product data first
      const currentProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, item.id))
        .limit(1);

      if (currentProduct.length === 0) {
        throw new Error(`Product with ID ${item.id} not found`);
      }

      const product = currentProduct[0];

      // Strict stock validation - prevent 0 or negative stock
      if (
        product.stock === null ||
        product.stock === undefined ||
        product.stock <= 0
      ) {
        throw new Error(
          `Product "${product.name}" is out of stock. Cannot process transaction.`
        );
      }

      const newStock = product.stock - item.quantity;
      const newSold = (product.sold || 0) + item.quantity;

      // Check if requested quantity exceeds available stock
      if (newStock < 0) {
        throw new Error(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      // Additional validation: warn if this will deplete stock
      if (newStock === 0) {
        console.log(
          `Warning: Product "${product.name}" will be out of stock after this transaction`
        );
      }

      await db
        .update(products)
        .set({
          stock: newStock,
          sold: newSold,
        })
        .where(eq(products.id, item.id));
    }

    await client.query("COMMIT");

    // Create notification for new order
    await createNotification(
      userId,
      "Order Placed Successfully",
      `Your order #${orderNumber} has been placed and is being processed.`
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: newSale[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating sale:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Get all sales for a user
export const getUserSales = async (req, res) => {
  try {
    const userId = req.user.id;
    const {page = 1, limit = 10, status} = req.query;

    // Handle case where user might not have any sales yet
    let userSales = [];
    try {
      let query = db.select().from(sales).where(eq(sales.userId, userId));

      if (status) {
        query = query.where(eq(sales.status, status));
      }

      userSales = await query
        .orderBy(desc(sales.createdAt))
        .limit(parseInt(limit))
        .offset((parseInt(page) - 1) * parseInt(limit));
    } catch (dbError) {
      console.log(
        "No sales found for user, returning empty array:",
        dbError.message
      );
      userSales = [];
    }

    // Parse JSON fields
    const formattedSales = userSales.map((sale) => ({
      ...sale,
      items: JSON.parse(sale.items),
      shippingAddress: sale.shippingAddress
        ? JSON.parse(sale.shippingAddress)
        : null,
    }));

    res.json({
      success: true,
      sales: formattedSales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: userSales.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user sales:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get a specific sale by ID
export const getSaleById = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;

    const sale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id) && eq(sales.userId, userId))
      .limit(1);

    if (sale.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const formattedSale = {
      ...sale[0],
      items: JSON.parse(sale[0].items),
      shippingAddress: sale[0].shippingAddress
        ? JSON.parse(sale[0].shippingAddress)
        : null,
    };

    res.json({
      success: true,
      sale: formattedSale,
    });
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Update sale status (for admin use)
export const updateSaleStatus = async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Get the sale first to get the userId
    const existingSale = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1);

    if (existingSale.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatedSale = await db
      .update(sales)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id))
      .returning();

    // Create notification for status change
    const statusMessages = {
      pending: "Your order is being processed",
      confirmed: "Your order has been confirmed and is being prepared",
      shipped: "Your order has been shipped and is on its way",
      delivered: "Your order has been delivered successfully",
      cancelled: "Your order has been cancelled",
      completed: "Your order has been completed successfully",
    };

    const notificationTitle = `Order Status Update - ${
      status.charAt(0).toUpperCase() + status.slice(1)
    }`;
    const notificationMessage = `Order #${existingSale[0].orderNumber}: ${
      statusMessages[status] || `Status changed to ${status}`
    }`;

    await createNotification(
      existingSale[0].userId,
      notificationTitle,
      notificationMessage
    );

    res.json({
      success: true,
      message: "Order status updated successfully",
      sale: updatedSale[0],
    });
  } catch (error) {
    console.error("Error updating sale status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Cancel a sale (user can cancel pending orders)
export const cancelSale = async (req, res) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;

    const sale = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.userId, userId)))
      .limit(1);

    if (sale.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (sale[0].status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    const updatedSale = await db
      .update(sales)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id))
      .returning();

    // Restore product stock
    const items = JSON.parse(sale[0].items);
    for (const item of items) {
      await db
        .update(products)
        .set({
          stock: item.stock + item.quantity,
          sold: item.sold - item.quantity,
        })
        .where(eq(products.id, item.id));
    }

    // Create notification for order cancellation
    const notificationTitle = "Order Cancelled";
    const notificationMessage = `Order #${sale[0].orderNumber} has been cancelled successfully. Any payments made will be refunded according to our refund policy.`;

    await createNotification(userId, notificationTitle, notificationMessage);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      sale: updatedSale[0],
    });
  } catch (error) {
    console.error("Error cancelling sale:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// Get today's sales for the authenticated user (cashier)
export const getTodaySales = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get start of today and current time
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Get all sales created by this user today (from start of today until now)
    // Handle case where user might not have any sales yet
    let todaySales = [];
    try {
      todaySales = await db
        .select()
        .from(sales)
        .where(and(eq(sales.userId, userId), gte(sales.createdAt, today)))
        .orderBy(desc(sales.createdAt));
    } catch (dbError) {
      console.log(
        "No sales found for user, returning empty array:",
        dbError.message
      );
      todaySales = [];
    }

    // Parse JSON fields and calculate totals
    const formattedSales = todaySales.map((sale) => ({
      ...sale,
      items: JSON.parse(sale.items),
      shippingAddress: sale.shippingAddress
        ? JSON.parse(sale.shippingAddress)
        : null,
      subtotal: parseFloat(sale.subtotal),
      tax: parseFloat(sale.tax),
      discount: parseFloat(sale.discount || 0),
      total: parseFloat(sale.total),
    }));

    // Calculate totals by payment method
    const totalCash = formattedSales
      .filter((sale) => sale.paymentMethod === "cash")
      .reduce((sum, sale) => sum + sale.total, 0);

    const totalGCash = formattedSales
      .filter((sale) => sale.paymentMethod === "gcash")
      .reduce((sum, sale) => sum + sale.total, 0);

    const totalMaya = formattedSales
      .filter((sale) => sale.paymentMethod === "maya")
      .reduce((sum, sale) => sum + sale.total, 0);

    const totalCOD = formattedSales
      .filter((sale) => sale.paymentMethod === "cod")
      .reduce((sum, sale) => sum + sale.total, 0);

    const totalSales = formattedSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const totalTransactions = formattedSales.length;

    res.json({
      success: true,
      data: {
        sales: formattedSales,
        summary: {
          totalTransactions,
          totalSales,
          totalCash,
          totalGCash,
          totalMaya,
          totalCOD,
        },
        date: today.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching today's sales:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's sales",
      error: error.message,
    });
  }
};
