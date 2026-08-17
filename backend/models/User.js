const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["customer", "retailer", "admin"], required: true },
    shopName: { type: String },
    approved: { type: Boolean, default: function () { return this.role !== "retailer"; } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
