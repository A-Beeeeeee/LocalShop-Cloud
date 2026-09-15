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
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      totalAmount,
      address,
      paymentMethod: method,
      paymentStatus: status,
      paymentId: paymentId || undefined,
      deliveryOtp,
      estimatedDeliveryMinutes: 30,
      courierPartner: "LocalShop HyperExpress",
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

    // Filter items array on each order so the retailer only receives their own items
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = (orderObj.items || []).filter(
        (i) => String(i.retailer) === String(req.user._id)
      );
      return orderObj;
    });

    res.json(filteredOrders);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/orders/:id/cancel  (customer cancels order)
// body: { productId (optional), reason (optional) }
router.put("/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { productId, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (String(order.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }

    let itemsToCancel = order.items;
    if (productId) {
      itemsToCancel = order.items.filter(
        (i) => String(i.product) === String(productId) || String(i._id) === String(productId)
      );
    }

    if (itemsToCancel.length === 0) {
      return res.status(400).json({ message: "No matching items found to cancel" });
    }

    let totalCancelledAmount = 0;

    for (const item of itemsToCancel) {
      if (item.status === "cancelled" || item.status === "refunded") {
        continue;
      }
      
      // If item was previously fulfilled, restore the inventory
      if (item.status === "fulfilled" || item.status === "return_requested") {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.qty;
          await product.save();
        }
      }

      item.status = "cancelled";
      totalCancelledAmount += item.price * item.qty;
    }

    if (reason) {
      order.cancellationReason = reason;
    }

    // If paid via Razorpay, record refund simulation
    if (order.paymentMethod === "razorpay") {
      order.refundStatus = "processed";
      order.refundAmount = (order.refundAmount || 0) + totalCancelledAmount;
    }

    await order.save();
    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/orders/:id/return-request  (customer requests return on fulfilled item)
// body: { productId, reason }
router.put("/:id/return-request", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { productId, reason } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (String(order.customer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }

    const item = order.items.find(
      (i) => String(i.product) === String(productId) || String(i._id) === String(productId)
    );
    if (!item) return res.status(404).json({ message: "Item not found in this order" });

    if (item.status !== "fulfilled") {
      return res.status(400).json({ 
        message: `Cannot request return for item with status "${item.status}". Only fulfilled items can be returned.` 
      });
    }

    item.status = "return_requested";
    item.returnReason = reason || "Customer requested return";
    order.refundStatus = "pending";

    await order.save();
    res.json({ message: "Return request submitted successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/orders/:id/item-status  (retailer updates status of their item in an order)
// body: { productId, status }
router.put("/:id/item-status", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const { productId, status } = req.body;
    if (!productId || !status) {
      return res.status(400).json({ message: "productId and status are required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Match item by product ID or item _id, AND retailer ID
    const item = order.items.find(
      (i) =>
        (String(i.product) === String(productId) || String(i._id) === String(productId)) &&
        String(i.retailer) === String(req.user._id)
    );
    if (!item) return res.status(403).json({ message: "Item not found for this retailer" });

    const previousStatus = item.status;
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Handle stock adjustments and refunds based on status changes
    if (previousStatus !== status) {
      if (status === "fulfilled") {
        if (previousStatus === "pending") {
          // Reduce stock when transitioning from pending to fulfilled
          if (product.stock < item.qty) {
            return res.status(400).json({ 
              message: `Insufficient stock to fulfill. Available: ${product.stock}, Required: ${item.qty}` 
            });
          }
          product.stock -= item.qty;
          if (product.stock < 0) product.stock = 0;
          await product.save();
        }
      } else if (status === "cancelled") {
        // Retailer declines pending order
        if (previousStatus === "fulfilled" || previousStatus === "return_requested") {
          product.stock += item.qty;
          await product.save();
        }
        if (order.paymentMethod === "razorpay") {
          order.refundStatus = "processed";
          order.refundAmount = (order.refundAmount || 0) + (item.price * item.qty);
        }
      } else if (status === "refunded") {
        // Retailer approves customer return request
        product.stock += item.qty;
        await product.save();

        order.refundStatus = "processed";
        order.refundAmount = (order.refundAmount || 0) + (item.price * item.qty);
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

