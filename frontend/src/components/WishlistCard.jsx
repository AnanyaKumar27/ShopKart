import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function WishlistCard({ product, onRemove, removing }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");
  const handleAddToCart = async () => {
    if (adding) return;
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-44 object-cover bg-gray-100"
      />
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-500">{product.category}</p>
        <p className="text-lg font-bold text-indigo-600">₹{product.price}</p>
        <p className="text-xs text-gray-500 mb-2">
          {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
        </p>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || adding}
            className="text-sm py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {adding ? "Adding..." : product.stock > 0 ? "Add to cart" : "Out of stock"}
          </button>
          {cartError && <p role="alert" className="text-xs text-red-600">{cartError}</p>}
          <Link
            to={`/products/${product._id}`}
            className="text-center text-sm py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
          >
            View Details
          </Link>
          <button
            onClick={() => onRemove(product._id)}
            disabled={removing}
            className="text-sm py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-60"
          >
            {removing ? "Removing..." : "Remove ♥"}
          </button>
        </div>
      </div>
    </div>
  );
}
