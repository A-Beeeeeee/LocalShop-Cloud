import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">LS</span>
        LocalShop Cloud
      </Link>
      <div className="nav-links">
        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="nav-cta">Register</Link>
          </>
        )}
        {user && user.role === "customer" && (
          <>
            <Link to="/">Storefront</Link>
            <Link to="/cart" className="cart-link">
              Cart
              {cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
            </Link>
          </>
        )}
        {user && user.role === "retailer" && <Link to="/retailer">Dashboard</Link>}
        {user && user.role === "admin" && <Link to="/admin">Admin panel</Link>}
        {user && (
          <div className="nav-user">
            <span className="nav-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <button className="link-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
