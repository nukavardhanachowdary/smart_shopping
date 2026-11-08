# ShopSmart — Smart Shopping Website

A full-stack e-commerce demo built with **React + Node.js + Express + MongoDB**.

## ✨ Features

- 🛒 **Product catalog** with search, category filter & sort (price / rating)
- 💖 **Wishlist** — save products for later (persists across page refresh)
- 🛍️ **Shopping cart** with quantity controls (persists across page refresh)
- 📦 **Demo checkout** — place orders with name & email
- 📋 **Order history** — look up all past orders by email after checkout
- ⭐ **Star ratings** UI on every product card
- 📱 **Responsive design** for mobile and desktop

## 🚀 Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (local) **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster

### 1. Backend

```bash
cd backend
npm install
```

Copy the example env file and add your MongoDB connection string:

```bash
cp .env.example .env
# Edit .env and set:  MONGO_URI=mongodb://localhost:27017/shopsmart
```

Start the backend:

```bash
npm run dev
```

The backend runs on **http://localhost:5000**. Sample products are seeded automatically on first run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually **http://localhost:5173**).

> Keep **both terminals** running at the same time.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products?search=&category=` | List / search products |
| POST | `/api/orders` | Place a demo order |
| GET | `/api/orders?email=` | Get order history by email |

## 📁 Project Structure

```
ShopSmart_Complete/
├── backend/
│   ├── models/
│   │   ├── Product.js
│   │   └── Order.js
│   ├── server.js
│   ├── seed.js
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx
        └── App.css
```

## ⚠️ Notes

- Demo only — **no real payment** is collected
- Cart and wishlist persist via `localStorage`
- Product images load from Unsplash (requires internet)
