const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

// GET /api/admin/retailers?status=pending|approved|all
router.get("/retailers", async (req, res) => {
  try {
    const { status = "all" } = req.query;
    const filter = { role: "retailer" };
    if (status === "pending") filter.approved = false;
    if (status === "approved") filter.approved = true;
    const retailers = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(retailers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/admin/retailers/:id/approve
router.put("/retailers/:id/approve", async (req, res) => {
  try {
    const retailer = await User.findOneAndUpdate(
      { _id: req.params.id, role: "retailer" },
      { approved: true },
      { new: true }
    ).select("-password");
    if (!retailer) return res.status(404).json({ message: "Retailer not found" });
    res.json(retailer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/admin/retailers/:id  (reject / remove retailer)
router.delete("/retailers/:id", async (req, res) => {
  try {
    const retailer = await User.findOneAndDelete({ _id: req.params.id, role: "retailer" });
    if (!retailer) return res.status(404).json({ message: "Retailer not found" });
    res.json({ message: "Retailer removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/admin/stats  (platform-wide analytics)
router.get("/stats", async (req, res) => {
  try {
    const [retailerCount, customerCount, productCount, orderCount] = await Promise.all([
      User.countDocuments({ role: "retailer", approved: true }),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);
    res.json({ retailerCount, customerCount, productCount, orderCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
