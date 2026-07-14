const express = require("express");
const Order = require("../models/Order");
const upload = require("../middleware/upload");
 
const router = express.Router();
 
// Same rule as CartPage.jsx — Pakistan users pay a flat local fee,
// everyone else pays the international fee. Calculated here (not trusted
// from the client) so the DB value can never be tampered with or wrong.
const DELIVERY_FEE_PAKISTAN_PKR = 4000;
const DELIVERY_FEE_INTERNATIONAL_PKR = 11000;
 
function getDeliveryFee(country) {
  const isPakistan = (country || "").trim().toLowerCase() === "pakistan";
  return isPakistan ? DELIVERY_FEE_PAKISTAN_PKR : DELIVERY_FEE_INTERNATIONAL_PKR;
}
 
/**
 * POST /api/orders
 * CheckoutPage se order place karne ke liye.
 * multipart/form-data: userId, name, phone, country, city, items (JSON string), receipt (file)
 * (area ab frontend se nahi aati — CheckoutPage se hata di gayi thi)
 */
router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    const { userId, name, phone, country, city, items, subtotalPKR } = req.body;
 
    if (!userId) {
      return res.status(401).json({ message: "Login required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Payment screenshot required" });
    }
    if (!country) {
      return res.status(400).json({ message: "Country is required" });
    }
 
    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    const parsedSubtotal = Number(subtotalPKR);
 
    if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) {
      return res.status(400).json({ message: "Invalid subtotal" });
    }
 
    // Delivery fee is always computed here, never trusted from the client.
    const deliveryFeePKR = getDeliveryFee(country);
    const totalPKR = parsedSubtotal + deliveryFeePKR;
 
    const order = await Order.create({
      user: userId,
      items: parsedItems,
      shipping: { name, phone, country, city },
      subtotalPKR: parsedSubtotal,
      deliveryFeePKR,
      totalPKR,
      advancePayment: {
        receiptImage: `/uploads/receipts/${req.file.filename}`,
      },
    });
 
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});
 
/**
 * GET /api/orders/:userId
 * Logged-in user apne orders dekh sake
 */
router.get("/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});
 
/**
 * GET /api/orders
 * Admin ke liye — sab orders
 */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});
 
/**
 * PATCH /api/orders/:id/status
 * Admin order status update kare (pending -> confirmed -> shipped -> delivered)
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});
 
module.exports = router;
 