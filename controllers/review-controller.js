import { db } from "../drizzle/index.js";
import { reviews, sales, products, users } from "../drizzle/schema/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const productReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        isVerified: reviews.isVerified,
        createdAt: reviews.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count
    const [totalCount] = await db
      .select({ count: sql`count(*)` })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    res.json({
      success: true,
      reviews: productReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const userReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        isVerified: reviews.isVerified,
        createdAt: reviews.createdAt,
        productName: products.name,
        productThumbnail: products.thumbnail,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count
    const [totalCount] = await db
      .select({ count: sql`count(*)` })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    res.json({
      success: true,
      reviews: userReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Create a review
export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, saleId, rating, title, comment } = req.body;

    // Validate required fields
    if (!productId || !saleId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID, Sale ID, and rating are required",
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if the sale belongs to the user and is delivered
    const sale = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, saleId), eq(sales.userId, userId)))
      .limit(1);

    if (sale.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sale not found or not authorized",
      });
    }

    if (sale[0].status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Can only review delivered orders",
      });
    }

    // Check if user already reviewed this product from this sale
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.productId, productId),
          eq(reviews.saleId, saleId)
        )
      )
      .limit(1);

    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product from this order",
      });
    }

    // Verify the product is in the sale items
    const saleItems = JSON.parse(sale[0].items);
    const productInSale = saleItems.find((item) => item.id === productId);

    if (!productInSale) {
      return res.status(400).json({
        success: false,
        message: "Product not found in this order",
      });
    }

    // Create the review
    const newReview = await db
      .insert(reviews)
      .values({
        userId,
        productId,
        saleId,
        rating,
        title: title || null,
        comment: comment || null,
        isVerified: true, // Verified purchase
      })
      .returning();

    // Update product rating and review count
    const productReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / productReviews.length;

    await db
      .update(products)
      .set({
        rating: averageRating.toString(),
        numReviews: productReviews.length,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: newReview[0],
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if review exists and belongs to user
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)))
      .limit(1);

    if (existingReview.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    // Update the review
    const updatedReview = await db
      .update(reviews)
      .set({
        rating: rating || existingReview[0].rating,
        title: title !== undefined ? title : existingReview[0].title,
        comment: comment !== undefined ? comment : existingReview[0].comment,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    // Update product rating if rating changed
    if (rating && rating !== existingReview[0].rating) {
      const productReviews = await db
        .select({ rating: reviews.rating })
        .from(reviews)
        .where(eq(reviews.productId, existingReview[0].productId));

      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / productReviews.length;

      await db
        .update(products)
        .set({
          rating: averageRating.toString(),
          updatedAt: new Date(),
        })
        .where(eq(products.id, existingReview[0].productId));
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview[0],
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if review exists and belongs to user
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)))
      .limit(1);

    if (existingReview.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    // Delete the review
    await db.delete(reviews).where(eq(reviews.id, id));

    // Update product rating and review count
    const productReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.productId, existingReview[0].productId));

    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / productReviews.length;

      await db
        .update(products)
        .set({
          rating: averageRating.toString(),
          numReviews: productReviews.length,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existingReview[0].productId));
    } else {
      // No reviews left, reset to default
      await db
        .update(products)
        .set({
          rating: null,
          numReviews: 0,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existingReview[0].productId));
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

// Get reviews that can be written for delivered orders
export const getReviewableOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get delivered orders with items that haven't been reviewed
    const deliveredSales = await db
      .select()
      .from(sales)
      .where(and(eq(sales.userId, userId), eq(sales.status, "delivered")));

    const reviewableItems = [];

    for (const sale of deliveredSales) {
      const items = JSON.parse(sale.items);
      
      for (const item of items) {
        // Check if this product from this sale has been reviewed
        const existingReview = await db
          .select()
          .from(reviews)
          .where(
            and(
              eq(reviews.userId, userId),
              eq(reviews.productId, item.id),
              eq(reviews.saleId, sale.id)
            )
          )
          .limit(1);

        if (existingReview.length === 0) {
          reviewableItems.push({
            saleId: sale.id,
            orderNumber: sale.orderNumber,
            productId: item.id,
            productName: item.name,
            productThumbnail: item.thumbnail,
            deliveredAt: sale.updatedAt,
          });
        }
      }
    }

    res.json({
      success: true,
      reviewableItems,
    });
  } catch (error) {
    console.error("Error fetching reviewable orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviewable orders",
      error: error.message,
    });
  }
};
