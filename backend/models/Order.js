import mongoose from "mongoose";

const schema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    image: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", schema);
