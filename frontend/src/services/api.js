import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // send/receive the HttpOnly auth cookie
});

// ---- Auth ----
export const registerCustomer = (data) => api.post("/customers/register", data);
export const loginCustomer = (data) => api.post("/customers/login", data);
export const getMe = () => api.get("/customers/me");
export const logoutCustomer = () => api.post("/customers/logout");

// ---- Products ----
export const getProducts = (params) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);

// ---- Wishlist ----
export const getWishlist = () => api.get("/wishlist");
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);
export const toggleWishlist = (productId) => api.patch(`/wishlist/${productId}/toggle`);
export const notifyWishlistChanged = () => window.dispatchEvent(new Event("shopkart:wishlist-changed"));

// ---- Cart ----
export const getCart = () => api.get("/cart");
export const addToCart = (productId) => api.post(`/cart/${productId}`);
export const updateCartQuantity = (productId, quantity) => api.patch(`/cart/${productId}`, { quantity });
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);

// ---- Orders ----
export const createPaymentOrder = (shippingAddress) => api.post("/orders/create-payment-order", { shippingAddress });
export const verifyPayment = (details) => api.post("/orders/verify-payment", details);
export const getOrders = () => api.get("/orders");
export const getOrder = (id) => api.get(`/orders/${id}`);

export default api;
