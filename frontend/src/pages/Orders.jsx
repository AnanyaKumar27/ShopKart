import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../services/api";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await getOrders();
      setOrders(response.data.orders || []);
      setStatus("success");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your orders.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  if (status === "loading") return <p className="py-16 text-center text-gray-500">Loading your orders...</p>;
  if (status === "error") return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><p role="alert" className="mb-4 text-red-600">{error}</p><button onClick={loadOrders} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">Try Again</button></main>;
  if (orders.length === 0) return <main className="mx-auto max-w-4xl px-4 py-16 text-center"><h1 className="text-3xl font-bold text-gray-900">My Orders</h1><p className="mt-4 text-gray-500">You have not placed any orders yet.</p><Link to="/products" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white">Start Shopping</Link></main>;

  return <main className="mx-auto max-w-5xl px-4 py-10">
    <h1 className="mb-7 text-3xl font-bold text-gray-900">My Orders</h1>
    <div className="space-y-5">{orders.map((order) => <article key={order._id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-gray-900">Order #{order._id.slice(-8)}</h2><p className="mt-1 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "PLACED" || order.status === "CONFIRMED" || order.status === "SHIPPED" || order.status === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{order.status.replaceAll("_", " ")}</span></div>
      <ul className="my-4 space-y-2 border-y border-gray-100 py-4">{order.items.map((item, index) => <li key={`${item.product}-${index}`} className="flex justify-between gap-4 text-sm text-gray-600"><span>{item.name} × {item.quantity}</span><span>{money(item.price * item.quantity)}</span></li>)}</ul>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold text-gray-900">Total: {money(order.totalAmount)} <span className="ml-2 text-xs font-medium text-gray-500">Payment: {order.paymentStatus}</span></p><Link to={`/order-success/${order._id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View Details</Link></div>
    </article>)}</div>
  </main>;
}
