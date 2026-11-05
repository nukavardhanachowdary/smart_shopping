import mongoose from "mongoose";
const schema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    image: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true }
}, { timestamps: true });
export default mongoose.model("Order", schema);
