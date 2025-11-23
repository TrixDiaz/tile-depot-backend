import {db} from "./drizzle/index.js";
import {
  products,
  categories,
  brands,
  users,
  notifications,
  sales,
} from "./drizzle/schema/schema.js";

const seedData = async () => {
  try {
    console.log("🌱 Starting seed data generation...");

    // Clear existing data (in order to respect foreign key constraints)
    await db.delete(notifications);
    await db.delete(sales);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(brands);
    await db.delete(users);

    // Insert categories
    const categoryData = [
      {name: "Flooring"},
      {name: "Wall"},
      {name: "Bathroom"},
      {name: "Kitchen"},
      {name: "Outdoor"},
      {name: "Commercial"},
    ];

    const insertedCategories = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Insert brands
    const brandData = [
      {name: "WoodTech"},
      {name: "CeramicPro"},
      {name: "InteriorMax"},
      {name: "LuxuryTiles"},
      {name: "AquaTile"},
      {name: "KitchenPro"},
      {name: "OutdoorMax"},
      {name: "GlassCraft"},
      {name: "StoneCraft"},
      {name: "VinylPro"},
      {name: "ArtTile"},
      {name: "PorcelainMax"},
      {name: "QuartzMax"},
      {name: "ClassicTile"},
      {name: "NaturalStone"},
      {name: "ModernTile"},
      {name: "LuxuryStone"},
      {name: "HandCraft"},
      {name: "MetalCraft"},
      {name: "EcoTile"},
    ];

    const insertedBrands = await db
      .insert(brands)
      .values(brandData)
      .returning();
    console.log(`✅ Inserted ${insertedBrands.length} brands`);

    // Insert admin users
    const adminUserData = [
      {
        email: "nocete13markjoseph@gmail.com",
        name: "Mark Joseph Nocete",
        role: "superadmin",
        isVerified: true,
      },
      {
        email: "john.darlucio022@gmail.com",
        name: "John Darlucio",
        role: "superadmin",
        isVerified: true,
      },
      {
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        isVerified: true,
      },
      {
        email: "superadmin@example.com",
        name: "Super Admin",
        role: "admin",
        isVerified: true,
      },
      {
        email: "manager@example.com",
        name: "Manager",
        role: "admin",
        isVerified: true,
      },
    ];

    const insertedAdmins = await db
      .insert(users)
      .values(adminUserData)
      .returning();
    console.log(`✅ Inserted ${insertedAdmins.length} admin users`);

    // Create mapping objects for categories and brands
    const categoryMap = {};
    const brandMap = {};

    insertedCategories.forEach((cat) => {
      categoryMap[cat.name] = cat.id;
    });

    insertedBrands.forEach((brand) => {
      brandMap[brand.name] = brand.id;
    });

    // Generate comprehensive product data with proper associations
    const productData = [];

    // Helper function to generate random data
    const getRandomElement = (array) =>
      array[Math.floor(Math.random() * array.length)];
    const getRandomPrice = () => (Math.random() * 400 + 50).toFixed(2);
    const getRandomStock = () => Math.floor(Math.random() * 200) + 10;
    const getRandomSold = () => Math.floor(Math.random() * 500) + 10;
    const getRandomRating = () => (Math.random() * 1.5 + 3.5).toFixed(1);
    const getRandomReviews = () => Math.floor(Math.random() * 300) + 10;

    // Product names and descriptions
    const productNames = [
      "Premium Oak Wood Tile",
      "Durable Ceramic Tile",
      "Modern Interior Tile",
      "Luxurious Marble Tile",
      "Water-Resistant Bathroom Tile",
      "Stylish Kitchen Backsplash",
      "Weather-Resistant Outdoor Tile",
      "Elegant Glass Tile",
      "Premium Granite Tile",
      "Durable Vinyl Tile",
      "Artistic Mosaic Tile",
      "High-Quality Porcelain Tile",
      "Engineered Quartz Tile",
      "Classic Subway Tile",
      "Natural Slate Tile",
      "Modern Hexagon Tile",
      "Luxurious Travertine Tile",
      "Handcrafted Cement Tile",
      "Sleek Metal Tile",
      "Eco-Friendly Bamboo Tile",
      "Rustic Stone Tile",
      "Contemporary Marble Tile",
      "Industrial Concrete Tile",
      "Vintage Brick Tile",
      "Modern Terrazzo Tile",
      "Luxury Limestone Tile",
      "Contemporary Wood Tile",
      "Premium Quartz Tile",
      "Artisan Ceramic Tile",
      "Modern Porcelain Tile",
      "Classic Marble Tile",
      "Contemporary Glass Tile",
      "Premium Travertine Tile",
      "Modern Slate Tile",
      "Luxury Granite Tile",
      "Contemporary Limestone Tile",
      "Modern Terrazzo Tile",
      "Premium Concrete Tile",
      "Artisan Wood Tile",
      "Contemporary Ceramic Tile",
      "Modern Marble Tile",
      "Premium Porcelain Tile",
      "Luxury Quartz Tile",
      "Contemporary Travertine Tile",
      "Modern Limestone Tile",
      "Premium Slate Tile",
      "Artisan Glass Tile",
      "Contemporary Granite Tile",
      "Modern Concrete Tile",
      "Premium Wood Tile",
      "Luxury Ceramic Tile",
      "Contemporary Quartz Tile",
      "Modern Travertine Tile",
      "Premium Limestone Tile",
      "Artisan Marble Tile",
      "Contemporary Porcelain Tile",
      "Modern Granite Tile",
      "Premium Glass Tile",
      "Luxury Slate Tile",
      "Contemporary Concrete Tile",
      "Modern Wood Tile",
      "Premium Ceramic Tile",
      "Artisan Quartz Tile",
      "Contemporary Travertine Tile",
      "Modern Limestone Tile",
      "Premium Marble Tile",
      "Luxury Porcelain Tile",
      "Contemporary Granite Tile",
      "Modern Slate Tile",
      "Premium Glass Tile",
      "Artisan Concrete Tile",
      "Contemporary Wood Tile",
      "Modern Ceramic Tile",
      "Premium Quartz Tile",
      "Luxury Travertine Tile",
      "Contemporary Limestone Tile",
      "Modern Marble Tile",
      "Premium Porcelain Tile",
      "Artisan Granite Tile",
      "Contemporary Slate Tile",
      "Modern Glass Tile",
      "Premium Concrete Tile",
      "Luxury Wood Tile",
      "Contemporary Ceramic Tile",
      "Modern Quartz Tile",
      "Premium Travertine Tile",
      "Artisan Limestone Tile",
      "Contemporary Marble Tile",
      "Modern Porcelain Tile",
      "Premium Granite Tile",
      "Luxury Slate Tile",
      "Contemporary Glass Tile",
      "Modern Concrete Tile",
      "Premium Wood Tile",
      "Artisan Ceramic Tile",
      "Contemporary Quartz Tile",
      "Modern Travertine Tile",
      "Premium Limestone Tile",
      "Luxury Marble Tile",
      "Contemporary Porcelain Tile",
      "Modern Granite Tile",
      "Premium Slate Tile",
      "Artisan Glass Tile",
      "Contemporary Concrete Tile",
      "Modern Wood Tile",
      "Premium Ceramic Tile",
      "Luxury Quartz Tile",
    ];

    const descriptions = [
      "High-quality tile with natural patterns and textures. Perfect for modern interior design.",
      "Durable tile designed for high-traffic areas. Easy to clean and maintain.",
      "Contemporary tile with sleek design for modern spaces. Perfect for accent walls.",
      "Luxurious tile with premium materials and elegant finish. Perfect for high-end projects.",
      "Water-resistant tile specifically designed for wet areas. Mold and mildew resistant.",
      "Stylish tile perfect for kitchen and bathroom applications. Heat and stain resistant.",
      "Weather-resistant tile perfect for outdoor spaces. UV resistant and slip-resistant.",
      "Elegant tile with reflective surface for contemporary design. Modern and sophisticated.",
      "Premium tile with natural stone patterns. Durable and elegant with unique characteristics.",
      "Durable tile perfect for high-traffic areas. Easy to install and maintain.",
      "Artistic tile with unique patterns and handcrafted details. Perfect for decorative applications.",
      "High-quality tile with excellent durability. Perfect for commercial and residential use.",
      "Engineered tile with superior durability and stain resistance. Low maintenance required.",
      "Classic tile with timeless design. Perfect for traditional and contemporary spaces.",
      "Natural tile with unique texture and color variations. Each piece is unique.",
      "Modern tile with geometric patterns. Perfect for contemporary interior design.",
      "Luxurious tile with natural stone beauty. Perfect for high-end residential projects.",
      "Handcrafted tile with traditional techniques. Artisan-made with unique patterns.",
      "Sleek tile for modern industrial design. Durable and contemporary with metal finish.",
      "Eco-friendly tile for sustainable design. Renewable and environmentally conscious.",
      "Rustic tile with natural stone appearance. Perfect for traditional and country-style spaces.",
      "Contemporary tile with modern design elements. Perfect for contemporary interior design.",
      "Industrial tile with concrete-like appearance. Perfect for modern and industrial spaces.",
      "Vintage tile with brick-like appearance. Perfect for traditional and rustic spaces.",
      "Modern tile with terrazzo-like appearance. Perfect for contemporary and modern spaces.",
      "Luxury tile with limestone appearance. Perfect for high-end residential projects.",
      "Contemporary tile with wood-like appearance. Perfect for modern and contemporary spaces.",
      "Premium tile with quartz-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with handcrafted details. Perfect for decorative and artistic applications.",
      "Modern tile with porcelain-like appearance. Perfect for contemporary and modern spaces.",
      "Classic tile with marble-like appearance. Perfect for traditional and contemporary spaces.",
      "Contemporary tile with glass-like appearance. Perfect for modern and contemporary spaces.",
      "Premium tile with travertine-like appearance. Perfect for high-end residential projects.",
      "Modern tile with slate-like appearance. Perfect for contemporary and modern spaces.",
      "Luxury tile with granite-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with limestone-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with terrazzo-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with concrete-like appearance. Perfect for modern and industrial spaces.",
      "Artisan tile with wood-like appearance. Perfect for traditional and contemporary spaces.",
      "Contemporary tile with ceramic-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with marble-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with porcelain-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with quartz-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with travertine-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with limestone-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with slate-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with glass-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with granite-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with concrete-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with wood-like appearance. Perfect for traditional and contemporary spaces.",
      "Luxury tile with ceramic-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with quartz-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with travertine-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with limestone-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with marble-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with porcelain-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with granite-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with glass-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with slate-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with concrete-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with wood-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with ceramic-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with quartz-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with travertine-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with limestone-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with marble-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with porcelain-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with granite-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with slate-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with glass-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with concrete-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with wood-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with ceramic-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with quartz-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with travertine-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with limestone-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with marble-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with porcelain-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with granite-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with slate-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with glass-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with concrete-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with wood-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with ceramic-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with quartz-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with travertine-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with limestone-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with marble-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with porcelain-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with granite-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with slate-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with glass-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with concrete-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with wood-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with ceramic-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with quartz-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with travertine-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with limestone-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with marble-like appearance. Perfect for high-end residential projects.",
      "Contemporary tile with porcelain-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with granite-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with slate-like appearance. Perfect for modern and contemporary spaces.",
      "Artisan tile with glass-like appearance. Perfect for decorative and artistic applications.",
      "Contemporary tile with concrete-like appearance. Perfect for modern and contemporary spaces.",
      "Modern tile with wood-like appearance. Perfect for contemporary and modern spaces.",
      "Premium tile with ceramic-like appearance. Perfect for modern and contemporary spaces.",
      "Luxury tile with quartz-like appearance. Perfect for high-end residential projects.",
    ];

    // Generate 100 products with proper associations
    for (let i = 0; i < 100; i++) {
      const category = getRandomElement(insertedCategories);
      const brand = getRandomElement(insertedBrands);
      const name = productNames[i % productNames.length];
      const description = descriptions[i % descriptions.length];
      const price = getRandomPrice();
      const hasDiscount = Math.random() > 0.7; // 30% chance of discount
      const discountPrice = hasDiscount
        ? (parseFloat(price) * 0.8).toFixed(2)
        : null;
      const stock = getRandomStock();
      const sold = getRandomSold();
      const rating = getRandomRating();
      const numReviews = getRandomReviews();

      // Random flags
      const isNew = Math.random() > 0.8;
      const isBestSeller = Math.random() > 0.9;
      const isTopRated = Math.random() > 0.85;
      const isOnSale = hasDiscount;
      const isTrending = Math.random() > 0.8;
      const isHot = Math.random() > 0.9;
      const isFeatured = Math.random() > 0.85;

      productData.push({
        categoryId: category.id,
        brandId: brand.id,
        name: name,
        description: description,
        price: price,
        discount: hasDiscount,
        discountPrice: discountPrice,
        stock: stock,
        sold: sold,
        thumbnail: "/images/wood-tile.jpg",
        images: JSON.stringify([
          "/images/wood-tile.jpg",
          "/images/white-tile.jpg",
          "/images/interior-tile.jpg",
        ]),
        rating: rating,
        isNew: isNew,
        isBestSeller: isBestSeller,
        isTopRated: isTopRated,
        isOnSale: isOnSale,
        isTrending: isTrending,
        isHot: isHot,
        isFeatured: isFeatured,
        numReviews: numReviews,
      });
    }

    const insertedProducts = await db
      .insert(products)
      .values(productData)
      .returning();
    console.log(`✅ Inserted ${insertedProducts.length} products`);

    console.log("🎉 Seed data generation completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${insertedCategories.length}`);
    console.log(`   - Brands: ${insertedBrands.length}`);
    console.log(`   - Admin Users: ${insertedAdmins.length}`);
    console.log(`   - Products: ${insertedProducts.length}`);
    console.log(`\n🔐 Admin Login Credentials:`);
    console.log(`   - nocete13markjoseph@gmail.com (Mark Joseph Nocete - Superadmin)`);
    console.log(`   - john.darlucio022@gmail.com (John Darlucio - Superadmin)`);
    console.log(`   - admin@example.com (Admin User)`);
    console.log(`   - superadmin@example.com (Super Admin)`);
    console.log(`   - manager@example.com (Manager)`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
};

// Run the seed function
seedData()
  .then(() => {
    console.log("✅ Database seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  });
