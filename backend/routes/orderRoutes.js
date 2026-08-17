const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders  (customer places an order)
// body: { items: [{ productId, qty }], address }
router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { items, address } = req.body;
    if (!items || !items.length || !address) {
      return res.status(400).json({ message: "Items and address are required" });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(404).json({ message: `Product ${it.productId} not found` });
      const qty = Number(it.qty) || 1;
      orderItems.push({
        product: product._id,
        retailer: product.retailer,
        name: product.name,
        price: product.price,
        qty,
      });
      totalAmount += product.price * qty;
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      address,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/orders/mine  (customer order history)
router.get("/mine", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/orders/retailer  (orders containing this retailer's products)
router.get("/retailer", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const orders = await Order.find({ "items.retailer": req.user._id })
      .populate("customer", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/orders/:id/item-status  (retailer updates status of their item in an order)
// body: { productId, status }
router.put("/:id/item-status", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const { productId, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.find(
      (i) => String(i.product) === String(productId) && String(i.retailer) === String(req.user._id)
    );
    if (!item) return res.status(403).json({ message: "Item not found for this retailer" });

    item.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
