const mongoose = require("mongoose");
 
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // per unit, in PKR
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String }, // product image url (optional)
  },
  { _id: false }
);
 
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
 
    // Cart items snapshot at time of order
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
 
    // Shipping details (from Field inputs on CheckoutPage)
    shipping: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true }, // e.g. "Pakistan"
      city: { type: String, required: true, trim: true },
      // area ab CheckoutPage se collect nahi hoti — isliye required
      // nahi rakha, warna order create validation fail hoti hai.
      area: { type: String, trim: true },
    },
 
    // Pricing (all in PKR, same as frontend calculation)
    subtotalPKR: { type: Number, required: true },
    deliveryFeePKR: { type: Number, required: true, default: 11000 },
    totalPKR: { type: Number, required: true },
 
    // Advance payment proof
    advancePayment: {
      amountPKR: { type: Number, default: 500 },
      receiptImage: { type: String, required: true }, // saved file path
    },
 
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("Order", orderSchema);