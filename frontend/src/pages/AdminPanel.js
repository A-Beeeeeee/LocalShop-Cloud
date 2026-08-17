import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [statsData, pendingData] = await Promise.all([api.getAdminStats(), api.getPendingRetailers()]);
      setStats(statsData);
      setPending(pendingData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApprove(id) {
    try {
      await api.approveRetailer(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject(id) {
    try {
      await api.rejectRetailer(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <p className="form-title">Admin panel</p>
      {error && <p className="error-text">{error}</p>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Retailers</p>
            <p className="stat-value">{stats.retailerCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Customers</p>
            <p className="stat-value">{stats.customerCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Products</p>
            <p className="stat-value">{stats.productCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Orders</p>
            <p className="stat-value">{stats.orderCount}</p>
          </div>
        </div>
      )}

      <div className="card">
        <p className="form-title">Pending retailer approvals</p>
        {pending.length === 0 && <p>No pending approvals.</p>}
        {pending.map((r) => (
          <div key={r._id} className="list-row">
            <div>
              <p>{r.shopName || r.name}</p>
              <p className="muted">{r.email}</p>
            </div>
            <div className="row-actions">
              <button className="link-btn" onClick={() => handleReject(r._id)}>
                Reject
              </button>
              <button className="small-btn" onClick={() => handleApprove(r._id)}>
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
