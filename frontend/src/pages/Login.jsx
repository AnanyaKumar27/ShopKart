import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginCustomer, getMe } from "../services/api";

export default function Login({ setUser }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (field) => (ev) => setForm({ ...form, [field]: ev.target.value });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginCustomer(form);
      const res = await getMe();
      setUser(res.data);
      navigate("/home");
    } catch (err) {
      setError("Invalid Credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 font-medium">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
