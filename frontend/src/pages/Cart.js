import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api";
import { 
  CartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  MapPinIcon, 
  ArrowRightIcon, 
  PackageIcon, 
  CheckCircleIcon 
} from "../components/Icons";

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
      setError("Please enter a valid delivery address");
      return;
    }
    setPlacing(true);
    try {
      await api.placeOrder({
        items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
        address: address.trim(),
      });
      cart.clearCart();
      showToast("Order placed successfully! Track it in My Orders.", "success");
      setTimeout(() => navigate("/orders"), 600);
    } catch (err) {
      setError(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <CartIcon size={32} />
          </div>
          <h2 className="empty-title">Your shopping cart is empty</h2>
          <p className="empty-sub">Browse our cloud storefront catalog to add items to your cart.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: "16px" }}>
            Browse Storefront
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">Review items and provide your delivery details</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-danger"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear your cart?")) {
              cart.clearCart();
            }
          }}
        >
          <TrashIcon size={14} />
          Clear Cart
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
          <p>{error}</p>
        </div>
      )}

      <div className="checkout-layout">
        {/* Left Column: Cart Items */}
        <div className="checkout-items-col">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Cart Items ({cart.count})</h2>
            </div>
            <div className="cart-items-list">
              {cart.items.map((item) => (
                <div key={item.productId} className="cart-item-row">
                  <div className="cart-item-info">
                    <div className="cart-item-icon">
                      <PackageIcon size={18} />
                    </div>
                    <div>
                      <h4 className="cart-item-name">{item.name}</h4>
                      <span className="cart-item-unit-price">₹{item.price} each</span>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-control" role="group" aria-label="Quantity selector">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => cart.decrement(item.productId)}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon size={12} />
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => cart.increment(item.productId)}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon size={12} />
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      ₹{item.price * item.qty}
                    </div>

                    <button
                      type="button"
                      className="btn-icon text-muted"
                      onClick={() => cart.removeFromCart(item.productId)}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Address & Summary */}
        <div className="checkout-summary-col">
          {/* Delivery Address Card */}
          <div className="card">
            <div className="card-header">
              <div className="flex-center gap-2">
                <MapPinIcon size={16} />
                <h3 className="card-title">Delivery Address</h3>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "8px" }}>
              <label htmlFor="delivery-address" className="form-label">
                Full Street Address
              </label>
              <textarea
                id="delivery-address"
                className="form-input form-textarea"
                placeholder="House / Flat No., Street, Area, City, Postal Code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="text-muted text-xs text-right">
              {address.length} characters
            </div>
          </div>

          {/* Order Calculation Card */}
          <div className="card" style={{ marginTop: "16px" }}>
            <div className="card-header">
              <h3 className="card-title">Order Summary</h3>
            </div>
            
            <div className="summary-row">
              <span className="text-muted">Subtotal ({cart.count} items)</span>
              <span className="font-semibold">₹{cart.total}</span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Estimated Delivery</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-total-row">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-primary summary-total-price">₹{cart.total}</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: "16px" }}
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? (
                <span>Placing order...</span>
              ) : (
                <>
                  <CheckCircleIcon size={16} />
                  <span>Place Order (₹{cart.total})</span>
                </>
              )}
            </button>

            <p className="text-muted text-xs text-center" style={{ marginTop: "12px" }}>
              Secure cloud transaction. No payment info stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
