import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { EyeIcon, EyeOffIcon, AlertCircleIcon, CheckCircleIcon, ArrowRightIcon, StoreIcon, UserIcon, BikeIcon } from "../components/Icons";

export default function Register() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    role: "customer", 
    shopName: "",
    vehicleType: "Bike",
    vehicleNumber: ""
  });
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
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (form.role === "retailer" && !form.shopName.trim()) {
      setError("Shop name is required for retailer accounts.");
      return;
    }
    if (form.role === "delivery" && !form.vehicleNumber.trim()) {
      setError("Vehicle registration number is required for delivery partners.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: cleanPhone,
        password: form.password,
        role: form.role,
        shopName: form.role === "retailer" ? form.shopName.trim() : undefined,
        vehicleType: form.role === "delivery" ? form.vehicleType : undefined,
        vehicleNumber: form.role === "delivery" ? form.vehicleNumber.trim() : undefined,
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
          <span className="brand-mark" style={{ margin: "0 auto 8px" }}>LS</span>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join the LocalShop Cloud retail platform</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "10px" }}>
            <AlertCircleIcon size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: "10px" }}>
            <CheckCircleIcon size={14} />
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
              <UserIcon size={13} />
              <span>Customer</span>
            </button>
            <button
              type="button"
              className={`role-option-btn ${form.role === "retailer" ? "active" : ""}`}
              onClick={() => update("role", "retailer")}
            >
              <StoreIcon size={13} />
              <span>Retailer</span>
            </button>
            <button
              type="button"
              className={`role-option-btn ${form.role === "delivery" ? "active" : ""}`}
              onClick={() => update("role", "delivery")}
            >
              <BikeIcon size={14} />
              <span>Delivery</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              required
              className="form-input"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          {form.role === "retailer" && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-shopname">Shop / Business Name</label>
              <input
                id="reg-shopname"
                type="text"
                required
                className="form-input"
                placeholder="Enter shop/business name"
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
            </div>
          )}

          {form.role === "delivery" && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-vehicle-type">Vehicle Type</label>
                <select
                  id="reg-vehicle-type"
                  className="form-select"
                  value={form.vehicleType}
                  onChange={(e) => update("vehicleType", e.target.value)}
                >
                  <option value="Bike">Motorcycle / Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Van">Delivery Van</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-vehicle-num">Vehicle Reg. No.</label>
                <input
                  id="reg-vehicle-num"
                  type="text"
                  required
                  className="form-input font-mono uppercase"
                  placeholder="e.g. TN-09-AB-1234"
                  value={form.vehicleNumber}
                  onChange={(e) => update("vehicleNumber", e.target.value.toUpperCase())}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">10-Digit Mobile Number</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{
                padding: "6px 10px",
                backgroundColor: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center"
              }}>
                +91
              </span>
              <input
                id="reg-phone"
                type="tel"
                maxLength="10"
                required
                className="form-input"
                placeholder="Enter 10-digit mobile number"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: "2px" }}>
              <label className="form-label" htmlFor="reg-password" style={{ margin: 0 }}>Password</label>
            </div>
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
                {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: "12px", padding: "7px 12px" }}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRightIcon size={13} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered? </span>
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
