import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { addToCart as addCartItem, getCart, removeFromCart as deleteCartItem, updateCartQuantity as patchCartItem } from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async (authenticated = true) => {
    if (!authenticated) {
      setCartItems([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await getCart();
      setCartItems(response.data.cart || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your cart.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyMutation = useCallback(async (request) => {
    setError("");
    try {
      const response = await request;
      setCartItems(response.data.cart || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Cart update failed. Please try again.");
      throw err;
    }
  }, []);

  const addItem = useCallback((product) => applyMutation(addCartItem(product._id)), [applyMutation]);
  const updateQuantity = useCallback((productId, quantity) =>
    applyMutation(patchCartItem(productId, quantity)), [applyMutation]);
  const removeItem = useCallback((productId) => applyMutation(deleteCartItem(productId)), [applyMutation]);
  const clearCart = useCallback(() => {
    setCartItems([]);
    setError("");
  }, []);

  const value = useMemo(() => ({
    cartItems,
    items: cartItems,
    loading,
    error,
    refreshCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount: cartItems.reduce((total, item) => total + item.quantity, 0),
    subtotal: cartItems.reduce(
      (total, item) => total + Number(item.product?.price || 0) * item.quantity,
      0
    ),
  }), [cartItems, loading, error, refreshCart, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
