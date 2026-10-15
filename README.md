# ShopKart — Full MERN Project

ShopKart is a full-stack e-commerce application built with React, Node.js,
Express, and MongoDB, featuring authentication, product search, wishlist,
cart, and secure Razorpay checkout.

Combines Labs 01–06 into one working app: Customer Authentication (JWT + HttpOnly
cookies), Product Catalog with search/filter, Wishlist, and a persistent
Shopping Cart (MongoDB references + `populate()`, stock validation, and shared
React Context state), plus shipping checkout, Razorpay Test Mode payment,
signature verification, and persistent order history.

## Project structure

```
shopkart/
├── backend/     Node + Express + MongoDB + Mongoose
├── frontend/    React (Vite) + React Router + Axios + Tailwind
└── postman/     Exported Lab 04–06 API test collection
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — point this at your local MongoDB (`mongodb://127.0.0.1:27017/shopkart`)
  or a MongoDB Atlas connection string.
- `JWT_SECRET` — any long random string.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` — Test Mode API keys from your
  Razorpay dashboard. Keep both values on the backend; never use Live Mode for
  this lab.

Make sure MongoDB is running locally, or use Atlas.

Start the server:

```bash
npm run dev
```

The API runs on `http://localhost:5000`.

### Add sample products

```bash
node seed.js
```

This safely adds 67 sample products across Electronics, Fashion, Books, and Home
(at least 15 per category). It keeps existing products, so you can rerun it
without clearing the database. The products use the Lab 03 product fields and
can be searched, filtered, sorted, viewed, wishlisted, and added to the cart.

The cart is stored per customer in MongoDB. Add products from the catalog or
product details, then open **Cart** to change quantities and review the subtotal.
Proceed to checkout to enter a shipping address and pay through Razorpay Test
Mode. Orders keep purchase-time item and price snapshots, and the cart is only
cleared after the server verifies the payment signature.

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## 3. Try it out

1. Go to `http://localhost:5173/register` and create an account.
2. Log in — the JWT is stored as an HttpOnly cookie automatically
   (`withCredentials: true` in `src/services/api.js`).
3. You'll land on `/home`, showing your profile.
4. Go to `/products` — search, filter by category, click into a product.
5. Search, filter by any of the four categories, or sort by price.
6. Add or remove products from your wishlist on the product cards.
7. Visit `/wishlist` to see, remove, or browse from there.
8. Add products to your cart, update quantities, and proceed to checkout.
9. Enter shipping details, review the order, and complete a Razorpay Test Mode
   payment. A successful payment creates the order and clears the cart.
10. Visit `/orders` to view order history, or open an order to see its details.
11. Logout clears the cookie and redirects to `/login`.

## Submission and secrets

- Commit the backend and frontend source, package manifests/lockfiles, this
  README, and `backend/.env.example`.
- Do not commit `.env` files or real API keys. The root `.gitignore` excludes
  environment files while allowing `.env.example` templates.
- Use Razorpay Test Mode credentials only when evaluating payments. The secret
  belongs in `backend/.env` and is never sent to the frontend.
- The app currently expects the frontend at `http://localhost:5173` and the API
  at `http://localhost:5000`; update the API/CORS configuration if deploying.

## API summary

| Method | Endpoint                     | Auth | Purpose                  |
|--------|-------------------------------|:---:|---------------------------|
| POST   | `/customers/register`         | ❌  | Register a customer       |
| POST   | `/customers/login`            | ❌  | Login, sets JWT cookie    |
| GET    | `/customers/me`                | ✅  | Get current customer      |
| POST   | `/customers/logout`            | ✅  | Clear auth cookie         |
| PATCH  | `/customers/change-password`   | ✅  | Bonus: change password    |
| POST   | `/products`                    | ❌  | Create a product          |
| GET    | `/products`                    | ❌  | List (supports `?search=&category=&sort=`) |
| GET    | `/products/:id`                | ❌  | Get one product           |
| POST   | `/wishlist/:productId`         | ✅  | Add to wishlist           |
| GET    | `/wishlist`                    | ✅  | Get current user's wishlist (populated) |
| DELETE | `/wishlist/:productId`         | ✅  | Remove from wishlist      |
| PATCH  | `/wishlist/:productId/toggle`  | ✅  | Bonus: toggle save state  |
| POST   | `/cart/:productId`             | ✅  | Add one unit (increments existing row) |
| GET    | `/cart`                        | ✅  | Get current customer's populated cart |
| PATCH  | `/cart/:productId`             | ✅  | Set quantity, validated against stock |
| DELETE | `/cart/:productId`             | ✅  | Remove cart item and return updated cart |
| POST   | `/orders/create-payment-order` | ✅  | Validate cart and create pending order + Razorpay order |
| POST   | `/orders/verify-payment`       | ✅  | Verify HMAC signature, place order, clear cart |
| GET    | `/orders`                      | ✅  | List current customer's orders |
| GET    | `/orders/:id`                  | ✅  | Get an owned order |

## Postman checks

Import `postman/ShopKart-Lab04.postman_collection.json` into Postman for the
Labs 04–06 API checks. The Lab 06 folder includes checkout, order ownership,
server-side pricing, and payment-signature checks. The successful Razorpay test
payment request is a manual check and requires a real Test Mode checkout.

After login, visit `/products`, add items to the cart, choose **Proceed to
Checkout**, enter shipping details, then complete a Razorpay Test Mode payment.
Use the test credentials and payment methods from the Razorpay test dashboard.
The `/orders` page lists paid and pending orders for the signed-in customer.

## Notes on the viva questions from the lab docs

- **`withCredentials: true`** (in `api.js`) is required so the browser sends
  the HttpOnly cookie on every request — without it, the cookie never leaves
  the browser.
- **JavaScript can't read HttpOnly cookies** — that's the point: it prevents
  XSS attacks from stealing the auth token via `document.cookie`.
- **`/home`, `/products`, `/wishlist` are protected routes** on the frontend
  (`ProtectedRoute` in `App.jsx` redirects to `/login` if `GET /customers/me`
  fails) and the wishlist endpoints are also protected on the backend via
  `auth.middleware.js`.
- **Wishlist stores `ObjectId` references, not copies** — see
  `customer.model.js` (`ref: "Product"`) and `wishlist.controller.js`
  (`populate()` in `getWishlist`). Product price/stock/image can change
  without needing to update anything in the wishlist itself.
- **User identity always comes from the JWT**, never from the request body —
  see `auth.middleware.js`, which decodes the cookie and attaches
  `req.user`, and `wishlist.controller.js`, which uses `req.user._id`
  everywhere.
