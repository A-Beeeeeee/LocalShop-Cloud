import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import InvoiceModal from "../components/InvoiceModal";
import MapNavigationModal from "../components/MapNavigationModal";
import { 
  BikeIcon, 
  PackageIcon, 
  MapPinIcon, 
  PhoneIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  RefreshCwIcon, 
  KeyIcon, 
  TruckIcon, 
  StoreIcon, 
  ReceiptIcon,
  ShieldCheckIcon,
  ZapIcon,
  NavigationIcon,
  CompassIcon,
  ExternalLinkIcon,
  AlertTriangleIcon
} from "../components/Icons";

export default function DeliveryDashboard() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("active"); // "active" | "available" | "history"
  const [stats, setStats] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Online / Offline state
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Map Navigation Modal state
  const [selectedOrderForMap, setSelectedOrderForMap] = useState(null);
  const [initialMapTarget, setInitialMapTarget] = useState("customer");

  // OTP Verification Modal state
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Invoice Modal state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Action in progress state
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      const [statsData, availableData, myOrdersData] = await Promise.all([
        api.getDeliveryDashboard(),
        api.getAvailableDeliveries(),
        api.getMyDeliveries(),
      ]);
      setStats(statsData);
      setIsAvailable(statsData?.isAvailable ?? true);
      setAvailableOrders(Array.isArray(availableData) ? availableData : []);
      setMyOrders(Array.isArray(myOrdersData) ? myOrdersData : []);
    } catch (err) {
      setError(err.message || "Failed to load delivery data");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAvailability() {
    setTogglingStatus(true);
    try {
      const nextStatus = !isAvailable;
      const res = await api.toggleDeliveryAvailability(nextStatus);
      setIsAvailable(res.isAvailable);
      updateUser({ isAvailable: res.isAvailable });
      showToast(
        res.isAvailable ? "You are now ONLINE. New pickup tasks will appear." : "You are now OFFLINE.",
        res.isAvailable ? "success" : "info"
      );
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to toggle status", "error");
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleAcceptTask(orderId) {
    setProcessingOrderId(orderId);
    try {
      await api.acceptDelivery(orderId);
      showToast("Delivery task accepted! Proceed to the local store for pickup.", "success");
      setActiveTab("active");
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to accept task", "error");
    } finally {
      setProcessingOrderId(null);
    }
  }

  async function handleMarkPickedUp(orderId) {
    setProcessingOrderId(orderId);
    try {
      await api.pickupDelivery(orderId);
      showToast("Order marked as Picked Up! Head to the customer's delivery address.", "success");
      loadDashboardData();
    } catch (err) {
      showToast(err.message || "Failed to update pickup status", "error");
    } finally {
      setProcessingOrderId(null);
    }
  }

  function openOtpModal(order) {
    setSelectedOrderForOtp(order);
    setEnteredOtp("");
    setOtpError("");
  }

  async function handleVerifyOtpSubmit(e) {
    e.preventDefault();
    if (!selectedOrderForOtp || !enteredOtp.trim()) return;

    if (enteredOtp.trim().length !== 4) {
      setOtpError("Please enter the complete 4-digit OTP provided by the customer.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await api.verifyDeliveryOtp(selectedOrderForOtp._id, enteredOtp.trim());
      showToast(`Delivery confirmed! ₹${res.earningsAdded || 40} credited to your earnings.`, "success");
      setSelectedOrderForOtp(null);
      loadDashboardData();
    } catch (err) {
      setOtpError(err.message || "Invalid Delivery OTP. Please ask the customer to check their screen.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handleViewInvoice(order) {
    setSelectedInvoiceOrder(order);
    setIsInvoiceModalOpen(true);
  }

  function openMapModal(order, target = "customer") {
    setSelectedOrderForMap(order);
    setInitialMapTarget(target);
  }

  function getStoreAddress(order) {
    const retailer = order?.items?.[0]?.retailer;
    const storeName = retailer?.shopName || retailer?.name || "Local Retail Merchant";
    if (retailer?.addresses && retailer.addresses.length > 0) {
      const addr = retailer.addresses[0];
      return `${addr.flat || ""}, ${addr.area || ""}, ${addr.city || "Chennai"} ${addr.pincode || ""}`.trim();
    }
    return `${storeName}, Local Merchant, Chennai`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const activeDeliveries = myOrders.filter(
    (o) => o.deliveryStatus === "assigned" || o.deliveryStatus === "out_for_delivery" || o.deliveryStatus === "picked_up"
  );
  const completedDeliveries = myOrders.filter((o) => o.deliveryStatus === "delivered");

  return (
    <div className="page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <div className="flex-center gap-2">
            <h1 className="page-title">Delivery Partner Console</h1>
            <span className="badge badge-delivery text-xs flex-center gap-1">
              <BikeIcon size={12} />
              <span>{user?.vehicleType || "Bike"} • {user?.vehicleNumber || "Rider"}</span>
            </span>
          </div>
          <p className="page-subtitle">Accept local pickup tasks, navigate to customers, and verify doorstep OTPs</p>
        </div>

        <div className="flex-center gap-2">
          {/* Online / Offline Switch */}
          <button
            type="button"
            className={`btn btn-sm ${isAvailable ? "btn-primary" : "btn-secondary"}`}
            onClick={handleToggleAvailability}
            disabled={togglingStatus}
            style={{
              backgroundColor: isAvailable ? "var(--color-primary)" : "#64748b",
              borderColor: isAvailable ? "var(--color-primary)" : "#64748b",
              color: "#ffffff",
              padding: "4px 12px"
            }}
          >
            <span className="badge-dot" style={{ backgroundColor: "#ffffff" }} />
            <span>{isAvailable ? "Online (Accepting Tasks)" : "Offline (Paused)"}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCwIcon size={13} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "10px" }}>
          <p>{error}</p>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-icon-wrap stat-icon-primary">₹</span>
          </div>
          <p className="stat-value">₹{stats?.earnings ?? user?.earnings ?? 0}</p>
          <p className="stat-meta">₹40 per verified delivery</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Tasks</span>
            <span className="stat-icon-wrap stat-icon-info">
              <TruckIcon size={14} />
            </span>
          </div>
          <p className="stat-value text-primary">{activeDeliveries.length}</p>
          <p className="stat-meta">In transit / picked up</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Completed Deliveries</span>
            <span className="stat-icon-wrap stat-icon-success">
              <CheckCircleIcon size={14} />
            </span>
          </div>
          <p className="stat-value text-success">{completedDeliveries.length}</p>
          <p className="stat-meta">Doorstep OTP verified</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Available Pool</span>
            <span className="stat-icon-wrap stat-icon-warning">
              <PackageIcon size={14} />
            </span>
          </div>
          <p className="stat-value text-warning">{availableOrders.length}</p>
          <p className="stat-meta">Ready for pickup in locality</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar" role="tablist" style={{ marginTop: "12px" }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "active"}
          className={`tab-btn ${activeTab === "active" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <TruckIcon size={14} />
          Active Deliveries ({activeDeliveries.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "available"}
          className={`tab-btn ${activeTab === "available" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          <PackageIcon size={14} />
          Available Pickup Tasks ({availableOrders.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "history"}
          className={`tab-btn ${activeTab === "history" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <CheckCircleIcon size={14} />
          Completed History ({completedDeliveries.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE DELIVERIES */}
      {activeTab === "active" && (
        <div className="tab-content">
          {activeDeliveries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <BikeIcon size={26} />
              </div>
              <h2 className="empty-title">No Active Delivery Tasks</h2>
              <p className="empty-sub">
                You do not have any orders in transit right now. Check the "Available Pickup Tasks" tab to claim orders from local stores.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: "12px" }}
                onClick={() => setActiveTab("available")}
              >
                View Available Orders
              </button>
            </div>
          ) : (
            <div className="card-stack">
              {activeDeliveries.map((order) => {
                const isPickedUp = order.deliveryStatus === "out_for_delivery" || order.deliveryStatus === "picked_up";
                const isCOD = order.paymentMethod === "cod";

                return (
                  <div key={order._id} className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
                    <div className="order-header">
                      <div className="order-header-meta">
                        <div className="order-id">
                          <span className="order-id-label">Order</span>
                          <span className="order-id-val">#{order._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="order-meta-item">
                          <ClockIcon size={12} />
                          <span>Placed: {formatDate(order.createdAt)}</span>
                        </div>
                        <StatusBadge 
                          status={isPickedUp ? "out_for_delivery" : "assigned"} 
                          label={isPickedUp ? "Out for Delivery" : "Claimed • Head to Store"}
                          size="sm"
                        />
                      </div>

                      <div className="flex-center gap-2">
                        <span className="badge badge-success text-xs font-bold" style={{ padding: "3px 8px" }}>
                          + ₹40 Payout
                        </span>
                        <div className="order-total-badge">
                          <span className="order-total-label">Bill</span>
                          <span className="order-total-val">₹{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Delivery Route Card */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "12px 0" }}>
                      {/* Step A: Store Pickup Point */}
                      <div style={{
                        backgroundColor: "var(--color-surface-subtle)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px"
                      }}>
                        <div className="flex-between" style={{ marginBottom: "6px" }}>
                          <span className="text-xs font-bold uppercase flex-center gap-1" style={{ color: "#0284c7" }}>
                            <StoreIcon size={13} />
                            <span>1. Store Pickup Point</span>
                          </span>
                          <span className={`badge ${isPickedUp ? "badge-success" : "badge-warning"} text-xs`} style={{ fontSize: "10px" }}>
                            {isPickedUp ? "Picked Up" : "Awaiting Pickup"}
                          </span>
                        </div>
                        <div className="font-semibold text-xs">
                          {order.items?.[0]?.retailer?.shopName || order.items?.[0]?.retailer?.name || "Local Neighborhood Merchant"}
                        </div>
                        <div className="text-muted text-xs truncate" style={{ margin: "2px 0" }} title={getStoreAddress(order)}>
                          {getStoreAddress(order)}
                        </div>
                        <div className="text-muted text-xs" style={{ margin: "2px 0 6px" }}>
                          <strong>Items:</strong> {order.items?.length} item(s) • {order.items?.map(i => `${i.qty}x ${i.name}`).join(", ")}
                        </div>

                        {/* Store Navigation and Call Controls */}
                        <div className="flex-between flex-wrap gap-1" style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "6px" }}>
                          <div className="flex-center gap-1">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(getStoreAddress(order))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 7px", fontSize: "10.5px", color: "#0284c7" }}
                              title="Open store location in Google Maps"
                            >
                              <NavigationIcon size={11} />
                              <span>Google Maps</span>
                              <ExternalLinkIcon size={9} />
                            </a>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "2px 6px", fontSize: "10px" }}
                              onClick={() => openMapModal(order, "store")}
                              title="View in interactive map"
                            >
                              <CompassIcon size={11} />
                              <span>In-App</span>
                            </button>
                          </div>

                          {order.items?.[0]?.retailer?.phone && (
                            <a href={`tel:${order.items[0].retailer.phone}`} className="btn btn-secondary btn-sm" style={{ padding: "2px 7px", fontSize: "10.5px" }}>
                              <PhoneIcon size={10} /> Call Store
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Step B: Customer Dropoff Point */}
                      <div style={{
                        backgroundColor: "var(--color-surface-subtle)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px"
                      }}>
                        <div className="flex-between" style={{ marginBottom: "6px" }}>
                          <span className="text-xs font-bold uppercase flex-center gap-1" style={{ color: "var(--color-primary)" }}>
                            <MapPinIcon size={13} />
                            <span>2. Customer Dropoff Point</span>
                          </span>
                          <span className="badge badge-customer text-xs" style={{ fontSize: "10px" }}>
                            {isCOD ? "Collect Cash (COD)" : "Paid Online"}
                          </span>
                        </div>
                        <div className="font-semibold text-xs flex-between">
                          <span>{order.customer?.name || "Customer"}</span>
                          {order.customer?.phone && (
                            <a href={`tel:${order.customer.phone}`} className="btn btn-secondary btn-sm" style={{ padding: "1px 6px", fontSize: "10.5px" }}>
                              <PhoneIcon size={10} /> Call Customer
                            </a>
                          )}
                        </div>
                        <div className="text-muted text-xs font-medium" style={{ margin: "4px 0" }}>
                          <MapPinIcon size={11} style={{ display: "inline", marginRight: "3px" }} />
                          {order.address}
                        </div>
                        <div className="text-muted text-xs" style={{ marginBottom: "6px" }}>
                          {isCOD ? (
                            <span className="text-danger font-bold flex-center gap-1">
                              <AlertTriangleIcon size={11} color="#ef4444" /> Collect ₹{order.totalAmount} in Cash
                            </span>
                          ) : (
                            <span className="text-success font-semibold flex-center gap-1">
                              <CheckCircleIcon size={11} color="#10b981" /> Pre-paid via Razorpay (No cash)
                            </span>
                          )}
                        </div>

                        {/* Customer Navigation Controls */}
                        <div className="flex-between flex-wrap gap-1" style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "6px" }}>
                          <div className="flex-center gap-1">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{ padding: "2px 7px", fontSize: "10.5px" }}
                              title="Open customer doorstep in Google Maps"
                            >
                              <NavigationIcon size={11} />
                              <span>Google Maps</span>
                              <ExternalLinkIcon size={9} />
                            </a>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "2px 6px", fontSize: "10px" }}
                              onClick={() => openMapModal(order, "customer")}
                              title="View in interactive map"
                            >
                              <CompassIcon size={11} />
                              <span>In-App</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rider Action Controls */}
                    <div className="flex-between flex-wrap gap-2" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
                      <div className="flex-center gap-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openMapModal(order, isPickedUp ? "customer" : "store")}
                          style={{ padding: "4px 10px", fontSize: "11px", color: "var(--color-primary)", borderColor: "var(--color-primary-subtle)" }}
                        >
                          <NavigationIcon size={12} />
                          <span>Live GPS Route Map</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewInvoice(order)}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          <ReceiptIcon size={12} />
                          <span>Details</span>
                        </button>
                      </div>

                      <div className="flex-center gap-2">
                        {!isPickedUp ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkPickedUp(order._id)}
                            disabled={processingOrderId === order._id}
                            style={{ padding: "6px 14px" }}
                          >
                            <TruckIcon size={13} />
                            <span>Mark Items Picked Up from Store</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openOtpModal(order)}
                            style={{ 
                              padding: "6px 16px",
                              backgroundColor: "var(--color-primary)",
                              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)"
                            }}
                          >
                            <KeyIcon size={13} />
                            <span>Verify Customer OTP & Deliver</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE PICKUP TASKS */}
      {activeTab === "available" && (
        <div className="tab-content">
          {!isAvailable && (
            <div className="alert alert-warning" style={{ marginBottom: "12px" }}>
              <ZapIcon size={14} />
              <span>You are currently <strong>OFFLINE</strong>. Click the toggle at the top right to go ONLINE and accept new delivery tasks.</span>
            </div>
          )}

          {availableOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <PackageIcon size={26} />
              </div>
              <h2 className="empty-title">No Available Orders in Your Area</h2>
              <p className="empty-sub">
                All current store orders are assigned. Keep your status online to receive alerts when local stores pack new customer orders!
              </p>
            </div>
          ) : (
            <div className="card-stack">
              {availableOrders.map((order) => (
                <div key={order._id} className="card">
                  <div className="order-header">
                    <div className="order-header-meta">
                      <div className="order-id">
                        <span className="order-id-label">Task</span>
                        <span className="order-id-val">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="order-meta-item">
                        <ClockIcon size={12} />
                        <span>Ready since: {formatDate(order.createdAt)}</span>
                      </div>
                      <span className="badge badge-warning text-xs">Ready for Pickup</span>
                    </div>

                    <div className="flex-center gap-2">
                      <span className="badge badge-success text-xs font-bold" style={{ padding: "3px 8px" }}>
                        + ₹40 Payout
                      </span>
                      <div className="order-total-badge">
                        <span className="order-total-label">Bill</span>
                        <span className="order-total-val">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "10px 0" }}>
                    <div style={{ fontSize: "12px" }}>
                      <div className="text-muted text-xs uppercase font-semibold">Store Pickup Point</div>
                      <div className="font-semibold text-xs" style={{ marginTop: "2px" }}>
                        {order.items?.[0]?.retailer?.shopName || order.items?.[0]?.retailer?.name || "Local Retail Partner"}
                      </div>
                      <div className="text-muted text-xs">
                        {order.items?.length} item(s) • ₹{order.totalAmount} value
                      </div>
                    </div>

                    <div style={{ fontSize: "12px" }}>
                      <div className="text-muted text-xs uppercase font-semibold">Customer Delivery Point</div>
                      <div className="font-semibold text-xs" style={{ marginTop: "2px" }}>
                        {order.customer?.name || "Customer"}
                      </div>
                      <div className="text-muted text-xs truncate" title={order.address}>
                        {order.address}
                      </div>
                    </div>
                  </div>

                  <div className="flex-between flex-wrap gap-2" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
                    <div className="text-muted text-xs flex-center gap-2">
                      <div className="flex-center gap-1">
                        <ShieldCheckIcon size={12} color="#10b981" />
                        <span>{order.paymentMethod === "razorpay" ? "Pre-paid Online" : "Cash on Delivery (COD)"}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "2px 6px", fontSize: "10.5px", color: "var(--color-primary)" }}
                        onClick={() => openMapModal(order, "route")}
                        title="Preview route on Google Maps"
                      >
                        <NavigationIcon size={11} />
                        <span>Preview Map</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAcceptTask(order._id)}
                      disabled={processingOrderId === order._id}
                      style={{ padding: "5px 14px" }}
                    >
                      <BikeIcon size={13} />
                      <span>{processingOrderId === order._id ? "Claiming..." : "Accept Delivery Task"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED HISTORY */}
      {activeTab === "history" && (
        <div className="tab-content">
          {completedDeliveries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <CheckCircleIcon size={26} />
              </div>
              <h2 className="empty-title">No Completed Deliveries Yet</h2>
              <p className="empty-sub">Your verified doorstep deliveries and completed earnings will appear here.</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header flex-between">
                <div>
                  <h3 className="card-title">Completed Delivery History</h3>
                  <p className="card-subtitle">Verified deliveries and earnings credit records</p>
                </div>
                <span className="badge badge-success text-xs">
                  Total Earned: ₹{completedDeliveries.length * 40}
                </span>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Delivered Time</th>
                      <th>Customer & Address</th>
                      <th>Items</th>
                      <th>Payment Mode</th>
                      <th style={{ textAlign: "right" }}>Rider Payout</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedDeliveries.map((order) => (
                      <tr key={order._id}>
                        <td className="font-mono text-xs font-bold">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="text-xs">
                          {formatDate(order.deliveredAt || order.updatedAt)}
                        </td>
                        <td>
                          <div className="font-semibold text-xs">{order.customer?.name}</div>
                          <div className="text-muted text-xs truncate" style={{ maxWidth: "200px" }} title={order.address}>
                            {order.address}
                          </div>
                        </td>
                        <td className="text-xs">{order.items?.length} item(s)</td>
                        <td>
                          <span className="badge badge-customer text-xs">
                            {order.paymentMethod === "razorpay" ? "Razorpay" : "COD"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                          + ₹40
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="flex-center gap-1 justify-end">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "2px 6px", fontSize: "11px" }}
                              onClick={() => openMapModal(order, "customer")}
                              title="View delivery route map"
                            >
                              <NavigationIcon size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 6px", fontSize: "11px" }}
                              onClick={() => handleViewInvoice(order)}
                              title="View tax invoice"
                            >
                              <ReceiptIcon size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOORSTEP OTP VERIFICATION MODAL */}
      <Modal
        isOpen={Boolean(selectedOrderForOtp)}
        onClose={() => !verifyingOtp && setSelectedOrderForOtp(null)}
        title="Doorstep Delivery OTP Verification"
        maxWidth="420px"
      >
        <form onSubmit={handleVerifyOtpSubmit}>
          <div style={{
            background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
            color: "#ffffff",
            padding: "12px 14px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "12px"
          }}>
            <div className="flex-between">
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", opacity: 0.85 }}>
                  Customer Handover
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>
                  {selectedOrderForOtp?.customer?.name || "Customer"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="badge badge-success text-xs font-mono">
                  #{selectedOrderForOtp?._id?.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>
            <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPinIcon size={12} />
              <span>{selectedOrderForOtp?.address}</span>
            </div>
          </div>

          {otpError && (
            <div className="alert alert-danger" style={{ marginBottom: "10px" }}>
              <p>{otpError}</p>
            </div>
          )}

          <div className="form-group" style={{ textAlign: "center" }}>
            <label className="form-label" htmlFor="otp-input" style={{ fontSize: "12px", fontWeight: 600 }}>
              Ask Customer for the 4-Digit Delivery Code:
            </label>
            <input
              id="otp-input"
              type="text"
              maxLength="4"
              autoFocus
              className="form-input text-center font-mono font-bold"
              style={{
                fontSize: "24px",
                letterSpacing: "0.3em",
                padding: "8px",
                maxWidth: "180px",
                margin: "6px auto 0"
              }}
              placeholder="••••"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            <p className="text-muted text-xs" style={{ marginTop: "6px" }}>
              Customer can see this code in their "My Orders" screen.
            </p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedOrderForOtp(null)}
              disabled={verifyingOtp}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={verifyingOtp || enteredOtp.length !== 4}
              style={{ padding: "6px 14px" }}
            >
              {verifyingOtp ? (
                <span>Verifying OTP...</span>
              ) : (
                <>
                  <CheckCircleIcon size={13} />
                  <span>Confirm Handover & Complete (₹40)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interactive Google Maps Navigation Modal */}
      <MapNavigationModal
        isOpen={Boolean(selectedOrderForMap)}
        onClose={() => setSelectedOrderForMap(null)}
        order={selectedOrderForMap}
        initialTarget={initialMapTarget}
      />

      {/* Official Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedInvoiceOrder}
      />
    </div>
  );
}
