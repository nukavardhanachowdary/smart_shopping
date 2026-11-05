import Product from "./models/Product.js";

const products = [
  { name: "Wireless Headphones", description: "Comfortable headphones with clear sound.", category: "Electronics", price: 1499, rating: 4.5, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700" },
  { name: "Smart Watch", description: "A simple everyday smart watch.", category: "Electronics", price: 2499, rating: 4.4, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700" },
  { name: "Casual Backpack", description: "A useful backpack for college and travel.", category: "Fashion", price: 999, rating: 4.3, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700" },
  { name: "Running Shoes", description: "Lightweight shoes for everyday use.", category: "Fashion", price: 1899, rating: 4.6, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700" },
  { name: "Desk Lamp", description: "A modern lamp for your study table.", category: "Home", price: 799, rating: 4.2, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700" },
  { name: "Coffee Mug", description: "A reusable ceramic mug.", category: "Home", price: 299, rating: 4.1, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700" }
];

export async function seedProducts() {
  if (await Product.countDocuments() > 0) return;
  await Product.insertMany(products);
  console.log("Sample products added");
}
