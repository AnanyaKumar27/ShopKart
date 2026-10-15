const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    req.user = customer;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
