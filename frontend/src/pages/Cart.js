import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api";

export default function Cart() {
  const cart = useCart();
  const { showToast } = useToast();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  async function handlePlaceOrder() {
    setError("");
    if (cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (!address.trim()) {
      setError("Enter a delivery address");
      return;
    }
    setPlacing(true);
    try {
      await api.placeOrder({
        items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
        address,
      });
      cart.clearCart();
      showToast("Order placed successfully");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p className="empty-title">Your cart is empty</p>
          <p className="empty-sub">Browse the storefront and add something you like.</p>
          <Link to="/" className="primary-btn inline-btn">
            Go to storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card auth-card wide-card">
        <p className="form-title">Your cart</p>
        {error && <p className="error-text">{error}</p>}

        {cart.items.map((item) => (
          <div key={item.productId} className="cart-row">
            <div>
              <p className="cart-item-name">{item.name}</p>
              <p className="muted">₹{item.price} each</p>
            </div>
            <div className="cart-row-right">
              <div className="qty-control">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => cart.decrement(item.productId)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-value">{item.qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => cart.increment(item.productId)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="cart-line-total">₹{item.price * item.qty}</span>
              <button className="link-btn" onClick={() => cart.removeFromCart(item.productId)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="cart-total">
          <span>Total</span>
          <span>₹{cart.total}</span>
        </div>

        <div className="address-section">
          <div className="address-header">
            <span className="address-icon">📍</span>
            <h3 className="address-title">Delivery Address</h3>
          </div>
          <p className="address-hint">Enter where you'd like your order delivered</p>
          <textarea
            className="address-input"
            placeholder="House No., Street Address, Area, City, Postal Code"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows="4"
          />
          <div className="address-char-count">{address.length} characters</div>
        </div>

        <button className="primary-btn" onClick={handlePlaceOrder} disabled={placing}>
          {placing ? "Placing order..." : "Place order"}
        </button>
      </div>
    </div>
  );
}
