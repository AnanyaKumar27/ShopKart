// Run with: node seed.js
// Keeps the demo catalog at exactly 10 products in each category.
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");
const Customer = require("./models/customer.model");

const catalog = {
  Electronics: [
    ["Smartphone", 24999, "smartphone", "1583291023438-41cef6453b1f"],
    ["Laptop", 58999, "laptop", "1496181133206-80ce9b88a853"],
    ["Tablet", 18999, "tablet", "1544244015-0df4b3ffc6b0"],
    ["Wireless Earbuds", 2499, "wireless-earbuds", "1756902368926-eb9e5e9d2a69"],
    ["Noise Cancelling Headphones", 4999, "noise-cancelling-headphones", "1505740420928-5e560c06d30e"],
    ["Bluetooth Speaker", 3299, "bluetooth-speaker", "1608043152269-423dbba4e7e1"],
    ["Smartwatch", 4999, "smartwatch", "1523395243481-163f8f6155ab"],
    ["Power Bank", 1499, "power-bank", "1525858907241-d230b66fb9fa"],
    ["Phone Charger", 799, "phone-charger", "1609692814858-f7cd2f0afa4f"],
    ["USB-C Cable", 399, "usb-c-cable", "1625842268584-8f3296236761"],
  ],
  Fashion: [
    ["Cotton Crew T-Shirt", 599, "cotton-crew-t-shirt", "1521572163474-6864f9cf17ab"],
    ["Casual Shirt", 1199, "casual-shirt", "1603252109303-2751441dd157"],
    ["Classic Jeans", 1799, "classic-jeans", "1542272604-787c3835535d"],
    ["Everyday Trousers", 1499, "everyday-trousers", "1517438476312-10d79c077509"],
    ["Fleece Hoodie", 1699, "fleece-hoodie", "1556821840-3a63f95609a7"],
    ["Classic Denim Jacket", 1799, "classic-denim-jacket", "1551028719-00167b16eac5"],
    ["Casual Shorts", 799, "casual-shorts", "1515886657613-9f3515b0c78f"],
    ["Track Pants", 999, "track-pants", "1519861531473-9200262188bf"],
    ["Everyday Sneakers", 2499, "everyday-sneakers", "1542291026-7eec264c27ff"],
    ["Comfort Sandals", 899, "comfort-sandals", "1565608438257-fac3c27beb36"],
  ],
  Books: [
    ["Fiction Novels Collection", 599, "fiction-novels-collection", "1544947950-fa07a98d237f"],
    ["Mystery & Thriller", 499, "mystery-thriller", "1512820790803-83ca734da794"],
    ["Romance Stories", 449, "romance-stories", "1519682337058-a94d519337bc"],
    ["Science Fiction Collection", 549, "science-fiction-collection", "1495446815901-a7297e633e8d"],
    ["Atomic Habits", 399, "atomic-habits", "1544947950-fa07a98d237f"],
    ["Personal Finance Basics", 499, "personal-finance-basics", "1553729459-efe14ef6055d"],
    ["Biographies Collection", 599, "biographies-collection", "1512820790803-83ca734da794"],
    ["World History", 649, "world-history", "1461360370896-922624d12aa1"],
    ["Introduction to Psychology", 549, "introduction-to-psychology", "1543002588-bfa74002ed7e"],
    ["The Design of Everyday Things", 549, "design-of-everyday-things", "1512820790803-83ca734da794"],
  ],
  Home: [
    ["Soft Cotton Bedsheet Set", 1499, "soft-cotton-bedsheet-set", "1505693416388-ac5ce068fe85"],
    ["Memory Foam Pillow", 899, "memory-foam-pillow", "1584100936595-c0654b55a2e2"],
    ["Warm Fleece Blanket", 1299, "warm-fleece-blanket", "1616486338812-3dadae4b4ace"],
    ["Cotton Bath Towels", 699, "cotton-bath-towels", "1724847885015-be191f1a47ef"],
    ["Light Filtering Curtains", 1199, "light-filtering-curtains", "1558970439-add78fc68990"],
    ["Decorative Cushion Set", 799, "decorative-cushion-set", "1584100936595-c0654b55a2e2"],
    ["Ceramic Table Lamp", 1299, "ceramic-table-lamp", "1507473885765-e6ed057f782c"],
    ["Modern Wall Clock", 999, "modern-wall-clock", "1563861826100-9cb868fdbe1c"],
    ["Stackable Storage Boxes", 599, "stackable-storage-boxes", "1682071308392-2e7a285fc11c"],
    ["Space Saving Hangers", 399, "space-saving-hangers", "1517502166878-35c93a0072f0"],
  ],
};

// These are the older demo items removed to keep the catalog at 10 per category.
const retiredDemoNames = [
  "Wireless Mouse", "Mechanical Keyboard", "Laptop Stand", "Phone Stand", "Webcam",
  "Cotton Socks Pack", "Classic Cap", "Leather Belt", "Everyday Backpack",
  "Everyday Canvas Tote", "Minimal Wrist Watch", "Polarized Sunglasses",
  "Programming Fundamentals", "Data Science Essentials", "Practical Mathematics",
  "Competitive Exam Practice Guide", "Everyday Home Cooking", "Laundry Basket",
  "Reusable Water Bottle", "Insulated Travel Mug", "Dinner Plates Set",
  "Serving Bowls Set", "Stainless Steel Cutlery Set", "Food Storage Containers",
  "Home Cleaning Essentials", "Welcome Doormat", "Indoor Plant Pots",
];

const sampleProducts = Object.entries(catalog).flatMap(([category, products]) =>
  products.map(([name, price, slug], index) => ({
    name,
    description: `${name} selected for dependable everyday use, with practical features and a quality finish.`,
    price,
    category,
    image: `/products/${slug}.jpg`,
    stock: 8 + ((index * 7 + category.length) % 38),
  }))
);

const insertOnlyFields = (product) => {
  const { image, ...fields } = product;
  return fields;
};

async function seed() {
  const counts = Object.fromEntries(Object.entries(catalog).map(([category, products]) => [category, products.length]));
  if (sampleProducts.length !== 40 || Object.values(counts).some((count) => count !== 10)) {
    throw new Error("Catalog must contain exactly 10 products in each category");
  }

  await mongoose.connect(process.env.MONGO_URI);
  try {
    const result = await Product.bulkWrite(
      sampleProducts.map((product) => ({
        updateOne: {
          filter: { name: product.name },
          update: { $set: { image: product.image }, $setOnInsert: insertOnlyFields(product) },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    const retired = await Product.find({ name: { $in: retiredDemoNames }, image: /unsplash\.com/i }).select("_id");
    const retiredIds = retired.map(({ _id }) => _id);
    if (retiredIds.length) {
      await Customer.updateMany({ wishlist: { $in: retiredIds } }, { $pull: { wishlist: { $in: retiredIds } } });
      await Product.deleteMany({ _id: { $in: retiredIds } });
    }

    const countsInDb = await Product.aggregate([
      { $match: { name: { $in: sampleProducts.map(({ name }) => name) } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const actualCounts = Object.fromEntries(countsInDb.map(({ _id, count }) => [_id, count]));
    for (const category of Object.keys(catalog)) {
      if (actualCounts[category] !== 10) throw new Error(`Expected 10 ${category} products; found ${actualCounts[category] || 0}`);
    }
    console.log(`Catalog ready: ${result.upsertedCount} added, ${retiredIds.length} older demo products removed; 10 each in Electronics, Fashion, Books, and Home.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
