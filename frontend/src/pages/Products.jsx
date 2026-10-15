import React, { useEffect, useState, useCallback } from "react";
import ProductCard from "../components/ProductCard";
import { getProducts, getWishlist } from "../services/api";

const CATEGORIES = ["All Categories", "Electronics", "Fashion", "Books", "Home"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [wishlistIds, setWishlistIds] = useState(() => new Set());

  useEffect(() => {
    let active = true;
    getWishlist().then((response) => {
      if (active) setWishlistIds(new Set(response.data.wishlist.map((item) => item._id)));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const updateWishlist = (productId, saved) => {
    setWishlistIds((previous) => {
      const next = new Set(previous);
      if (saved) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const fetchProducts = useCallback(async (currentSearch, currentCategory, currentSort) => {
    setStatus("loading");
    try {
      const params = {};
      if (currentSearch) params.search = currentSearch;
      if (currentCategory && currentCategory !== "All Categories") params.category = currentCategory;
      if (currentSort) params.sort = currentSort;

      const res = await getProducts(params);
      setProducts(res.data.products);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(search, category, sort);
    }, 300); // debounce search typing
    return () => clearTimeout(timeout);
  }, [search, category, sort, fetchProducts]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 px-7 py-9 text-white shadow-sm sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">ShopKart finds</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Good things, picked for you.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
              Browse useful everyday favorites across tech, style, books, and home.
            </p>
          </div>
          <span className="w-fit rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium">
            {status === "success" ? `${products.length} products` : "Discover the collection"}
          </span>
        </div>
      </section>

      <div className="mb-8 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_190px_190px]">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
          className="min-w-0 rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Featured</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {status === "loading" && (
        <p className="text-center text-gray-500 py-12">Loading products...</p>
      )}

      {status === "error" && (
        <div className="rounded-2xl bg-white py-14 text-center shadow-sm">
          <p className="font-semibold text-red-600">We couldn’t load the collection.</p>
          <p className="mt-2 text-sm text-gray-500">Check that the backend is running, then try again.</p>
          <button onClick={() => fetchProducts(search, category, sort)} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">Try again</button>
        </div>
      )}

      {status === "success" && products.length === 0 && (
        <div className="rounded-2xl bg-white py-14 text-center shadow-sm">
          <div className="text-4xl" aria-hidden="true">🔎</div>
          <p className="mt-3 font-semibold text-gray-900">No products found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different search or category.</p>
        </div>
      )}

      {status === "success" && products.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">The collection</h2>
            <p className="text-sm text-gray-500">Prices in Indian rupees</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} isWishlisted={wishlistIds.has(product._id)} onWishlistChange={updateWishlist} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
