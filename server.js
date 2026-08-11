const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
 
const app = express();
 
// MIDDLEWARE
app.use(cors());
app.use(express.json());
 
let isConnected = false;
 
// MongoDB Connection
async function connectToMongoDB() {
  if (isConnected) return;
 
  try {
    await mongoose.connect(process.env.MONGO_URI);
 
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
}
connectToMongoDB();
 
// STATIC FOLDER — receipt screenshots yahan se serve honge
// e.g. http://localhost:5000/uploads/receipts/1752345678901-849302.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
 
// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
 
// TEST ROUTE
app.get("/", (req, res) => {
  res.json({ message: "Backend Running..." });
});
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
 
module.exports = app;