const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: { type: String, default: "General" },
    stock: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Add virtual field for availability status
productSchema.virtual("isOutOfStock").get(function () {
  return this.stock <= 0;
});

productSchema.virtual("availabilityStatus").get(function () {
  return this.stock <= 0 ? "out of stock" : `${this.stock} in stock`;
});

module.exports = mongoose.model("Product", productSchema);
