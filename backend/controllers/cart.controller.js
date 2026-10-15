const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const populatedCart = (customerId) =>
  Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name description price category image stock",
  });

async function addToCart(req, res) {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const [product, customer] = await Promise.all([
      Product.findById(productId),
      Customer.findById(req.user._id),
    ]);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (!customer) return res.status(401).json({ success: false, message: "Not authenticated" });

    const entry = customer.cart.find((item) => item.product.toString() === productId);
    const nextQuantity = entry ? entry.quantity + 1 : 1;
    if (nextQuantity > product.stock) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock" });
    }
    if (entry) entry.quantity = nextQuantity;
    else customer.cart.push({ product: product._id, quantity: 1 });
    await customer.save();
    const updated = await populatedCart(customer._id);
    return res.status(200).json({ success: true, message: "Cart updated", cart: updated.cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getCart(req, res) {
  try {
    const customer = await populatedCart(req.user._id);
    if (!customer) return res.status(401).json({ success: false, message: "Not authenticated" });
    return res.status(200).json({ success: true, cart: customer.cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateCartQuantity(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be a whole number of at least 1" });
    }
    const [product, customer] = await Promise.all([
      Product.findById(productId),
      Customer.findById(req.user._id),
    ]);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (!customer) return res.status(401).json({ success: false, message: "Not authenticated" });
    const entry = customer.cart.find((item) => item.product.toString() === productId);
    if (!entry) return res.status(404).json({ success: false, message: "Product not in cart" });
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock" });
    }
    entry.quantity = quantity;
    await customer.save();
    const updated = await populatedCart(customer._id);
    return res.status(200).json({ success: true, message: "Cart quantity updated", cart: updated.cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const customer = await Customer.findById(req.user._id);
    if (!customer) return res.status(401).json({ success: false, message: "Not authenticated" });
    const exists = customer.cart.some((item) => item.product.toString() === productId);
    if (!exists) return res.status(404).json({ success: false, message: "Product not in cart" });
    customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);
    await customer.save();
    const updated = await populatedCart(customer._id);
    return res.status(200).json({ success: true, message: "Product removed from cart", cart: updated.cart });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { addToCart, getCart, updateCartQuantity, removeFromCart };
