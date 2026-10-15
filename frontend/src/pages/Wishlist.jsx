import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import WishlistCard from "../components/WishlistCard";
import { getWishlist, notifyWishlistChanged, removeFromWishlist } from "../services/api";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await getWishlist();
      setItems(res.data.wishlist);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((p) => p._id !== productId));
      notifyWishlistChanged();
    } catch (err) {
      // keep item visible; user can retry
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
      {status === "success" && (
        <p className="text-sm text-gray-500 mb-6">{items.length} products saved</p>
      )}
      {status !== "success" && <div className="mb-6" />}

      {status === "loading" && (
        <p className="text-center text-gray-500 py-12">Loading your wishlist...</p>
      )}

      {status === "error" && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">
            Something went wrong. We couldn't load your wishlist.
          </p>
          <button
            onClick={fetchWishlist}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "success" && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">❤️</p>
          <h2 className="text-lg font-semibold text-gray-900">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">
            Save products you love and find them here later.
          </p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Browse Products
          </Link>
        </div>
      )}

      {status === "success" && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
              removing={removingId === product._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
