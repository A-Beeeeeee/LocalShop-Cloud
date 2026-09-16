const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/retailer  (stats for the logged-in retailer)
router.get("/retailer", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ retailer: req.user._id });
    const lowStockCount = await Product.countDocuments({ retailer: req.user._id, stock: { $lt: 5 } });

    const orders = await Order.find({ "items.retailer": req.user._id });
    let orderCount = 0;
    let salesTotal = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (String(item.retailer) === String(req.user._id)) {
          orderCount += 1;
          // Only calculate revenue for fulfilled items
          if (item.status === "fulfilled") {
            salesTotal += item.price * item.qty;
          }
        }
      });
    });

    res.json({ productCount, lowStockCount, orderCount, salesTotal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/dashboard/delivery (stats for logged-in delivery partner)
router.get("/delivery", requireAuth, requireRole("delivery"), async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);

    const activeTasksCount = await Order.countDocuments({
      deliveryPartner: req.user._id,
      deliveryStatus: { $in: ["assigned", "picked_up", "out_for_delivery"] }
    });

    const completedDeliveriesCount = await Order.countDocuments({
      deliveryPartner: req.user._id,
      deliveryStatus: "delivered"
    });

    const availablePoolCount = await Order.countDocuments({
      deliveryStatus: "unassigned",
      "items.status": { $ne: "cancelled" }
    });

    res.json({
      activeTasksCount,
      completedDeliveriesCount,
      availablePoolCount,
      earnings: user?.earnings || 0,
      isAvailable: user?.isAvailable ?? true,
      vehicleType: user?.vehicleType || "Bike",
      vehicleNumber: user?.vehicleNumber || "",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
