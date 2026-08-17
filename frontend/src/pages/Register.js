import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", shopName: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.role === "retailer" && !form.shopName) {
      setError("Shop name is required for retailers");
      return;
    }
    try {
      const data = await api.register(form);
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <p className="form-title">Create an account</p>
        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}
        <input placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
        <select value={form.role} onChange={(e) => update("role", e.target.value)}>
          <option value="customer">Customer</option>
          <option value="retailer">Retailer</option>
        </select>
        {form.role === "retailer" && (
          <input
            placeholder="Shop name"
            value={form.shopName}
            onChange={(e) => update("shopName", e.target.value)}
          />
        )}
        <button type="submit" className="primary-btn">Register</button>
        <p className="form-hint">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
