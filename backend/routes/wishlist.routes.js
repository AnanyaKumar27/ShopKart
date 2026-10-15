const express = require("express");
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controllers/wishlist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.use(authMiddleware);

router.post("/:productId", addToWishlist);
router.get("/", getWishlist);
router.delete("/:productId", removeFromWishlist);
router.patch("/:productId/toggle", toggleWishlist);

module.exports = router;
