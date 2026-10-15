import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPaymentOrder, verifyPayment } from "../services/api";
import { useCart } from "../context/CartContext";

const initialAddress = { fullName: "", phone: "", addressLine1: "", city: "", state: "", pincode: "" };
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (existing.dataset.failed === "true") {
        existing.remove();
        return resolve(loadRazorpayScript());
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { script.dataset.loaded = "true"; resolve(true); };
    script.onerror = () => { script.dataset.failed = "true"; resolve(false); };
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, loading, error, refreshCart, clearCart } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState("shipping");

  useEffect(() => {
    if (!loading && !error && items.length === 0) navigate("/cart", { replace: true });
  }, [loading, error, items.length, navigate]);

  const update = (event) => setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));

  const validate = () => {
    const errors = {};
    for (const [field, value] of Object.entries(address)) {
      if (!value.trim()) errors[field] = "This field is required.";
    }
    if (address.phone.trim() && !/^(?:\+91)?[6-9]\d{9}$/.test(address.phone.trim())) errors.phone = "Enter a valid Indian mobile number (10 digits, optionally prefixed with +91).";
    if (address.pincode.trim() && !/^\d{6}$/.test(address.pincode.trim())) errors.pincode = "Pincode must contain 6 digits.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setMessage("");
    if (step === "shipping") {
      if (validate()) setStep("review");
      return;
    }
    setPlacing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) throw new Error("Razorpay Checkout could not be loaded. Check your connection and try again.");

      const { data } = await createPaymentOrder(Object.fromEntries(Object.entries(address).map(([key, value]) => [key, value.trim()])));
      const checkout = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart order payment",
        order_id: data.razorpayOrderId,
        prefill: { name: address.fullName.trim(), contact: address.phone.trim() },
        notes: { shopKartOrderId: data.shopKartOrderId },
        theme: { color: "#4f46e5" },
        config: {
          display: {
            blocks: {
              netbanking_only: {
                name: "Netbanking",
                instruments: [{ method: "netbanking" }],
              },
            },
            sequence: ["block.netbanking_only"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response) => {
          try {
            await verifyPayment({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            navigate(`/order-success/${data.shopKartOrderId}`, { replace: true });
          } catch (verifyError) {
            setMessage(verifyError.response?.data?.message || "Payment verification failed. Your cart has not been cleared. Contact support before retrying payment.");
            setPlacing(false);
          }
        },
        modal: { ondismiss: () => { setMessage("Payment was not completed. Your cart is unchanged; you can try again."); setPlacing(false); } },
      });
      checkout.on("payment.failed", (response) => {
        setMessage(response.error?.description || "Payment failed. Your cart has not been cleared. Please try again.");
        setPlacing(false);
      });
      checkout.open();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "Unable to start checkout. Please try again.");
      setPlacing(false);
    }
  };

  if (loading) return <p className="py-16 text-center text-gray-500">Loading checkout...</p>;
  if (error) return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><p role="alert" className="mb-4 text-red-600">Unable to load your cart.</p><button onClick={() => refreshCart().catch(() => {})} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">Try Again</button></main>;

  const fields = [
    ["fullName", "Full name", "text"], ["phone", "Phone number", "tel"],
    ["addressLine1", "Address line", "text"], ["city", "City", "text"],
    ["state", "State", "text"], ["pincode", "Pincode", "text"],
  ];

  return <main className="mx-auto max-w-6xl px-4 py-10">
    <div className="mb-8"><Link to="/cart" className="text-sm font-semibold text-indigo-600">← Back to cart</Link><h1 className="mt-2 text-3xl font-bold text-gray-900">Checkout</h1></div>
    {message && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{message}</p>}
    <form onSubmit={placeOrder} noValidate className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {step === "shipping" ? <>
          <h2 className="mb-5 text-xl font-bold text-gray-900">Shipping details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([name, label, type]) => <label key={name} className={`block ${name === "addressLine1" ? "sm:col-span-2" : ""}`}>
              <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
              <input name={name} type={type} autoComplete={name === "fullName" ? "name" : name === "phone" ? "tel" : "off"} value={address[name]} onChange={update} aria-invalid={Boolean(fieldErrors[name])} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {name === "phone" && <span className="mt-1 block text-xs text-gray-500">For +91, enter a 10-digit mobile number starting with 6, 7, 8, or 9.</span>}
              {fieldErrors[name] && <span className="mt-1 block text-sm text-red-600">{fieldErrors[name]}</span>}
            </label>)}
          </div>
        </> : <>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">Review your order</h2>
            <button type="button" onClick={() => setStep("shipping")} className="text-sm font-semibold text-indigo-600">Edit shipping</button>
          </div>
          <h3 className="font-semibold text-gray-900">Ship to</h3>
          <address className="mt-2 text-sm not-italic leading-6 text-gray-600">
            {address.fullName}<br />{address.phone}<br />{address.addressLine1}<br />{address.city}, {address.state} {address.pincode}
          </address>
          <h3 className="mb-3 mt-7 font-semibold text-gray-900">Items</h3>
          <div className="space-y-3">{items.map(({ product, quantity }) => product && <div key={product._id} className="flex justify-between gap-4 text-sm"><span className="text-gray-600">{product.name} × {quantity}</span><span className="font-medium text-gray-900">{money(product.price * quantity)}</span></div>)}</div>
          <div className="mt-5 flex justify-between border-t border-gray-100 pt-4 font-bold text-gray-900"><span>Total</span><span>{money(subtotal)}</span></div>
        </>}
      </section>
      <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
        <div className="mt-5 space-y-4">{items.map(({ product, quantity }) => product && <div key={product._id} className="flex justify-between gap-4 text-sm"><span className="text-gray-600">{product.name} × {quantity}</span><span className="font-medium text-gray-900">{money(product.price * quantity)}</span></div>)}</div>
        <div className="my-5 border-t border-gray-100" />
        <div className="flex justify-between text-sm text-gray-600"><span>Total items</span><span>{itemCount}</span></div>
        <div className="mt-3 flex justify-between font-bold text-gray-900"><span>Total</span><span>{money(subtotal)}</span></div>
        <button type="submit" disabled={placing || items.length === 0} className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{placing ? "Starting secure payment..." : step === "shipping" ? "Review Order" : "Place Order"}</button>
        <p className="mt-3 text-center text-xs text-gray-400">{step === "review" ? "You’ll confirm payment securely with Razorpay." : "Razorpay Test Mode. No real payment will be taken."}</p>
      </aside>
    </form>
  </main>;
}
