import React from "react";
import { Link } from "react-router-dom";

export default function Home({ user }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.fullName} 👋
        </h1>
        <p className="text-gray-500 mb-8">Here's your ShopKart profile</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{user?.fullName}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{user?.phone}</p>
          </div>
        </div>

        <Link
          to="/products"
          className="inline-block px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
