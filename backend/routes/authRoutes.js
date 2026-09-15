const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, shopName, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    if (!["customer", "retailer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role,
      phone: phone ? phone.trim() : "",
      shopName: role === "retailer" ? shopName : undefined,
    });

    res.status(201).json({
      message: role === "retailer" ? "Registered. Awaiting admin approval." : "Registered successfully.",
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        phone: user.phone,
        approved: user.approved,
        addresses: user.addresses || []
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    if (user.role === "retailer" && !user.approved) {
      return res.status(403).json({ message: "Your retailer account is pending admin approval" });
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        shopName: user.shopName,
        approved: user.approved,
        addresses: user.addresses || [],
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/auth/profile (current user profile)
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/auth/profile (update user phone / name)
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      shopName: user.shopName,
      approved: user.approved,
      addresses: user.addresses || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/auth/addresses (get customer's saved delivery addresses)
router.get("/addresses", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.addresses || []);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/addresses (add new delivery address)
router.post("/addresses", requireAuth, async (req, res) => {
  try {
    const { fullName, phone, altPhone, flat, area, city, state, pincode, addressType, isDefault } = req.body;
    if (!fullName || !phone || !flat || !area) {
      return res.status(400).json({ message: "Full name, phone, flat/building, and area/locality are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.addresses) user.addresses = [];

    const makeDefault = isDefault || user.addresses.length === 0;

    if (makeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddr = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      altPhone: altPhone ? altPhone.trim() : "",
      flat: flat.trim(),
      area: area.trim(),
      city: city ? city.trim() : "Chennai",
      state: state ? state.trim() : "Tamil Nadu",
      pincode: pincode ? pincode.trim() : "600001",
      addressType: ["Home", "Work", "Other"].includes(addressType) ? addressType : "Home",
      isDefault: makeDefault,
    };

    user.addresses.push(newAddr);

    // Also update user's primary phone if user didn't have one
    if (!user.phone && phone) {
      user.phone = phone.trim();
    }

    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/auth/addresses/:addressId (remove saved address)
router.delete("/addresses/:addressId", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses = (user.addresses || []).filter(
      (addr) => String(addr._id) !== String(req.params.addressId)
    );

    // If default was deleted and addresses remain, make first one default
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/auth/addresses/:addressId/default (set address as default)
router.put("/addresses/:addressId/default", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses = (user.addresses || []).map((addr) => {
      addr.isDefault = String(addr._id) === String(req.params.addressId);
      return addr;
    });

    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

