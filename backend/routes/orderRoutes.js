const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders  (customer places an order)
// body: { items: [{ productId, qty }], address }
router.post("/", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { items, address, paymentMethod, paymentStatus, paymentId } = req.body;
    if (!items || !items.length || !address) {
      return res.status(400).json({ message: "Items and address are required" });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(404).json({ message: `Product ${it.productId} not found` });
      const qty = Number(it.qty) || 1;
      
      // Check if enough stock is available for the requested quantity
      if (product.stock < qty) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${qty}` 
        });
      }
      
      orderItems.push({
        product: product._id,
        retailer: product.retailer,
        name: product.name,
        price: product.price,
        qty,
      });
      totalAmount += product.price * qty;
    }

    const method = paymentMethod === "razorpay" ? "razorpay" : "cod";
    const status = paymentStatus || (method === "razorpay" ? "paid" : "pending");

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      address,
      paymentMethod: method,
      paymentStatus: status,
      paymentId: paymentId || undefined,
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

    const previousStatus = item.status;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Handle stock adjustments based on status changes
    if (previousStatus !== status) {
      if (status === "fulfilled") {
        // Check if enough stock exists to fulfill
        if (product.stock < item.qty) {
          return res.status(400).json({ 
            message: `Insufficient stock to fulfill. Available: ${product.stock}, Required: ${item.qty}` 
          });
        }
        // Reduce stock when order is fulfilled (confirmed as sold)
        product.stock -= item.qty;
        // Safeguard: never allow negative stock
        if (product.stock < 0) {
          product.stock = 0;
        }
        await product.save();
      } else if (status === "cancelled") {
        // Restore stock when order is cancelled
        if (previousStatus === "fulfilled") {
          // If it was fulfilled, restore the quantity
          product.stock += item.qty;
          await product.save();
        }
        // If it was pending and now cancelled, no change (stock was never reduced)
      }
    }

    item.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
