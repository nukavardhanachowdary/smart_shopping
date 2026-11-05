import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import { seedProducts } from "./seed.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ message: "ShopSmart backend is running" }));

app.get("/api/products", async (req, res) => {
  try {
    const { search = "", category = "All" } = req.query;
    const filter = {};
    if (search.trim()) filter.name = { $regex: search.trim(), $options: "i" };
    if (category && category !== "All") filter.category = category;
    res.json(await Product.find(filter).sort({ createdAt: -1 }));
  } catch {
    res.status(500).json({ error: "Could not load products" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, email, items } = req.body;
    if (!customerName?.trim() || !email?.trim() || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Enter your name, email, and add products to cart." });
    }
    const orderItems = [];
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: "A cart product or quantity is invalid." });
      }
      orderItems.push({ productId: product._id, name: product.name, image: product.image, price: product.price, quantity });
      totalAmount += product.price * quantity;
    }
    const order = await Order.create({ customerName: customerName.trim(), email: email.trim(), items: orderItems, totalAmount });
    res.status(201).json({ message: "Demo order placed", orderId: order._id, totalAmount });
  } catch {
    res.status(500).json({ error: "Could not place order" });
  }
});

async function start() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing. Create backend/.env using backend/.env.example.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    await seedProducts();
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    process.exit(1);
  }
}
start();
