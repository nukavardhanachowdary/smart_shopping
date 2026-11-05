import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  image: { type: String, required: true }
}, { timestamps: true });
export default mongoose.model("Product", schema);
