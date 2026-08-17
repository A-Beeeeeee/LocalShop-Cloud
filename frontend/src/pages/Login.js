import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter email and password");
      return;
    }
    try {
      const data = await api.login({ email, password });
      login(data.token, data.user);
      if (data.user.role === "retailer") navigate("/retailer");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <p className="form-title">Log in</p>
        {error && <p className="error-text">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="primary-btn">Log in</button>
        <p className="form-hint">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
