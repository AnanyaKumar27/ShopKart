import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { addItem } = useCart();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setAddedToCart(false);
    getProductById(id)
      .then((res) => {
        if (!active) return;
        setProduct(res.data.product);
        setStatus("success");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") {
    return <p className="text-center text-gray-500 py-16">Loading product...</p>;
  }

  if (status === "error" || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">Something went wrong while loading this product.</p>
        <Link to="/products" className="text-indigo-600 font-medium">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/products" className="text-sm text-indigo-600 font-medium">
        ← Back to Products
      </Link>

      <div className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <img src={product.image} alt={product.name} className="w-full h-80 md:h-full object-cover bg-gray-100" />

        <div className="p-8 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-2xl font-bold text-indigo-600">₹{product.price}</p>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
          <p className="text-sm text-gray-500">
            {product.stock > 0 ? `${product.stock} units in stock` : "Out of stock"}
          </p>

          <button
            onClick={async () => {
              if (adding) return;
              setAdding(true);
              setCartError("");
              try {
                await addItem(product);
              setAddedToCart(true);
              } catch (err) {
                setCartError(err.response?.data?.message || "Unable to add this product to your cart.");
              } finally {
                setAdding(false);
              }
            }}
            disabled={product.stock === 0 || adding}
            className="mt-4 w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {adding ? "Adding..." : addedToCart ? "Add another" : "Add to cart"}
          </button>
          {cartError && <p role="alert" className="text-center text-sm text-red-600">{cartError}</p>}
          {addedToCart && (
            <Link to="/cart" className="text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View your cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
