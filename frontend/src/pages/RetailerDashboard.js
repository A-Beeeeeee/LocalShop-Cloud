import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function RetailerDashboard() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", category: "General", stock: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [statsData, productsData, ordersData] = await Promise.all([
        api.getRetailerDashboard(),
        api.getMyProducts(),
        api.getRetailerOrders(),
      ]);
      setStats(statsData);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price) {
      setError("Product name and price are required");
      return;
    }
    try {
      await api.createProduct({
        name: form.name,
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock) || 0,
        description: form.description,
      });
      setForm({ name: "", price: "", category: "General", stock: "", description: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProduct(id) {
    try {
      await api.deleteProduct(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(orderId, productId, status) {
    try {
      await api.updateItemStatus(orderId, { productId, status });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <p className="form-title">Retailer dashboard</p>
      {error && <p className="error-text">{error}</p>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Sales</p>
            <p className="stat-value">₹{stats.salesTotal}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Orders</p>
            <p className="stat-value">{stats.orderCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Products</p>
            <p className="stat-value">{stats.productCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Low stock</p>
            <p className="stat-value danger">{stats.lowStockCount}</p>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <p className="form-title">Add product</p>
          <form onSubmit={handleAddProduct}>
            <input placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            <input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
            />
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option>General</option>
              <option>Groceries</option>
              <option>Apparel</option>
              <option>Home</option>
              <option>Electronics</option>
            </select>
            <input
              placeholder="Stock quantity"
              type="number"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            <button type="submit" className="primary-btn">Add product</button>
          </form>
        </div>

        <div className="card">
          <p className="form-title">My products</p>
          {products.length === 0 && <p>No products yet.</p>}
          {products.map((p) => (
            <div key={p._id} className="list-row">
              <div>
                <p>{p.name}</p>
                <p className="muted">₹{p.price} · stock {p.stock}</p>
              </div>
              <button className="link-btn" onClick={() => handleDeleteProduct(p._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="form-title">Orders for my products</p>
        {orders.length === 0 && <p>No orders yet.</p>}
        {orders.map((order) =>
          order.items
            .filter((item) => true)
            .map((item) => (
              <div key={`${order._id}-${item.product}`} className="list-row">
                <div>
                  <p>
                    #{order._id.slice(-5)} — {order.customer?.name || "Customer"}
                  </p>
                  <p className="muted">
                    {item.name} × {item.qty} — ₹{item.price * item.qty}
                  </p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(order._id, item.product, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
