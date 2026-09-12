import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { 
  CartIcon, 
  BagIcon, 
  StoreIcon, 
  ShieldIcon, 
  LogoutIcon, 
  MenuIcon, 
  XIcon 
} from "./Icons";
import StatusBadge from "./StatusBadge";

export default function Navbar() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">LS</span>
          <span className="brand-text">LocalShop <span className="brand-cloud">Cloud</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          {!user && (
            <>
              <Link to="/" className={`nav-item ${isActive("/") ? "nav-item-active" : ""}`}>
                Storefront
              </Link>
              <Link to="/login" className={`nav-item ${isActive("/login") ? "nav-item-active" : ""}`}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}

          {user && user.role === "customer" && (
            <>
              <Link to="/" className={`nav-item ${isActive("/") ? "nav-item-active" : ""}`}>
                <StoreIcon size={16} />
                <span>Storefront</span>
              </Link>
              <Link to="/orders" className={`nav-item ${isActive("/orders") ? "nav-item-active" : ""}`}>
                <BagIcon size={16} />
                <span>My Orders</span>
              </Link>
              <Link to="/cart" className={`nav-item nav-cart ${isActive("/cart") ? "nav-item-active" : ""}`}>
                <CartIcon size={16} />
                <span>Cart</span>
                {cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
              </Link>
            </>
          )}

          {user && user.role === "retailer" && (
            <>
              <Link to="/retailer" className={`nav-item ${isActive("/retailer") ? "nav-item-active" : ""}`}>
                <StoreIcon size={16} />
                <span>Retailer Dashboard</span>
              </Link>
              <Link to="/" className={`nav-item ${isActive("/") ? "nav-item-active" : ""}`}>
                <span>Storefront View</span>
              </Link>
            </>
          )}

          {user && user.role === "admin" && (
            <>
              <Link to="/admin" className={`nav-item ${isActive("/admin") ? "nav-item-active" : ""}`}>
                <ShieldIcon size={16} />
                <span>Admin Console</span>
              </Link>
              <Link to="/" className={`nav-item ${isActive("/") ? "nav-item-active" : ""}`}>
                <span>Storefront View</span>
              </Link>
            </>
          )}

          {user && (
            <div className="nav-user-pill">
              <div className="nav-user-info">
                <span className="nav-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                <div className="nav-user-details">
                  <span className="nav-user-name" title={user.name}>{user.name}</span>
                  <StatusBadge status={user.role} size="sm" />
                </div>
              </div>
              <button 
                type="button" 
                className="nav-logout-btn" 
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
              >
                <LogoutIcon size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger button */}
        <button 
          type="button" 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          {!user ? (
            <div className="mobile-menu-links">
              <Link to="/" className={`mobile-nav-item ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>
                Storefront
              </Link>
              <Link to="/login" className={`mobile-nav-item ${isActive("/login") ? "active" : ""}`} onClick={closeMenu}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-block" onClick={closeMenu}>
                Register
              </Link>
            </div>
          ) : (
            <div className="mobile-menu-links">
              <div className="mobile-user-header">
                <span className="nav-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                <div>
                  <div className="font-semibold text-sm">{user.name}</div>
                  <div className="text-muted text-xs">{user.email}</div>
                  <StatusBadge status={user.role} size="sm" />
                </div>
              </div>

              {user.role === "customer" && (
                <>
                  <Link to="/" className={`mobile-nav-item ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>
                    <StoreIcon size={16} />
                    <span>Storefront</span>
                  </Link>
                  <Link to="/orders" className={`mobile-nav-item ${isActive("/orders") ? "active" : ""}`} onClick={closeMenu}>
                    <BagIcon size={16} />
                    <span>My Orders</span>
                  </Link>
                  <Link to="/cart" className={`mobile-nav-item ${isActive("/cart") ? "active" : ""}`} onClick={closeMenu}>
                    <CartIcon size={16} />
                    <span>Cart ({cart.count})</span>
                  </Link>
                </>
              )}

              {user.role === "retailer" && (
                <>
                  <Link to="/retailer" className={`mobile-nav-item ${isActive("/retailer") ? "active" : ""}`} onClick={closeMenu}>
                    <StoreIcon size={16} />
                    <span>Retailer Dashboard</span>
                  </Link>
                  <Link to="/" className={`mobile-nav-item ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>
                    <span>Storefront View</span>
                  </Link>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <Link to="/admin" className={`mobile-nav-item ${isActive("/admin") ? "active" : ""}`} onClick={closeMenu}>
                    <ShieldIcon size={16} />
                    <span>Admin Console</span>
                  </Link>
                  <Link to="/" className={`mobile-nav-item ${isActive("/") ? "active" : ""}`} onClick={closeMenu}>
                    <span>Storefront View</span>
                  </Link>
                </>
              )}

              <button type="button" className="btn btn-secondary btn-block" onClick={handleLogout} style={{ marginTop: "12px" }}>
                <LogoutIcon size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
