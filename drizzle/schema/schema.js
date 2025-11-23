import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const otps = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  brandId: uuid("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price").notNull(),
  discount: boolean("discount"),
  discountPrice: decimal("discount_price"),
  stock: integer("stock"),
  sold: integer("sold").default(0),
  thumbnail: text("thumbnail"), // Single thumbnail image path
  images: text("images"), // JSON array of multiple image paths
  rating: decimal("rating"),
  isNew: boolean("is_new").default(true),
  isBestSeller: boolean("is_best_seller").default(false),
  isTopRated: boolean("is_top_rated").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  isTrending: boolean("is_trending").default(false),
  isHot: boolean("is_hot").default(false),
  isFeatured: boolean("is_featured").default(false),
  numReviews: integer("num_reviews").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  orderNumber: text("order_number").notNull().unique(),
  items: text("items").notNull(), // JSON array of cart items
  subtotal: decimal("subtotal").notNull(),
  tax: decimal("tax").notNull(),
  discount: decimal("discount").default(0),
  total: decimal("total").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cod' or 'gcash'
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'completed'
  shippingAddress: text("shipping_address"), // JSON object with address details
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  provider: text("provider").notNull(), // 'google', 'github', etc.
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  saleId: uuid("sale_id")
    .references(() => sales.id)
    .notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false), // Verified purchase
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
