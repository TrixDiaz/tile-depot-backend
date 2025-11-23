import {db} from "../drizzle/index.js";
import {sales, products, users} from "../drizzle/schema/schema.js";
import {eq, desc, and, gte, lte, sql, count} from "drizzle-orm";

// Debug endpoint to test database connection
export const testAnalytics = async (req, res) => {
  try {
    console.log("Testing analytics database connection...");

    // Test basic database queries
    const userCount = await db.select({count: count()}).from(users);
    const productCount = await db.select({count: count()}).from(products);
    const salesCount = await db.select({count: count()}).from(sales);

    console.log("Database test results:", {
      users: userCount[0]?.count || 0,
      products: productCount[0]?.count || 0,
      sales: salesCount[0]?.count || 0,
    });

    res.json({
      success: true,
      message: "Analytics database connection working",
      data: {
        users: userCount[0]?.count || 0,
        products: productCount[0]?.count || 0,
        sales: salesCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Analytics database test error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get total users
    let totalUsers = 0;
    try {
      const totalUsersResult = await db.select({count: count()}).from(users);
      totalUsers = totalUsersResult[0]?.count || 0;
    } catch (error) {
      console.log("Error getting user count:", error.message);
    }

    // Get total products
    let totalProducts = 0;
    try {
      const totalProductsResult = await db
        .select({count: count()})
        .from(products);
      totalProducts = totalProductsResult[0]?.count || 0;
    } catch (error) {
      console.log("Error getting product count:", error.message);
    }

    // Get total orders (completed)
    let totalOrders = 0;
    try {
      const totalOrdersResult = await db
        .select({count: count()})
        .from(sales)
        .where(eq(sales.status, "completed"));
      totalOrders = totalOrdersResult[0]?.count || 0;
    } catch (error) {
      console.log("Error getting orders count:", error.message);
    }

    // Get total revenue (completed sales only)
    let totalRevenue = 0;
    try {
      const completedSales = await db
        .select()
        .from(sales)
        .where(eq(sales.status, "completed"));

      totalRevenue = completedSales.reduce(
        (sum, sale) => sum + parseFloat(sale.total || 0),
        0
      );
    } catch (error) {
      console.log("Error getting revenue:", error.message);
    }

    // Calculate growth (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Recent period users
    let recentUsers = 0;
    let previousUsers = 0;
    let userGrowth = 0;

    try {
      const recentUsersResult = await db
        .select({count: count()})
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo));
      recentUsers = recentUsersResult[0]?.count || 0;

      // Previous period users
      const previousUsersResult = await db
        .select({count: count()})
        .from(users)
        .where(
          and(
            gte(users.createdAt, sixtyDaysAgo),
            lte(users.createdAt, thirtyDaysAgo)
          )
        );
      previousUsers = previousUsersResult[0]?.count || 0;

      userGrowth =
        previousUsers > 0
          ? Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
          : 0;
    } catch (error) {
      console.log("Error calculating user growth:", error.message);
    }

    // Recent period revenue
    let recentRevenue = 0;
    let previousRevenue = 0;
    let revenueGrowth = 0;
    let recentOrders = 0;
    let previousOrders = 0;
    let ordersGrowth = 0;

    try {
      const recentSales = await db
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.status, "completed"),
            gte(sales.createdAt, thirtyDaysAgo)
          )
        );

      recentRevenue = recentSales.reduce(
        (sum, sale) => sum + parseFloat(sale.total || 0),
        0
      );

      // Previous period revenue
      const previousSales = await db
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.status, "completed"),
            gte(sales.createdAt, sixtyDaysAgo),
            lte(sales.createdAt, thirtyDaysAgo)
          )
        );

      previousRevenue = previousSales.reduce(
        (sum, sale) => sum + parseFloat(sale.total || 0),
        0
      );

      revenueGrowth =
        previousRevenue > 0
          ? Math.round(
              ((recentRevenue - previousRevenue) / previousRevenue) * 100
            )
          : 0;

      // Recent period orders
      const recentOrdersResult = await db
        .select({count: count()})
        .from(sales)
        .where(
          and(
            eq(sales.status, "completed"),
            gte(sales.createdAt, thirtyDaysAgo)
          )
        );
      recentOrders = recentOrdersResult[0]?.count || 0;

      // Previous period orders
      const previousOrdersResult = await db
        .select({count: count()})
        .from(sales)
        .where(
          and(
            eq(sales.status, "completed"),
            gte(sales.createdAt, sixtyDaysAgo),
            lte(sales.createdAt, thirtyDaysAgo)
          )
        );
      previousOrders = previousOrdersResult[0]?.count || 0;

      ordersGrowth =
        previousOrders > 0
          ? Math.round(((recentOrders - previousOrders) / previousOrders) * 100)
          : 0;
    } catch (error) {
      console.log(
        "Error calculating revenue and orders growth:",
        error.message
      );
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        userGrowth,
        revenueGrowth,
        ordersGrowth,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Get sales analytics for a period
export const getSalesAnalytics = async (req, res) => {
  try {
    const {period = "30d"} = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all sales in the period (completed only)
    const salesData = await db
      .select()
      .from(sales)
      .where(
        and(eq(sales.status, "completed"), gte(sales.createdAt, startDate))
      )
      .orderBy(sales.createdAt);

    // Group by date
    const salesByDate = {};
    salesData.forEach((sale) => {
      const date = new Date(sale.createdAt).toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          revenue: 0,
          orders: 0,
        };
      }
      salesByDate[date].revenue += parseFloat(sale.total || 0);
      salesByDate[date].orders += 1;
    });

    const formattedSalesData = Object.values(salesByDate);

    res.json({
      success: true,
      data: formattedSalesData,
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales analytics",
      error: error.message,
    });
  }
};

// Get product analytics
export const getProductAnalytics = async (req, res) => {
  try {
    // Get top products by sales
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.sold));

    const topProducts = allProducts.slice(0, 10).map((product) => ({
      name: product.name,
      sales: product.sold || 0,
      revenue: (product.sold || 0) * parseFloat(product.price || 0),
    }));

    res.json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product analytics",
      error: error.message,
    });
  }
};

// Get sales by cashier/user
export const getSalesByCashier = async (req, res) => {
  try {
    const {startDate, endDate} = req.query;

    // Default to all time if no dates provided
    let dateFilter = [];
    if (startDate) {
      dateFilter.push(gte(sales.createdAt, new Date(startDate)));
    }
    if (endDate) {
      dateFilter.push(lte(sales.createdAt, new Date(endDate)));
    }

    // Get all completed sales
    const allSales = await db
      .select()
      .from(sales)
      .where(dateFilter.length > 0 ? and(...dateFilter) : undefined)
      .orderBy(desc(sales.createdAt));

    // Group by user
    const salesByUser = {};
    for (const sale of allSales) {
      const userId = sale.userId;
      if (!salesByUser[userId]) {
        // Get user details
        const userDetails = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        salesByUser[userId] = {
          userId,
          userName: userDetails[0]?.name || "Unknown",
          userEmail: userDetails[0]?.email || "Unknown",
          totalSales: 0,
          totalTransactions: 0,
          totalCash: 0,
          totalGCash: 0,
          totalMaya: 0,
          totalCOD: 0,
        };
      }

      const total = parseFloat(sale.total || 0);
      salesByUser[userId].totalSales += total;
      salesByUser[userId].totalTransactions += 1;

      if (sale.paymentMethod === "cash") {
        salesByUser[userId].totalCash += total;
      } else if (sale.paymentMethod === "gcash") {
        salesByUser[userId].totalGCash += total;
      } else if (sale.paymentMethod === "maya") {
        if (!salesByUser[userId].totalMaya) {
          salesByUser[userId].totalMaya = 0;
        }
        salesByUser[userId].totalMaya += total;
      } else if (sale.paymentMethod === "cod") {
        salesByUser[userId].totalCOD += total;
      }
    }

    const cashierSales = Object.values(salesByUser);

    res.json({
      success: true,
      data: cashierSales,
    });
  } catch (error) {
    console.error("Error fetching sales by cashier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales by cashier",
      error: error.message,
    });
  }
};

// Get today's total sales (all users, for admin)
export const getTodayTotalSales = async (req, res) => {
  try {
    // Get start and end of today in UTC
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Get all sales created today
    const todaySales = await db
      .select()
      .from(sales)
      .where(and(gte(sales.createdAt, today), lte(sales.createdAt, tomorrow)))
      .orderBy(desc(sales.createdAt));

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
    console.error("Error fetching today's total sales:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's total sales",
      error: error.message,
    });
  }
};

// Get sales distribution by category
export const getCategoryDistribution = async (req, res) => {
  try {
    const {period = "30d"} = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all sales in the period
    const salesData = await db
      .select()
      .from(sales)
      .where(
        and(eq(sales.status, "completed"), gte(sales.createdAt, startDate))
      );

    // Get all products to map categories
    const allProducts = await db.select().from(products);
    const productMap = {};
    allProducts.forEach((product) => {
      productMap[product.id] = {
        category: product.category || "Uncategorized",
        price: parseFloat(product.price || 0),
      };
    });

    // Calculate revenue by category
    const categoryRevenue = {};
    salesData.forEach((sale) => {
      const items = JSON.parse(sale.items || "[]");
      items.forEach((item) => {
        const product = productMap[item.id];
        if (product) {
          const category = product.category;
          if (!categoryRevenue[category]) {
            categoryRevenue[category] = 0;
          }
          categoryRevenue[category] +=
            parseFloat(item.price) * (item.quantity || 1);
        }
      });
    });

    // Format for pie chart
    const distribution = Object.entries(categoryRevenue).map(
      ([name, value]) => ({
        name,
        value: Math.round(value),
      })
    );

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Error fetching category distribution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category distribution",
      error: error.message,
    });
  }
};

// Get recent activity (orders, users, products)
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent sales
    const recentSales = await db
      .select()
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(limit);

    // Get recent users
    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);

    // Get recently updated products
    const recentProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.updatedAt))
      .limit(limit);

    // Combine and format activities
    const activities = [];

    // Add sales activities
    recentSales.forEach((sale) => {
      const userName = "Customer"; // We'd need to join with users table to get actual name
      activities.push({
        type: "order",
        title: "New order received",
        description: `Order #${sale.orderNumber} - ₱${parseFloat(
          sale.total
        ).toFixed(2)}`,
        timestamp: sale.createdAt,
        status: sale.status,
      });
    });

    // Add user activities
    recentUsers.forEach((user) => {
      activities.push({
        type: "user",
        title: "New user registered",
        description: user.email,
        timestamp: user.createdAt,
        status: user.isVerified ? "verified" : "pending",
      });
    });

    // Add product activities
    recentProducts.forEach((product) => {
      activities.push({
        type: "product",
        title: "Product updated",
        description: product.name,
        timestamp: product.updatedAt,
        status: "active",
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
      error: error.message,
    });
  }
};
