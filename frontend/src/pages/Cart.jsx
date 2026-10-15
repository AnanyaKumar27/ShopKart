import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPrice = (amount) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(amount);

export default function Cart() {
  const { items, itemCount, subtotal, loading, error, refreshCart, updateQuantity, removeItem } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const runAction = async (productId, action) => {
    setBusyId(productId);
    setActionError("");
    try { await action(); }
    catch (err) { setActionError(err.response?.data?.message || "Cart update failed. Please try again."); }
    finally { setBusyId(null); }
  };

  if (loading && items.length === 0) {
    return <p className="py-16 text-center text-gray-500">Loading your cart...</p>;
  }

  if (error && items.length === 0) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="mb-4 text-red-600">Unable to load your cart.</p>
      <button onClick={() => refreshCart().catch(() => {})} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">Try Again</button>
    </main>;
  }

  if (items.length === 0) {
    return <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
        <div className="mb-5 text-4xl" aria-hidden="true">🛒</div>
        <h1 className="text-3xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-3 text-gray-500">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="mt-7 inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white">Browse Products</Link>
      </div>
    </main>;
  }

  return <main className="mx-auto max-w-6xl px-4 py-10">
    <div className="mb-8 flex items-end justify-between">
      <h1 className="text-3xl font-bold text-gray-900">My Cart</h1>
      <p className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
    </div>
    {actionError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button onClick={() => refreshCart().catch(() => {})} className="font-semibold underline">Retry loading cart</button></div>}
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4" aria-label="Cart items">
        {items.map(({ product, quantity }) => product && <article key={product._id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <img src={product.image} alt={product.name} className="h-28 w-full rounded-xl bg-gray-100 object-cover sm:w-32" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-indigo-600">{product.category}</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">{product.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{formatPrice(product.price)} each</p>
            <button disabled={busyId === product._id} onClick={() => runAction(product._id, () => removeItem(product._id))} className="mt-3 text-sm font-medium text-red-600 disabled:opacity-50">
              {busyId === product._id ? "Updating..." : "Remove"}
            </button>
          </div>
          <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
            <div className="inline-flex items-center rounded-xl border border-gray-200" aria-label={`Quantity for ${product.name}`}>
              <button disabled={busyId === product._id || quantity <= 1} onClick={() => runAction(product._id, () => updateQuantity(product._id, quantity - 1))} className="h-10 w-10 rounded-l-xl text-lg disabled:text-gray-300" aria-label="Decrease quantity">−</button>
              <span className="w-9 text-center text-sm font-semibold">{quantity}</span>
              <button disabled={busyId === product._id || quantity >= Number(product.stock)} onClick={() => runAction(product._id, () => updateQuantity(product._id, quantity + 1))} className="h-10 w-10 rounded-r-xl text-lg disabled:text-gray-300" aria-label="Increase quantity">+</button>
            </div>
            <p className="font-bold text-gray-900">{formatPrice(Number(product.price) * quantity)}</p>
          </div>
        </article>)}
        <Link to="/products" className="inline-flex pt-2 text-sm font-semibold text-indigo-600">← Continue shopping</Link>
      </section>
      <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
        <div className="mt-6 flex justify-between text-sm text-gray-600"><span>Items</span><span>{itemCount}</span></div>
        <div className="mt-3 flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="my-5 border-t border-gray-100" />
        <div className="flex justify-between font-bold text-gray-900"><span>Estimated total</span><span>{formatPrice(subtotal)}</span></div>
        <Link to="/checkout" className="mt-6 block w-full rounded-xl bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700">Proceed to Checkout</Link>
        <p className="mt-3 text-center text-xs text-gray-400">Secure test payment powered by Razorpay.</p>
      </aside>
    </div>
  </main>;
}
