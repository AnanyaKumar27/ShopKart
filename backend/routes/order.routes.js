const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { createPaymentOrder, verifyPayment, getOrders, getOrder } = require("../controllers/order.controller");

router.use(authMiddleware);
router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getOrders);
router.get("/:id", getOrder);

module.exports = router;
