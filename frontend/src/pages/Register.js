import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { EyeIcon, EyeOffIcon, AlertCircleIcon, CheckCircleIcon, ArrowRightIcon, StoreIcon, UserIcon } from "../components/Icons";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", shopName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.role === "retailer" && !form.shopName.trim()) {
      setError("Shop name is required for retailer accounts.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        shopName: form.role === "retailer" ? form.shopName.trim() : undefined,
      });
      setSuccess(data.message || "Account registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="brand-mark" style={{ margin: "0 auto 12px" }}>LS</span>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join the LocalShop Cloud retail platform</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
            <AlertCircleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: "16px" }}>
            <CheckCircleIcon size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Switcher */}
          <div className="role-selector-group" role="radiogroup" aria-label="Account Role">
            <button
              type="button"
              className={`role-option-btn ${form.role === "customer" ? "active" : ""}`}
              onClick={() => update("role", "customer")}
            >
              <UserIcon size={16} />
              <span>Customer</span>
            </button>
            <button
              type="button"
              className={`role-option-btn ${form.role === "retailer" ? "active" : ""}`}
              onClick={() => update("role", "retailer")}
            >
              <StoreIcon size={16} />
              <span>Retailer</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              required
              className="form-input"
              placeholder="e.g. Alex Kumar"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              className="form-input"
              placeholder="alex@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                className="form-input password-input"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          {form.role === "retailer" && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-shop">Shop / Store Name *</label>
              <input
                id="reg-shop"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Fresh Daily Supermarket"
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
              <span className="text-muted text-xs">Retailers require approval by admin before selling.</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: "20px" }}
          >
            {loading ? "Creating account..." : "Complete Registration"}
            <ArrowRightIcon size={14} />
          </button>
        </form>

        <div className="auth-footer">
          Already registered? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
