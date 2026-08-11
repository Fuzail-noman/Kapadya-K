const express = require("express");
const mongoose = require("mongoose");
const streamifier = require("streamifier");
const Order = require("../models/Order");
const User = require("../models/User");
const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");
const upload = require("../middleware/upload");
const cloudinary = require("../config/Cloudinary");
 
const router = express.Router();
 
const DELIVERY_FEE_PAKISTAN_PKR = 4000;
const DELIVERY_FEE_INTERNATIONAL_PKR = 11000;
 
// Helper: multer memoryStorage se milne wale buffer ko Cloudinary
// upload_stream ke zariye upload karta hai, koi disk write nahi hoti.
function uploadBufferToCloudinary(buffer, folder = "receipts") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
 
// ================= CREATE ORDER =================
// Frontend (CheckoutPage) FormData mein bhejta hai:
// name, phone, country, city, items (JSON string), subtotalPKR, receipt (file)
router.post("/", verifyUser, upload.single("receipt"), async (req, res) => {
  try {
    const { name, phone, country, city, items, subtotalPKR } = req.body;
 
    if (!name || !phone || !country || !city || !items || !subtotalPKR) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
 
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }
 
    let parsedItems;
    try {
      parsedItems = JSON.parse(items);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid items data",
      });
    }
 
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }
 
    const subtotal = Number(subtotalPKR);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subtotal",
      });
    }
 
    // Delivery fee frontend jaisi hi logic se server pe dobara calculate
    // ki jaati hai — client se bheja hua total kabhi trust nahi karte.
    const isPakistan = country.trim().toLowerCase() === "pakistan";
    const deliveryFeePKR = isPakistan
      ? DELIVERY_FEE_PAKISTAN_PKR
      : DELIVERY_FEE_INTERNATIONAL_PKR;
    const totalPKR = subtotal + deliveryFeePKR;
 
    // Receipt screenshot ko Cloudinary par upload karo
    const uploadResult = await uploadBufferToCloudinary(
      req.file.buffer,
      "receipts"
    );
 
    const order = await Order.create({
      user: req.user.id,
      items: parsedItems,
      shipping: { name, phone, country, city },
      subtotalPKR: subtotal,
      deliveryFeePKR,
      totalPKR,
      advancePayment: {
        amountPKR: totalPKR, // yahan full payment hi collect ho rahi hai
        receiptImage: uploadResult.secure_url,
      },
    });
 
    res.json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
});
 
// ================= GET MY ORDERS =================
router.get("/mine", verifyUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
 
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ================= ADMIN: GET ALL ORDERS =================
router.get("/", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });
 
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ================= GET SINGLE ORDER (owner or admin) =================
router.get("/:id", verifyUser, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id" });
    }
 
    const order = await Order.findById(req.params.id);
 
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
 
    const requester = await User.findById(req.user.id);
    const isOwner = order.user.toString() === req.user.id;
 
    if (!isOwner && !(requester && requester.isAdmin)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
 
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// ================= ADMIN: UPDATE ORDER STATUS =================
router.patch("/:id/status", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
 
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
 
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
 
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
 
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;