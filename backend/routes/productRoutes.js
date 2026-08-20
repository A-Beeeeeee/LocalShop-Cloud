const express = require("express");
const Product = require("../models/Product");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/products?search=&category=  (public storefront browsing)
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category && category !== "All") filter.category = category;

    const products = await Product.find(filter).populate("retailer", "name shopName").sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/products/mine  (retailer's own products)
router.get("/mine", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const products = await Product.find({ retailer: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/products  (retailer creates product)
router.post("/", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      imageUrl,
      retailer: req.user._id,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/products/:id  (retailer updates own product)
router.put("/:id", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.retailer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your product" });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/products/:id  (retailer deletes own product)
router.delete("/:id", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.retailer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your product" });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH /api/products/:id/stock  (retailer updates product stock)
router.patch("/:id/stock", requireAuth, requireRole("retailer"), async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: "Valid stock quantity required" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.retailer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your product" });
    }
    product.stock = Math.max(0, Number(stock));
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
