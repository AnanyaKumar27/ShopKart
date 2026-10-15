const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// POST /wishlist/:productId
async function addToWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = await Customer.findById(req.user._id);

    const alreadySaved = customer.wishlist.some(
      (id) => id.toString() === productId
    );
    if (alreadySaved) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({ success: true, message: "Product added to wishlist" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /wishlist
async function getWishlist(req, res) {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock",
    });

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /wishlist/:productId
async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);

    const exists = customer.wishlist.some((id) => id.toString() === productId);
    if (!exists) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }

    customer.wishlist = customer.wishlist.filter((id) => id.toString() !== productId);
    await customer.save();

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /wishlist/:productId/toggle (bonus)
async function toggleWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = await Customer.findById(req.user._id);
    const exists = customer.wishlist.some((id) => id.toString() === productId);

    if (exists) {
      customer.wishlist = customer.wishlist.filter((id) => id.toString() !== productId);
      await customer.save();
      return res.status(200).json({ success: true, saved: false });
    } else {
      customer.wishlist.push(productId);
      await customer.save();
      return res.status(200).json({ success: true, saved: true });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { addToWishlist, getWishlist, removeFromWishlist, toggleWishlist };
