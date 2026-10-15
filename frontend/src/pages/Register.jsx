import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.password || form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (ev) => setForm({ ...form, [field]: ev.target.value });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await registerCustomer(form);
      navigate("/login");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
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
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>

        {serverError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={handleChange("fullName")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
