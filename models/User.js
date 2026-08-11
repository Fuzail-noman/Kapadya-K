const mongoose = require("mongoose");
 
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
 
    // Google se signup karne walon ke paas phone/country/city
    // shuru mein nahi hoti, isliye ye required nahi hain.
    // Manual /signup route pehle hi in fields ko check kar leta hai.
    phone: {
      type: String,
      default: "",
    },
 
    country: {
      type: String,
      default: "",
    },
 
    city: {
      type: String,
      default: "",
    },
 
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
 
    password: {
      type: String,
      default: "",
    },
 
    googleId: {
      type: String,
      default: "",
    },
 
    // Admin-only routes (sab orders dekhna, status update karna) iske
    // through protect kiye jate hain.
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
 
module.exports = mongoose.model("User", userSchema);