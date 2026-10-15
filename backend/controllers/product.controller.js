const mongoose = require("mongoose");
const Product = require("../models/product.model");

// POST /products
async function createProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name || !description || !category || !image || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: "Missing required field" });
    }

    if (price <= 0) {
      return res.status(400).json({ success: false, message: "Invalid price" });
    }

    if (stock < 0) {
      return res.status(400).json({ success: false, message: "Invalid stock" });
    }

    const product = await Product.create({ name, description, price, category, image, stock });

    return res.status(201).json({ success: true, product });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// GET /products?search=&category=&sort=
async function getProducts(req, res) {
  try {
    const { search, category, sort } = req.query;
    const query = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: escapedSearch, $options: "i" };
    }

    if (category && category !== "All Categories") {
      query.category = category;
    }

    let cursor = Product.find(query);

    if (sort === "price_asc") cursor = cursor.sort({ price: 1 });
    if (sort === "price_desc") cursor = cursor.sort({ price: -1 });

    const products = await cursor;

    return res.status(200).json({ success: true, count: products.length, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /products/:id
async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createProduct, getProducts, getProductById };
