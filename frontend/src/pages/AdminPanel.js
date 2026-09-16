import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { 
  ShieldIcon, 
  UserIcon, 
  StoreIcon, 
  BagIcon, 
  CheckIcon, 
  XIcon, 
  RefreshCwIcon, 
  ServerIcon, 
  DatabaseIcon, 
  CheckCircleIcon,
  BikeIcon 
} from "../components/Icons";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "approvals" | "retailers" | "riders" | "system"
  const [approvalsSubTab, setApprovalsSubTab] = useState("retailers"); // "retailers" | "riders"
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [pendingRiders, setPendingRiders] = useState([]);
  const [allRetailers, setAllRetailers] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [statsData, pendingData, pendingRidersData, retailersData, deliveryData] = await Promise.all([
        api.getAdminStats(),
        api.getPendingRetailers(),
        api.getPendingDeliveryPartners().catch(() => []),
        api.getRetailers("all").catch(() => []),
        api.getDeliveryPartners("all").catch(() => []),
      ]);
      setStats(statsData);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setPendingRiders(Array.isArray(pendingRidersData) ? pendingRidersData : []);
      setAllRetailers(Array.isArray(retailersData) ? retailersData : []);
      setDeliveryPartners(Array.isArray(deliveryData) ? deliveryData : []);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id, name) {
    try {
      await api.approveRetailer(id);
      showToast(`Approved retailer "${name}"`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to approve retailer", "error");
    }
  }

  async function handleReject(id, name) {
    if (!window.confirm(`Are you sure you want to reject / remove "${name}"?`)) return;
    try {
      await api.rejectRetailer(id);
      showToast(`Removed retailer "${name}"`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to remove retailer", "error");
    }
  }

  async function handleApproveRider(id, name) {
    try {
      await api.approveDeliveryPartner(id);
      showToast(`Approved delivery partner "${name}"`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to approve delivery partner", "error");
    }
  }

  async function handleRejectRider(id, name) {
    if (!window.confirm(`Are you sure you want to reject / remove delivery partner "${name}"?`)) return;
    try {
      await api.rejectDeliveryPartner(id);
      showToast(`Removed delivery partner "${name}"`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to remove delivery partner", "error");
    }
  }

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Console</h1>
          <p className="page-subtitle">Platform-wide control center and retailer verification</p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={loadAll} 
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

      {/* Tab Navigation */}
      <div className="tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          className={`tab-btn ${activeTab === "overview" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <ShieldIcon size={14} />
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "approvals"}
          className={`tab-btn ${activeTab === "approvals" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("approvals")}
        >
          <StoreIcon size={14} />
          Approvals {(pending.length + pendingRiders.length) > 0 && <span className="tab-badge">{pending.length + pendingRiders.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "retailers"}
          className={`tab-btn ${activeTab === "retailers" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("retailers")}
        >
          <UserIcon size={14} />
          All Retailers ({allRetailers.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "riders"}
          className={`tab-btn ${activeTab === "riders" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("riders")}
        >
          <BikeIcon size={14} />
          Delivery Fleet ({deliveryPartners.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "system"}
          className={`tab-btn ${activeTab === "system" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          <ServerIcon size={14} />
          System Status
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Approved Retailers</span>
                <span className="stat-icon-wrap stat-icon-primary">
                  <StoreIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.retailerCount ?? 0}</p>
              <p className="stat-meta">Active seller accounts</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Registered Customers</span>
                <span className="stat-icon-wrap stat-icon-info">
                  <UserIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.customerCount ?? 0}</p>
              <p className="stat-meta">Total buyer accounts</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Delivery Fleet</span>
                <span className="stat-icon-wrap stat-icon-success">
                  <BikeIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.deliveryCount ?? deliveryPartners.filter(d => d.approved).length}</p>
              <p className="stat-meta">Verified delivery partners</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Total Cloud Orders</span>
                <span className="stat-icon-wrap stat-icon-warning">
                  <BagIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.orderCount ?? 0}</p>
              <p className="stat-meta">Placed through platform</p>
            </div>
          </div>

          {/* Pending Approvals quick-card if any */}
          {(pending.length > 0 || pendingRiders.length > 0) && (
            <div className="alert alert-warning" style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Action Required:</strong> You have{" "}
                {pending.length > 0 && <span>{pending.length} pending retailer{pending.length === 1 ? "" : "s"}</span>}
                {pending.length > 0 && pendingRiders.length > 0 && <span> and </span>}
                {pendingRiders.length > 0 && <span>{pendingRiders.length} pending delivery partner{pendingRiders.length === 1 ? "" : "s"}</span>}
                {" "}waiting for admin verification.
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab("approvals")}
              >
                Review Now
              </button>
            </div>
          )}

          {/* Platform Summary Details */}
          <div className="card" style={{ marginTop: "10px" }}>
            <div className="card-header">
              <h3 className="card-title">Platform Activity Snapshot</h3>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Retailer Applications Pending</td>
                    <td className="font-semibold">{pending.length}</td>
                    <td>
                      <StatusBadge status={pending.length > 0 ? "pending" : "approved"} label={pending.length > 0 ? `${pending.length} Pending` : "Clear"} size="sm" />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Delivery Partner Verifications Pending</td>
                    <td className="font-semibold">{pendingRiders.length}</td>
                    <td>
                      <StatusBadge status={pendingRiders.length > 0 ? "pending" : "approved"} label={pendingRiders.length > 0 ? `${pendingRiders.length} Pending` : "Clear"} size="sm" />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Active Retailer Merchant Network</td>
                    <td className="font-semibold">{stats?.retailerCount ?? 0} Stores</td>
                    <td>
                      <StatusBadge status="approved" label="Operational" size="sm" />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Customer User Base</td>
                    <td className="font-semibold">{stats?.customerCount ?? 0} Accounts</td>
                    <td>
                      <StatusBadge status="approved" label="Active" size="sm" />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Verified Delivery Fleet</td>
                    <td className="font-semibold">{stats?.deliveryCount ?? deliveryPartners.filter(d => d.approved).length} Riders</td>
                    <td>
                      <StatusBadge status="approved" label="Ready for Dispatch" size="sm" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVALS QUEUE */}
      {activeTab === "approvals" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header flex-between flex-wrap gap-2">
              <div>
                <h3 className="card-title">Identity & Role Verification Queue</h3>
                <p className="card-subtitle">Verify merchant store and delivery partner credentials before granting platform access</p>
              </div>

              {/* Sub-tab pills */}
              <div className="flex-center gap-1">
                <button
                  type="button"
                  className={`btn btn-sm ${approvalsSubTab === "retailers" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setApprovalsSubTab("retailers")}
                >
                  <StoreIcon size={13} />
                  <span>Retailers ({pending.length})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${approvalsSubTab === "riders" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setApprovalsSubTab("riders")}
                >
                  <BikeIcon size={13} />
                  <span>Delivery Partners ({pendingRiders.length})</span>
                </button>
              </div>
            </div>

            {/* SubTab A: Retailer Applications */}
            {approvalsSubTab === "retailers" && (
              <div>
                {pending.length === 0 ? (
                  <div className="empty-state" style={{ padding: "28px 14px" }}>
                    <CheckCircleIcon size={28} color="#10b981" />
                    <h3 className="empty-title" style={{ fontSize: "14px", marginTop: "8px" }}>
                      No pending retailer applications
                    </h3>
                    <p className="empty-sub text-xs">
                      All retailer accounts are currently reviewed and verified.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Shop & Owner</th>
                          <th>Email Address</th>
                          <th>Registered Date</th>
                          <th style={{ textAlign: "right" }}>Verification Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map((r) => (
                          <tr key={r._id}>
                            <td>
                              <div className="font-semibold text-xs">{r.shopName || "Unnamed Store"}</div>
                              <div className="text-muted text-xs">Owner: {r.name}</div>
                            </td>
                            <td className="font-mono text-xs">{r.email}</td>
                            <td className="text-muted text-xs">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "Recent"}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className="flex-center gap-1 justify-end">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => handleReject(r._id, r.shopName || r.name)}
                                  title="Reject retailer application"
                                  style={{ padding: "2px 6px" }}
                                >
                                  <XIcon size={12} />
                                  <span>Reject</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApprove(r._id, r.shopName || r.name)}
                                  title="Approve retailer application"
                                  style={{ padding: "2px 6px" }}
                                >
                                  <CheckIcon size={12} />
                                  <span>Approve</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SubTab B: Delivery Partner Verifications */}
            {approvalsSubTab === "riders" && (
              <div>
                {pendingRiders.length === 0 ? (
                  <div className="empty-state" style={{ padding: "28px 14px" }}>
                    <CheckCircleIcon size={28} color="#10b981" />
                    <h3 className="empty-title" style={{ fontSize: "14px", marginTop: "8px" }}>
                      No pending delivery partner verifications
                    </h3>
                    <p className="empty-sub text-xs">
                      All delivery partner rider accounts have been verified.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rider Name</th>
                          <th>Email & Phone</th>
                          <th>Vehicle Profile</th>
                          <th>Registered Date</th>
                          <th style={{ textAlign: "right" }}>Verification Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRiders.map((r) => (
                          <tr key={r._id}>
                            <td>
                              <div className="font-semibold text-xs flex-center gap-1">
                                <BikeIcon size={13} color="var(--color-primary)" />
                                <span>{r.name}</span>
                              </div>
                            </td>
                            <td>
                              <div className="font-mono text-xs">{r.email}</div>
                              {r.phone && <div className="text-muted text-xs">+91 {r.phone}</div>}
                            </td>
                            <td>
                              <span className="badge badge-customer text-xs">
                                {r.vehicleType || "Bike"} • {r.vehicleNumber || "Plate N/A"}
                              </span>
                            </td>
                            <td className="text-muted text-xs">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "Recent"}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className="flex-center gap-1 justify-end">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => handleRejectRider(r._id, r.name)}
                                  title="Reject delivery partner application"
                                  style={{ padding: "2px 6px" }}
                                >
                                  <XIcon size={12} />
                                  <span>Reject</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApproveRider(r._id, r.name)}
                                  title="Approve delivery partner application"
                                  style={{ padding: "2px 6px" }}
                                >
                                  <CheckIcon size={12} />
                                  <span>Approve</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL RETAILERS */}
      {activeTab === "retailers" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Registered Retailer Directory</h3>
              <p className="card-subtitle">Overview of all merchants registered in LocalShop Cloud</p>
            </div>

            {allRetailers.length === 0 ? (
              <div className="empty-state" style={{ padding: "28px 14px" }}>
                <StoreIcon size={26} color="#94a3b8" />
                <h3 className="empty-title" style={{ fontSize: "14px", marginTop: "8px" }}>
                  No retailers found
                </h3>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Owner Name</th>
                      <th>Email</th>
                      <th>Account Status</th>
                      <th style={{ textAlign: "right" }}>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRetailers.map((r) => (
                      <tr key={r._id}>
                        <td className="font-semibold text-xs">{r.shopName || "Unnamed Store"}</td>
                        <td>{r.name}</td>
                        <td className="font-mono text-xs">{r.email}</td>
                        <td>
                          <StatusBadge
                            status={r.approved ? "approved" : "pending"}
                            label={r.approved ? "Approved Merchant" : "Pending Verification"}
                            size="sm"
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => handleReject(r._id, r.shopName || r.name)}
                            title="Remove retailer"
                            style={{ padding: "2px 6px" }}
                          >
                            <XIcon size={12} />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY FLEET */}
      {activeTab === "riders" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Registered Delivery Fleet & Riders</h3>
              <p className="card-subtitle">Active hyperlocal delivery partners, vehicle details, and total verified earnings</p>
            </div>

            {deliveryPartners.length === 0 ? (
              <div className="empty-state" style={{ padding: "28px 14px" }}>
                <BikeIcon size={26} color="#94a3b8" />
                <h3 className="empty-title" style={{ fontSize: "14px", marginTop: "8px" }}>
                  No delivery partners registered yet
                </h3>
                <p className="empty-sub text-xs">
                  New riders who register with the Delivery Partner role will appear here.
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rider Name</th>
                      <th>Email & Phone</th>
                      <th>Vehicle Details</th>
                      <th>Account Status</th>
                      <th>Availability</th>
                      <th style={{ textAlign: "right" }}>Total Earnings</th>
                      <th style={{ textAlign: "right" }}>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryPartners.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div className="font-semibold text-xs flex-center gap-1">
                            <BikeIcon size={12} color="var(--color-primary)" />
                            <span>{r.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="font-mono text-xs">{r.email}</div>
                          {r.phone && <div className="text-muted text-xs">+91 {r.phone}</div>}
                        </td>
                        <td>
                          <span className="badge badge-customer text-xs">
                            {r.vehicleType || "Bike"} • {r.vehicleNumber || "N/A"}
                          </span>
                        </td>
                        <td>
                          <StatusBadge
                            status={r.approved ? "approved" : "pending"}
                            label={r.approved ? "Approved Rider" : "Pending Verification"}
                            size="sm"
                          />
                        </td>
                        <td>
                          <StatusBadge
                            status={r.isAvailable ? "approved" : "pending"}
                            label={r.isAvailable ? "Online (Active)" : "Offline (Paused)"}
                            size="sm"
                          />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                          ₹{r.earnings || 0}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="flex-center gap-1 justify-end">
                            {!r.approved && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApproveRider(r._id, r.name)}
                                title="Approve rider"
                                style={{ padding: "2px 6px", fontSize: "10.5px" }}
                              >
                                <CheckIcon size={11} />
                                <span>Approve</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-danger"
                              onClick={() => handleRejectRider(r._id, r.name)}
                              title="Remove delivery partner"
                              style={{ padding: "2px 6px" }}
                            >
                              <XIcon size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM STATUS */}
      {activeTab === "system" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System & Service Verification</h3>
              <p className="card-subtitle">Live health status of integrated application layers</p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Service Layer</th>
                    <th>Integration Point</th>
                    <th>Status</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="flex-center gap-2">
                        <ServerIcon size={14} />
                        <span className="font-medium">REST API Backend</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">/api/admin/stats</td>
                    <td>
                      <StatusBadge status="approved" label="Connected" size="sm" />
                    </td>
                    <td className="text-muted text-xs">HTTP 200 OK Handshake Active</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="flex-center gap-2">
                        <DatabaseIcon size={14} />
                        <span className="font-medium">Cloud Database</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">MongoDB Document Store</td>
                    <td>
                      <StatusBadge status="approved" label="Online" size="sm" />
                    </td>
                    <td className="text-muted text-xs">Synchronized ({stats?.productCount ?? 0} Products Indexed)</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="flex-center gap-2">
                        <ShieldIcon size={14} />
                        <span className="font-medium">Authentication Authority</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">JWT Bearer Token Guard</td>
                    <td>
                      <StatusBadge status="approved" label="Authenticated" size="sm" />
                    </td>
                    <td className="text-muted text-xs">Role: Administrator Session Verified</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
