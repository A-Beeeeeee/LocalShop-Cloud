const express = require("express");
const Product = require("../models/Product");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/products?search=&category=&locality=&pincode=&retailerId= (public storefront browsing with geofencing)
router.get("/", async (req, res) => {
  try {
    const { search, category, locality, pincode, retailerId } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category && category !== "All") filter.category = category;
    if (retailerId) filter.retailer = retailerId;

    let products = await Product.find(filter)
      .populate("retailer", "name shopName storeLocality storeCity storePincode storeAddress phone addresses")
      .sort({ createdAt: -1 });

    // Hyperlocal Geofence Filtering by Locality (3-5km neighborhood cluster)
    if (locality && locality !== "all" && locality !== "All") {
      products = products.filter((p) => {
        const rLoc = p.retailer?.storeLocality || "Anna Nagar";
        return rLoc.toLowerCase().trim().includes(locality.toLowerCase().trim());
      });
    }

    // Geofence by Pincode
    if (pincode && pincode !== "all") {
      products = products.filter((p) => {
        const rPin = p.retailer?.storePincode || "600040";
        return rPin.trim() === pincode.trim();
      });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/products/stores (public list of verified neighborhood retailers for "Shop by Store")
router.get("/stores", async (req, res) => {
  try {
    const { locality } = req.query;
    const User = require("../models/User");
    
    const filter = { role: "retailer", approved: true };
    if (locality && locality !== "all" && locality !== "All") {
      filter.storeLocality = { $regex: locality, $options: "i" };
    }

    const retailers = await User.find(filter).select("name shopName storeLocality storeCity storePincode storeAddress phone createdAt");
    
    // Get product count for each retailer
    const storesWithCounts = await Promise.all(
      retailers.map(async (ret) => {
        const count = await Product.countDocuments({ retailer: ret._id });
        return {
          _id: ret._id,
          name: ret.name,
          shopName: ret.shopName || ret.name,
          storeLocality: ret.storeLocality || "Anna Nagar",
          storeCity: ret.storeCity || "Chennai",
          storePincode: ret.storePincode || "600040",
          storeAddress: ret.storeAddress || `${ret.shopName || ret.name}, ${ret.storeLocality || "Anna Nagar"}, Chennai`,
          phone: ret.phone,
          productCount: count,
          estimatedDeliveryMin: 20 + Math.floor(Math.random() * 15), // 20-35 min express delivery SLA
          rating: 4.8,
        };
      })
    );

    res.json(storesWithCounts);
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
