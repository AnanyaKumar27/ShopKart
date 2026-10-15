const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const { generateToken, setAuthCookie } = require("../utils/generateToken");

// POST /customers/register
async function registerCustomer(req, res) {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /customers/login
async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(customer._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /customers/me
async function getMe(req, res) {
  return res.status(200).json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    phone: req.user.phone,
  });
}

// POST /customers/logout
async function logoutCustomer(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}

// PATCH /customers/change-password (bonus)
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Old and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "New password must be at least 6 characters" });
    }

    const customer = await Customer.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, customer.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  registerCustomer,
  loginCustomer,
  getMe,
  logoutCustomer,
  changePassword,
};
