const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: create a JWT for a user
function createToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Helper: shape the user object we send back to frontend
function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    country: user.country,
    city: user.city,
    email: user.email,
  };
}

// ================= SIGNUP =================
router.post("/signup", async (req, res) => {
  try {
    const { fullName, phone, country, city, email, password } = req.body;

    if (!fullName || !phone || !country || !city || !email || !password) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      phone,
      country,
      city,
      email,
      password: hashedPassword,
    });

    const token = createToken(user);

    res.json({
      success: true,
      message: "Signup successful",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.json({
        success: false,
        message: "Please login with Google",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({
        success: false,
        message: "Wrong password",
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
});

// ================= GOOGLE LOGIN =================
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Google users may not have phone/country/city yet.
      // Frontend should prompt them to complete their profile after first login.
      user = await User.create({
        fullName: name,
        email,
        googleId: sub,
        phone: "",
        country: "",
        city: "",
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Google Login Failed",
    });
  }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
