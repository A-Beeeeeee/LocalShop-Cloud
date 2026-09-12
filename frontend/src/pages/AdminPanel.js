import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { 
  ShieldIcon, 
  UserIcon, 
  StoreIcon, 
  PackageIcon, 
  BagIcon, 
  CheckIcon, 
  XIcon, 
  RefreshCwIcon, 
  ServerIcon, 
  DatabaseIcon, 
  CheckCircleIcon 
} from "../components/Icons";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "approvals" | "retailers" | "system"
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [allRetailers, setAllRetailers] = useState([]);
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
      const [statsData, pendingData, retailersData] = await Promise.all([
        api.getAdminStats(),
        api.getPendingRetailers(),
        api.getRetailers("all").catch(() => []),
      ]);
      setStats(statsData);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setAllRetailers(Array.isArray(retailersData) ? retailersData : []);
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
          Retailer Approvals {pending.length > 0 && <span className="tab-badge">{pending.length}</span>}
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
                <span className="stat-label">Platform Products</span>
                <span className="stat-icon-wrap stat-icon-success">
                  <PackageIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.productCount ?? 0}</p>
              <p className="stat-meta">Listed across all stores</p>
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
          {pending.length > 0 && (
            <div className="alert alert-warning" style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Action Required:</strong> You have {pending.length} pending retailer approval{pending.length === 1 ? "" : "s"} waiting for review.
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETAILER APPROVALS */}
      {activeTab === "approvals" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pending Retailer Verification Queue</h3>
              <p className="card-subtitle">Verify merchant identity before enabling product catalog publishing</p>
            </div>

            {pending.length === 0 ? (
              <div className="empty-state" style={{ padding: "28px 14px" }}>
                <CheckCircleIcon size={28} color="#10b981" />
                <h3 className="empty-title" style={{ fontSize: "14px", marginTop: "8px" }}>
                  All caught up!
                </h3>
                <p className="empty-sub text-xs">
                  There are no pending retailer approval requests at this time.
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

      {/* TAB 4: SYSTEM STATUS */}
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
