import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import OrderTrackingStepper from "../components/OrderTrackingStepper";
import InvoiceModal from "../components/InvoiceModal";
import { 
  BagIcon, 
  ClockIcon, 
  MapPinIcon, 
  RefreshCwIcon, 
  ArrowRightIcon,
  CreditCardIcon,
  XIcon,
  CheckIcon,
  ReceiptIcon
} from "../components/Icons";

const RETURN_REASONS = [
  "Damaged or defective item received",
  "Wrong item or size delivered",
  "Product quality not as expected",
  "Expired or spoiled product",
  "Item missing from package",
  "Other / Customer preference"
];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  // Cancellation and Return modal states
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState(null); // { orderId, item }
  const [selectedReason, setSelectedReason] = useState(RETURN_REASONS[0]);
  const [additionalComments, setAdditionalComments] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Invoice modal state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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

  async function handleCancelEntireOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this entire order? If paid online via Razorpay, a full refund will be processed immediately.")) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      await api.cancelOrder(orderId, { reason: "Customer cancelled before dispatch" });
      showToast("Order cancelled successfully. Any online payment has been refunded!", "success");
      loadOrders();
    } catch (err) {
      showToast(err.message || "Failed to cancel order", "error");
    } finally {
      setCancellingOrderId(null);
    }
  }

  function openReturnModal(orderId, item) {
    setReturnItem({ orderId, item });
    setSelectedReason(RETURN_REASONS[0]);
    setAdditionalComments("");
    setIsReturnModalOpen(true);
  }

  async function handleSubmitReturn(e) {
    e.preventDefault();
    if (!returnItem) return;

    setSubmittingReturn(true);
    try {
      const reasonText = additionalComments.trim() 
        ? `${selectedReason}: ${additionalComments.trim()}` 
        : selectedReason;

      await api.requestReturn(returnItem.orderId, {
        productId: returnItem.item.product,
        reason: reasonText,
      });

      showToast("Return and refund request submitted! Retailer will review shortly.", "success");
      setIsReturnModalOpen(false);
      loadOrders();
    } catch (err) {
      showToast(err.message || "Failed to submit return request", "error");
    } finally {
      setSubmittingReturn(false);
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

  function handleViewInvoice(order) {
    setSelectedInvoiceOrder(order);
    setIsInvoiceModalOpen(true);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">Track, manage, cancel orders or request returns & refunds</p>
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
          {orders.map((order) => {
            const hasPendingItems = order.items?.some((i) => i.status === "pending");
            const allItemsCancelled = order.items?.every((i) => i.status === "cancelled");
            const hasRefundProcessed = order.refundStatus === "processed";

            return (
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

                    {/* Refund Badge if applicable */}
                    {hasRefundProcessed && (
                      <span className="badge badge-retailer text-xs" style={{ fontSize: "10px", padding: "1px 5px" }}>
                        ₹{order.refundAmount || order.totalAmount} Refunded
                      </span>
                    )}
                  </div>

                  <div className="flex-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "3px 8px", fontSize: "11px" }}
                      onClick={() => handleViewInvoice(order)}
                      title="View and print tax invoice"
                    >
                      <ReceiptIcon size={12} />
                      <span>Invoice</span>
                    </button>

                    <div className="order-total-badge">
                      <span className="order-total-label">Total</span>
                      <span className="order-total-val">₹{order.totalAmount}</span>
                    </div>

                    {/* Cancel Whole Order Button if pending and not already cancelled */}
                    {hasPendingItems && !allItemsCancelled && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        style={{ padding: "3px 8px", fontSize: "11px", borderColor: "var(--color-danger-border)" }}
                        onClick={() => handleCancelEntireOrder(order._id)}
                        disabled={cancellingOrderId === order._id}
                        title="Cancel this order"
                      >
                        <XIcon size={12} />
                        <span>{cancellingOrderId === order._id ? "Cancelling..." : "Cancel Order"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Real-time Visual Order Tracking Stepper */}
                <OrderTrackingStepper order={order} />

                <div className="table-wrapper" style={{ marginTop: "6px" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ width: "60px", textAlign: "center" }}>Qty</th>
                        <th style={{ width: "80px", textAlign: "right" }}>Price</th>
                        <th style={{ width: "90px", textAlign: "right" }}>Subtotal</th>
                        <th style={{ width: "120px", textAlign: "center" }}>Status</th>
                        <th style={{ width: "130px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="font-medium text-xs">{item.name}</div>
                            {item.returnReason && (
                              <div className="text-muted text-xs" style={{ fontSize: "10px", color: "var(--color-warning-text)" }}>
                                Reason: {item.returnReason}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>{item.qty}</td>
                          <td style={{ textAlign: "right" }}>₹{item.price}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>₹{item.price * item.qty}</td>
                          <td style={{ textAlign: "center" }}>
                            <StatusBadge status={item.status || "pending"} size="sm" />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {item.status === "fulfilled" && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "2px 6px", fontSize: "10px" }}
                                onClick={() => openReturnModal(order._id, item)}
                                title="Request return or refund"
                              >
                                Return / Refund
                              </button>
                            )}
                            {item.status === "return_requested" && (
                              <span className="text-muted text-xs" style={{ fontSize: "10px" }}>
                                Under Review
                              </span>
                            )}
                            {item.status === "refunded" && (
                              <span className="text-success text-xs font-semibold" style={{ fontSize: "10px" }}>
                                <CheckIcon size={11} /> Refunded
                              </span>
                            )}
                            {item.status === "cancelled" && (
                              <span className="text-muted text-xs" style={{ fontSize: "10px" }}>
                                Cancelled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOMER RETURN / REFUND MODAL */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => !submittingReturn && setIsReturnModalOpen(false)}
        title="Request Return / Refund"
        maxWidth="450px"
      >
        <form onSubmit={handleSubmitReturn}>
          {returnItem && (
            <div style={{
              backgroundColor: "var(--color-surface-subtle)",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div className="font-semibold text-xs">{returnItem.item.name}</div>
                <div className="text-muted text-xs">Qty: {returnItem.item.qty} • ₹{returnItem.item.price * returnItem.item.qty}</div>
              </div>
              <span className="badge badge-primary text-xs" style={{ fontSize: "10px" }}>
                Eligible for Return
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="return-reason">Reason for Return *</label>
            <select
              id="return-reason"
              className="form-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              required
            >
              {RETURN_REASONS.map((reason, idx) => (
                <option key={idx} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="return-notes">Additional Details (Optional)</label>
            <textarea
              id="return-notes"
              className="form-input form-textarea"
              rows={2}
              placeholder="Describe the issue with the product..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
            />
          </div>

          <div style={{
            backgroundColor: "var(--color-primary-subtle)",
            padding: "8px 10px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "12px",
            fontSize: "11px",
            color: "var(--color-primary)"
          }}>
            Once approved by the retailer, your refund will be automatically processed back to your original payment mode (Razorpay / Store Credit).
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsReturnModalOpen(false)}
              disabled={submittingReturn}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submittingReturn}
            >
              {submittingReturn ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedInvoiceOrder}
      />
    </div>
  );
}

