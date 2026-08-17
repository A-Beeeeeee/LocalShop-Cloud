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
          salesTotal += item.price * item.qty;
        }
      });
    });

    res.json({ productCount, lowStockCount, orderCount, salesTotal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
