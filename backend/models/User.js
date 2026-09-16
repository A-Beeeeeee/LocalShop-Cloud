const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String, default: "" },
    flat: { type: String, required: true }, // Flat / House / Building name
    area: { type: String, required: true }, // Area / Sector / Locality
    city: { type: String, default: "Chennai" },
    state: { type: String, default: "Tamil Nadu" },
    pincode: { type: String, default: "600001" },
    addressType: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["customer", "retailer", "admin", "delivery"], required: true },
    shopName: { type: String },
    vehicleType: { type: String, enum: ["Bike", "Scooter", "EV", "Bicycle", "Van"], default: "Bike" },
    vehicleNumber: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
    earnings: { type: Number, default: 0 },
    approved: { type: Boolean, default: function () { return this.role !== "retailer" && this.role !== "delivery"; } },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

