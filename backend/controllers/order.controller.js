const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const getRazorpay = require("../config/razorpay");

const requiredAddressFields = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];

function validateAddress(address) {
  if (!address || typeof address !== "object") return "Shipping address is required";
  for (const field of requiredAddressFields) {
    if (typeof address[field] !== "string" || !address[field].trim()) return `${field} is required`;
  }
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(address.phone.trim())) return "Enter a valid Indian mobile number (10 digits, optionally prefixed with +91)";
  if (!/^\d{6}$/.test(address.pincode.trim())) return "Pincode must contain 6 digits";
  return null;
}

async function createPaymentOrder(req, res) {
  const addressError = validateAddress(req.body?.shippingAddress);
  if (addressError) return res.status(400).json({ success: false, message: addressError });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ success: false, message: "Razorpay test keys are not configured on the server" });
  }

  let order;
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) return res.status(401).json({ success: false, message: "Not authenticated" });
    if (!customer.cart.length) return res.status(400).json({ success: false, message: "Your cart is empty" });

    const productIds = customer.cart.map((entry) => entry.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const items = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const productId = cartItem.product.toString();
      const product = productMap.get(productId);
      if (!product) return res.status(400).json({ success: false, message: "A product in your cart is no longer available. Please update your cart." });
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}.` });
      }
      items.push({ product: product._id, name: product.name, price: product.price, quantity: cartItem.quantity, image: product.image });
      totalAmount += product.price * cartItem.quantity;
    }
    totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;
    if (!Number.isSafeInteger(Math.round(totalAmount * 100)) || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Order total is invalid" });
    }

    order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: Object.fromEntries(requiredAddressFields.map((field) => [field, req.body.shippingAddress[field].trim()])),
      totalAmount,
    });

    let paymentOrder;
    try {
      paymentOrder = await getRazorpay().orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
        notes: { shopKartOrderId: order._id.toString(), customerId: customer._id.toString() },
      });
      order.razorpayOrderId = paymentOrder.id;
      await order.save();
    } catch (paymentError) {
      await Order.deleteOne({ _id: order._id, paymentStatus: "PENDING" });
      return res.status(502).json({ success: false, message: "Could not start payment. Your cart is unchanged; please try again." });
    }

    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      order: { _id: order._id, items: order.items, totalAmount: order.totalAmount, shippingAddress: order.shippingAddress },
    });
  } catch (err) {
    if (order?._id) await Order.deleteOne({ _id: order._id, paymentStatus: "PENDING" }).catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to create your order. Your cart is unchanged." });
  }
}

async function verifyPayment(req, res) {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (![shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ success: false, message: "Payment verification details are incomplete" });
    }
    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: "Invalid ShopKart order ID" });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId !== razorpay_payment_id || order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({ success: false, message: "Payment does not match this order" });
      }
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Payment order does not match" });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: "Payment verification is not configured" });
    }

    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest();
    let received;
    try { received = Buffer.from(razorpay_signature, "hex"); } catch { received = Buffer.alloc(0); }
    if (received.length !== expected.length || !crypto.timingSafeEqual(expected, received)) {
      return res.status(400).json({ success: false, message: "Invalid payment signature. Your cart has not been cleared." });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, user: req.user._id, paymentStatus: "PENDING", razorpayOrderId: razorpay_order_id },
      { $set: { paymentStatus: "PAID", status: "PLACED", razorpayPaymentId: razorpay_payment_id } },
      { new: true, runValidators: true },
    );
    if (!updated) {
      const current = await Order.findById(order._id);
      if (current?.paymentStatus === "PAID" && current.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({ success: true, message: "Payment already verified", order: current });
      }
      return res.status(409).json({ success: false, message: "Order payment state changed; refresh your orders" });
    }

    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });
    return res.status(200).json({ success: true, message: "Payment verified and order placed", order: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Unable to verify payment. Your cart has not been cleared." });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
}

async function getOrder(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.status(200).json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Unable to load order" });
  }
}

module.exports = { createPaymentOrder, verifyPayment, getOrders, getOrder };
