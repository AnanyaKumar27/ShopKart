import React, { useState } from "react";
import { Link } from "react-router-dom";
import { notifyWishlistChanged, toggleWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, isWishlisted = false, onWishlistChange }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const handleWishlist = async () => {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      const response = await toggleWishlist(product._id);
      onWishlistChange?.(product._id, response.data.saved);
      notifyWishlistChanged();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (adding || product.stock < 1) return;
    setAdding(true);
    setCartError("");
    try {
      await addItem(product);
    } catch (err) {
      setCartError(err.response?.data?.message || "Unable to add this product to your cart.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
      <img src={product.image} alt={product.name} className="w-full h-44 object-cover bg-gray-100" />
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500">{product.category}</p>
        <p className="text-lg font-bold text-indigo-600">₹{product.price}</p>
        <p className="text-xs text-gray-500 mb-2">{product.stock > 0 ? `${product.stock} units left` : "Out of stock"}</p>
        <div className="mt-auto flex flex-col gap-2">
          <button onClick={handleAddToCart} disabled={adding || product.stock === 0} className="text-sm py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:bg-gray-300">
            {adding ? "Adding..." : product.stock > 0 ? "Add to cart" : "Out of stock"}
          </button>
          {cartError && <p role="alert" className="text-xs text-red-600">{cartError}</p>}
          <Link to={`/products/${product._id}`} className="text-center text-sm py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition">View Details</Link>
          <button onClick={handleWishlist} disabled={saving} aria-pressed={isWishlisted} className={`text-sm py-2 rounded-lg transition ${error ? "bg-red-50 text-red-600" : isWishlisted ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {saving ? "Saving..." : error ? "Unable to update. Retry" : isWishlisted ? "♥ Remove from Wishlist" : "♡ Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
