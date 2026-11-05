# ShopSmart - Smart Shopping Website

Full-stack demo: React + CSS + JavaScript + Node.js + Express + MongoDB.

## Setup
1. Install Node.js and run MongoDB locally, or use MongoDB Atlas.
2. In `backend`, copy `.env.example` to `.env` and set your MongoDB URL.
3. Backend terminal:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
4. Frontend terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open the Vite URL shown in the frontend terminal (usually http://localhost:5173).

Keep both terminals running. Demo checkout does not collect payment. Cart contents are held in React state and clear on browser refresh. Product photos load from remote image URLs.
