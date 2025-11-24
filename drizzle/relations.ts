import { relations } from "drizzle-orm/relations";
import { users, reviews, products, sales, oauthAccounts, otps, sessions, categories, brands, notifications } from "./schema";

export const reviewsRelations = relations(reviews, ({one}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	sale: one(sales, {
		fields: [reviews.saleId],
		references: [sales.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	reviews: many(reviews),
	oauthAccounts: many(oauthAccounts),
	otps: many(otps),
	sales: many(sales),
	sessions: many(sessions),
	notifications: many(notifications),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	reviews: many(reviews),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	brand: one(brands, {
		fields: [products.brandId],
		references: [brands.id]
	}),
}));

export const salesRelations = relations(sales, ({one, many}) => ({
	reviews: many(reviews),
	user: one(users, {
		fields: [sales.userId],
		references: [users.id]
	}),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({one}) => ({
	user: one(users, {
		fields: [oauthAccounts.userId],
		references: [users.id]
	}),
}));

export const otpsRelations = relations(otps, ({one}) => ({
	user: one(users, {
		fields: [otps.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const brandsRelations = relations(brands, ({many}) => ({
	products: many(products),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));