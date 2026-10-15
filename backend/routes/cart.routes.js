const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} = require("../controllers/cart.controller");

router.use(authMiddleware);
router.post("/:productId", addToCart);
router.get("/", getCart);
router.patch("/:productId", updateCartQuantity);
router.delete("/:productId", removeFromCart);

module.exports = router;
