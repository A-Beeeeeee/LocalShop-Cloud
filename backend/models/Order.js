const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  status: { type: String, enum: ["pending", "fulfilled", "cancelled"], default: "pending" },
});

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "cod" },
    paymentStatus: { type: String, enum: ["paid", "pending"], default: "pending" },
    paymentId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

