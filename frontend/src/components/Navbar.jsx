import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWishlist, logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const refreshWishlistCount = useCallback(async () => {
    if (!user) return setWishlistCount(0);
    try {
      const response = await getWishlist();
      setWishlistCount(response.data.count ?? response.data.wishlist.length);
    } catch { setWishlistCount(0); }
  }, [user]);

  useEffect(() => {
    refreshWishlistCount();
    window.addEventListener("shopkart:wishlist-changed", refreshWishlistCount);
    return () => window.removeEventListener("shopkart:wishlist-changed", refreshWishlistCount);
  }, [refreshWishlistCount]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      // even if the API call fails, clear local state
    }
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
      <Link to="/home" className="text-xl font-bold text-indigo-600">
        ShopKart
      </Link>

      <div className="flex items-center gap-6 text-sm font-medium text-gray-700">
        {user ? (
          <>
            <Link to="/home" className="hover:text-indigo-600">Home</Link>
            <Link to="/products" className="hover:text-indigo-600">Products</Link>
            <Link to="/wishlist" className="inline-flex items-center gap-2 hover:text-indigo-600" aria-label={`Wishlist, ${wishlistCount} items`}>
              Wishlist <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-pink-600 px-1.5 py-0.5 text-xs font-bold text-white">{wishlistCount}</span>
            </Link>
            <Link to="/orders" className="hover:text-indigo-600">My Orders</Link>
            <Link to="/cart" className="inline-flex items-center gap-2 hover:text-indigo-600" aria-label={`Cart, ${itemCount} items`}>
              Cart
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-bold text-white">{itemCount}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-600">Login</Link>
            <Link to="/register" className="hover:text-indigo-600">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
