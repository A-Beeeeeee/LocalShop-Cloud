import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { 
  BagIcon, 
  ClockIcon, 
  MapPinIcon, 
  RefreshCwIcon, 
  ArrowRightIcon,
  CreditCardIcon,
  ShieldCheckIcon
} from "../components/Icons";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">Track and review your order history</p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={loadOrders} 
          disabled={loading}
        >
          <RefreshCwIcon size={13} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "10px" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card-stack">
          {[1, 2].map((i) => (
            <div key={i} className="card skeleton-card" style={{ padding: "12px 14px" }}>
              <div className="skeleton" style={{ width: "30%", height: "16px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ width: "60%", height: "12px", marginBottom: "10px" }} />
              <div className="skeleton" style={{ width: "100%", height: "30px" }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <BagIcon size={26} />
          </div>
          <h2 className="empty-title">No orders yet</h2>
          <p className="empty-sub">You haven't placed any orders yet. Discover items from local retailers.</p>
          <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>
            Browse Storefront
            <ArrowRightIcon size={13} />
          </Link>
        </div>
      ) : (
        <div className="card-stack">
          {orders.map((order) => (
            <div key={order._id} className="card order-card">
              <div className="order-header">
                <div className="order-header-meta">
                  <div className="order-id">
                    <span className="order-id-label">Order</span>
                    <span className="order-id-val">#{order._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="order-meta-item">
                    <ClockIcon size={12} />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  {order.address && (
                    <div className="order-meta-item order-address">
                      <MapPinIcon size={12} />
                      <span title={order.address}>{order.address}</span>
                    </div>
                  )}
                  {/* Payment Details Badge */}
                  <div className="order-meta-item" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <CreditCardIcon size={12} color="#2563eb" />
                    <span style={{ fontWeight: 600, fontSize: "11px" }}>
                      {order.paymentMethod === "razorpay" ? (
                        <span className="text-success" title={order.paymentId ? `Transaction: ${order.paymentId}` : "Paid Online"}>
                          Razorpay (Paid) {order.paymentId ? `• ${order.paymentId}` : ""}
                        </span>
                      ) : (
                        <span className="text-muted">Cash on Delivery</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="order-total-badge">
                  <span className="order-total-label">Total</span>
                  <span className="order-total-val">₹{order.totalAmount}</span>
                </div>
              </div>


              <div className="table-wrapper" style={{ marginTop: "6px" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ width: "60px", textAlign: "center" }}>Qty</th>
                      <th style={{ width: "90px", textAlign: "right" }}>Unit Price</th>
                      <th style={{ width: "90px", textAlign: "right" }}>Subtotal</th>
                      <th style={{ width: "110px", textAlign: "center" }}>Item Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-medium text-xs">{item.name}</td>
                        <td style={{ textAlign: "center" }}>{item.qty}</td>
                        <td style={{ textAlign: "right" }}>₹{item.price}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>₹{item.price * item.qty}</td>
                        <td style={{ textAlign: "center" }}>
                          <StatusBadge status={item.status || "pending"} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
