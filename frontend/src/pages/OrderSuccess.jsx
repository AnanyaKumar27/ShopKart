import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../services/api";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    getOrder(id).then((response) => {
      if (active) { setOrder(response.data.order); setStatus("success"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [id]);

  if (status === "loading") return <p className="py-16 text-center text-gray-500">Loading order...</p>;
  if (status === "error" || !order) return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><p role="alert" className="mb-5 text-red-600">We could not load this order.</p><Link to="/orders" className="font-semibold text-indigo-600">View My Orders</Link></main>;

  return <main className="mx-auto max-w-3xl px-4 py-14">
    <section className="rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${order.paymentStatus === "PAID" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`} aria-hidden="true">{order.paymentStatus === "PAID" ? "✓" : "!"}</div>
      <h1 className="mt-5 text-3xl font-bold text-gray-900">{order.paymentStatus === "PAID" ? "Order placed successfully" : "Payment is not complete"}</h1>
      <p className="mt-3 text-gray-500">{order.paymentStatus === "PAID" ? "Your payment has been verified and your order is saved." : "This order is still awaiting verified payment. Your cart remains available."}</p>
      <div className="mx-auto my-7 max-w-md rounded-2xl bg-gray-50 p-5 text-left">
        <p className="text-sm text-gray-500">Order ID</p><p className="break-all font-semibold text-gray-900">{order._id}</p>
        <div className="mt-4 flex justify-between gap-4"><span className="text-gray-500">Total</span><strong>{money(order.totalAmount)}</strong></div>
        <div className="mt-2 flex justify-between gap-4"><span className="text-gray-500">Status</span><strong>{order.status}</strong></div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">{order.paymentStatus !== "PAID" && <Link to="/checkout" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">Return to Checkout</Link>}<Link to="/orders" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">View My Orders</Link><Link to="/products" className="rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700">Continue Shopping</Link></div>
    </section>
  </main>;
}
