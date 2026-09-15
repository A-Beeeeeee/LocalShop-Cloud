import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import InvoiceModal from "../components/InvoiceModal";
import { 
  TrendingUpIcon, 
  PackageIcon, 
  BagIcon, 
  AlertTriangleIcon, 
  PlusIcon, 
  TrashIcon, 
  EditIcon, 
  RefreshCwIcon, 
  CheckIcon, 
  XIcon, 
  SearchIcon, 
  PrinterIcon,
  UploadIcon,
  ImageIcon,
  ReceiptIcon,
  KeyIcon
} from "../components/Icons";

const CATEGORIES = ["General", "Groceries", "Apparel", "Home", "Electronics"];

const SAMPLE_PRESETS = [
  { name: "Organic Brown Rice (1kg)", category: "Groceries", price: 120, stock: 40, imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80" },
  { name: "Fresh Organic Apples (1kg)", category: "Groceries", price: 180, stock: 25, imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80" },
  { name: "Pure Cow Milk (1L)", category: "Groceries", price: 65, stock: 50, imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80" },
  { name: "Classic Cotton T-Shirt", category: "Apparel", price: 499, stock: 30, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80" },
  { name: "Wireless Bluetooth Headphones", category: "Electronics", price: 1999, stock: 15, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80" },
  { name: "Ceramic Artisan Coffee Mug", category: "Home", price: 299, stock: 20, imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80" },
];


export default function RetailerDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "products" | "orders" | "reports"
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  // Stock inline edit state
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [savingStock, setSavingStock] = useState(false);

  // Add Product Modal state
  // Add Product Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState("file"); // "file" | "url"
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "General",
    stock: "",
    description: "",
    imageUrl: "",
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Edit Product Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editImageInputMode, setEditImageInputMode] = useState("file");
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    category: "General",
    stock: "",
    description: "",
    imageUrl: "",
  });
  const [savingEditProduct, setSavingEditProduct] = useState(false);

  // Invoice modal state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Search & Filters in Products and Orders tabs
  const [productSearch, setProductSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [statsData, productsData, ordersData] = await Promise.all([
        api.getRetailerDashboard(),
        api.getMyProducts(),
        api.getRetailerOrders(),
      ]);
      setStats(statsData);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  function handleViewOrderInvoice(row) {
    const fullOrder = orders.find((o) => o._id === row.orderId);
    if (fullOrder) {
      setSelectedInvoiceOrder(fullOrder);
    } else {
      setSelectedInvoiceOrder({
        _id: row.orderId,
        createdAt: row.createdAt,
        customer: { name: row.customerName, email: row.customerEmail },
        address: row.address,
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        paymentId: row.paymentId,
        items: [row.item],
        totalAmount: row.item.price * row.item.qty,
      });
    }
    setIsInvoiceModalOpen(true);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditForm(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenEditModal(product) {
    setEditingProductId(product._id);
    setEditForm({
      name: product.name || "",
      price: product.price ?? "",
      category: product.category || "General",
      stock: product.stock ?? "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
    setEditImageInputMode(product.imageUrl && product.imageUrl.startsWith("data:") ? "file" : "url");
    setIsEditModalOpen(true);
  }

  function handleImageFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, JPEG, WEBP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be under 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Resize on canvas to max 600px width/height for fast cloud storage
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        updateForm("imageUrl", optimizedDataUrl);
        showToast("Image loaded and optimized from your device!", "success");
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleEditImageFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, JPEG, WEBP)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be under 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        updateEditForm("imageUrl", optimizedDataUrl);
        showToast("New image selected and optimized!", "success");
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveEditProduct(e) {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.price === "") {
      showToast("Product name and price are required", "error");
      return;
    }
    const priceNum = Number(editForm.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast("Please enter a valid price", "error");
      return;
    }

    setSavingEditProduct(true);
    try {
      await api.updateProduct(editingProductId, {
        name: editForm.name.trim(),
        price: priceNum,
        category: editForm.category,
        stock: Number(editForm.stock) || 0,
        description: editForm.description.trim(),
        imageUrl: editForm.imageUrl.trim() || "",
      });
      showToast(`Product "${editForm.name}" updated successfully!`, "success");
      setIsEditModalOpen(false);
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to update product", "error");
    } finally {
      setSavingEditProduct(false);
    }
  }



  async function handleAddProduct(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "") {
      showToast("Product name and price are required", "error");
      return;
    }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast("Please enter a valid price", "error");
      return;
    }

    setSubmittingProduct(true);
    try {
      await api.createProduct({
        name: form.name.trim(),
        price: priceNum,
        category: form.category,
        stock: Number(form.stock) || 0,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
      });
      showToast(`Product "${form.name}" created successfully`, "success");
      setForm({ name: "", price: "", category: "General", stock: "", description: "", imageUrl: "" });
      setIsAddModalOpen(false);
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to create product", "error");
    } finally {
      setSubmittingProduct(false);
    }
  }

  async function handleDeleteProduct(id, name) {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      showToast(`Deleted "${name}"`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to delete product", "error");
    }
  }

  async function handleUpdateStock(productId) {
    if (stockValue === "" || stockValue === undefined) {
      showToast("Please enter a valid stock value", "error");
      return;
    }
    const stockNum = Number(stockValue);
    if (isNaN(stockNum) || stockNum < 0) {
      showToast("Stock must be a non-negative number", "error");
      return;
    }

    setSavingStock(true);
    try {
      await api.updateProductStock(productId, stockNum);
      showToast("Stock updated", "success");
      setEditingStockId(null);
      setStockValue("");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to update stock", "error");
    } finally {
      setSavingStock(false);
    }
  }

  async function handleStatusChange(orderId, productId, newStatus) {
    try {
      await api.updateOrderItemStatus(orderId, productId, newStatus);
      showToast(`Status updated to ${newStatus}`, "success");
      loadAll();
    } catch (err) {
      showToast(err.message || "Failed to update item status", "error");
    }
  }

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  // Flatten and filter order items
  const flattenedOrderItems = [];
  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (orderStatusFilter === "all" || (item.status || "pending") === orderStatusFilter) {
          flattenedOrderItems.push({
            orderId: order._id,
            createdAt: order.createdAt,
            customerName: order.customer?.name || "Customer",
            customerEmail: order.customer?.email || "",
            address: order.address,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentId: order.paymentId,
            deliveryOtp: order.deliveryOtp || (order._id ? (order._id.replace(/\D/g, "").slice(-4) || "4821") : "4821"),
            item,
          });
        }
      });
    }
  });

  return (
    <div className="page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Retailer Dashboard</h1>
          <p className="page-subtitle">Manage store inventory, orders, and sales performance</p>
        </div>
        <div className="flex-center gap-2">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={loadAll} 
            disabled={loading}
          >
            <RefreshCwIcon size={13} className={loading ? "spin" : ""} />
            Refresh
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon size={13} />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "8px" }}>
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
          <TrendingUpIcon size={14} />
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "products"}
          className={`tab-btn ${activeTab === "products" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <PackageIcon size={14} />
          Products ({products.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "orders"}
          className={`tab-btn ${activeTab === "orders" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <BagIcon size={14} />
          Orders ({orders.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "reports"}
          className={`tab-btn ${activeTab === "reports" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <PrinterIcon size={14} />
          Reports
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="tab-content">
          {/* KPI Metrics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-icon-wrap stat-icon-primary">₹</span>
              </div>
              <p className="stat-value">₹{stats?.salesTotal ?? 0}</p>
              <p className="stat-meta">From fulfilled orders</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Orders Received</span>
                <span className="stat-icon-wrap stat-icon-info">
                  <BagIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.orderCount ?? 0}</p>
              <p className="stat-meta">Total order items</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Active Products</span>
                <span className="stat-icon-wrap stat-icon-success">
                  <PackageIcon size={14} />
                </span>
              </div>
              <p className="stat-value">{stats?.productCount ?? 0}</p>
              <p className="stat-meta">In your store catalog</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Low Stock Alerts</span>
                <span className="stat-icon-wrap stat-icon-warning">
                  <AlertTriangleIcon size={14} />
                </span>
              </div>
              <p className={`stat-value ${stats?.lowStockCount > 0 ? "text-danger" : ""}`}>
                {stats?.lowStockCount ?? 0}
              </p>
              <p className="stat-meta">&lt; 5 units remaining</p>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="card" style={{ marginTop: "8px" }}>
            <div className="card-header flex-between">
              <div>
                <h3 className="card-title">Recent Order Items</h3>
                <p className="card-subtitle">Latest orders containing your products</p>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setActiveTab("orders")}
              >
                View all orders
              </button>
            </div>

            {flattenedOrderItems.length === 0 ? (
              <p className="text-muted text-xs" style={{ padding: "8px 0" }}>
                No customer orders received yet.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flattenedOrderItems.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-xs font-semibold">
                          #{row.orderId.slice(-6).toUpperCase()}
                        </td>
                        <td>{row.customerName}</td>
                        <td className="font-medium">{row.item.name}</td>
                        <td>{row.item.qty}</td>
                        <td className="font-semibold">₹{row.item.price * row.item.qty}</td>
                        <td>
                          <StatusBadge status={row.item.status || "pending"} size="sm" />
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

      {/* TAB 2: PRODUCTS (INVENTORY) */}
      {activeTab === "products" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header flex-between flex-wrap gap-2">
              <div className="search-bar" style={{ maxWidth: "240px", margin: 0, height: "28px" }}>
                <span className="search-icon">
                  <SearchIcon size={12} />
                </span>
                <input
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="search-input"
                  style={{ padding: "2px 0", fontSize: "12px" }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon size={12} />
                Add Product
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 12px" }}>
                <PackageIcon size={24} color="#94a3b8" />
                <h3 className="empty-title" style={{ fontSize: "13px", marginTop: "6px" }}>
                  {productSearch ? "No matching products found" : "No products added yet"}
                </h3>
                <p className="empty-sub text-xs">
                  {productSearch
                    ? "Try adjusting your search query."
                    : "Create your first product listing to start selling."}
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Price</th>
                      <th>Stock Level</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLowStock = p.stock > 0 && p.stock < 5;
                      const isEditing = editingStockId === p._id;

                      return (
                        <tr key={p._id}>
                          <td>
                            <div className="font-semibold text-xs">{p.name}</div>
                            {p.description && (
                              <div className="text-muted text-xs truncate" style={{ maxWidth: "220px" }}>
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="product-category-tag">{p.category || "General"}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>₹{p.price}</td>
                          <td>
                            {isEditing ? (
                              <div className="flex-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={stockValue}
                                  onChange={(e) => setStockValue(e.target.value)}
                                  className="form-input form-input-sm"
                                  style={{ width: "55px", padding: "2px 4px", fontSize: "11px" }}
                                  disabled={savingStock}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: "2px 5px" }}
                                  onClick={() => handleUpdateStock(p._id)}
                                  disabled={savingStock}
                                  title="Save stock"
                                >
                                  <CheckIcon size={11} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: "2px 5px" }}
                                  onClick={() => {
                                    setEditingStockId(null);
                                    setStockValue("");
                                  }}
                                  disabled={savingStock}
                                  title="Cancel"
                                >
                                  <XIcon size={11} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex-center gap-1">
                                <StatusBadge
                                  status={isOutOfStock ? "out-of-stock" : isLowStock ? "low-stock" : "in-stock"}
                                  label={`${p.stock} units`}
                                  size="sm"
                                />
                                <button
                                  type="button"
                                  className="btn-icon text-muted"
                                  onClick={() => {
                                    setEditingStockId(p._id);
                                    setStockValue(p.stock);
                                  }}
                                  title="Edit stock quantity"
                                  style={{ padding: "2px" }}
                                >
                                  <EditIcon size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="flex-center justify-end gap-1">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit product details & image"
                                style={{ padding: "2px 6px", fontSize: "11px" }}
                              >
                                <EditIcon size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                onClick={() => handleDeleteProduct(p._id, p.name)}
                                title="Delete product"
                                style={{ padding: "2px 5px", fontSize: "11px" }}
                              >
                                <TrashIcon size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS (FULFILLMENT) */}
      {activeTab === "orders" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header flex-between flex-wrap gap-2">
              <div>
                <h3 className="card-title">Order Fulfillment</h3>
                <p className="card-subtitle">Manage fulfillment status and process customer returns & refunds</p>
              </div>

              {/* Status Filter */}
              <div className="flex-center gap-2">
                <span className="text-muted text-xs">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="form-select form-select-sm"
                  style={{ width: "auto", padding: "2px 6px" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="return_requested">Return Requested</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {flattenedOrderItems.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 12px" }}>
                <BagIcon size={24} color="#94a3b8" />
                <h3 className="empty-title" style={{ fontSize: "13px", marginTop: "6px" }}>
                  No orders found
                </h3>
                <p className="empty-sub text-xs">
                  {orderStatusFilter !== "all"
                    ? `No orders currently match status "${orderStatusFilter}".`
                    : "When customers order your products, they will appear here for fulfillment."}
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer & Delivery</th>
                      <th>Product</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ minWidth: "180px" }}>Order Status & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flattenedOrderItems.map((row, idx) => (
                      <tr key={`${row.orderId}-${row.item.product}-${idx}`}>
                        <td>
                          <div className="font-mono text-xs font-bold">
                            #{row.orderId.slice(-6).toUpperCase()}
                          </div>
                          <div className="text-muted text-xs">
                            {new Date(row.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-xs">{row.customerName}</div>
                          {row.customerEmail && (
                            <div className="text-muted text-xs">{row.customerEmail}</div>
                          )}
                          {row.address && (
                            <div className="text-muted text-xs truncate" style={{ maxWidth: "180px" }} title={row.address}>
                              {row.address}
                            </div>
                          )}
                          <div style={{ marginTop: "3px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                            {row.paymentMethod === "razorpay" ? (
                              <span className="badge badge-success text-xs" style={{ fontSize: "10px", padding: "1px 4px" }} title={row.paymentId || "Online"}>
                                Razorpay (Paid)
                              </span>
                            ) : (
                              <span className="badge badge-warning text-xs" style={{ fontSize: "10px", padding: "1px 4px" }}>
                                Cash on Delivery
                              </span>
                            )}
                            <span className="badge badge-customer text-xs" style={{ fontSize: "10px", padding: "1px 5px", display: "inline-flex", alignItems: "center", gap: "3px" }} title="Customer Doorstep Delivery OTP">
                              <KeyIcon size={10} color="#64748b" />
                              OTP: <strong style={{ letterSpacing: "0.05em" }}>{row.deliveryOtp}</strong>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-xs">{row.item.name}</div>
                          <div className="text-muted text-xs">₹{row.item.price} each</div>
                          {row.item.returnReason && (
                            <div style={{
                              marginTop: "4px",
                              padding: "2px 6px",
                              backgroundColor: "var(--color-warning-bg)",
                              border: "1px solid var(--color-warning-border)",
                              borderRadius: "4px",
                              fontSize: "10px",
                              color: "var(--color-warning-text)"
                            }}>
                              <strong>Return Reason:</strong> {row.item.returnReason}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600 }}>{row.item.qty}</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                          ₹{row.item.price * row.item.qty}
                        </td>
                        <td>
                          {row.item.status === "pending" && (
                            <div className="flex-center gap-1 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                                onClick={() => handleStatusChange(row.orderId, row.item.product || row.item._id, "fulfilled")}
                                title="Accept, pack, and mark fulfilled"
                              >
                                <CheckIcon size={12} />
                                <span>Accept & Fulfill</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                style={{ padding: "3px 6px", fontSize: "11px", borderColor: "var(--color-danger-border)" }}
                                onClick={() => {
                                  if (window.confirm(`Decline item "${row.item.name}" (out of stock)? Customer will be notified and refunded.`)) {
                                    handleStatusChange(row.orderId, row.item.product || row.item._id, "cancelled");
                                  }
                                }}
                                title="Decline / Out of stock"
                              >
                                <XIcon size={12} />
                                <span>Decline</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "3px 6px", fontSize: "11px" }}
                                onClick={() => handleViewOrderInvoice(row)}
                                title="View Tax Invoice"
                              >
                                <ReceiptIcon size={12} />
                              </button>
                            </div>
                          )}

                          {row.item.status === "return_requested" && (
                            <div className="flex-center gap-1 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ padding: "3px 8px", fontSize: "11px", backgroundColor: "var(--color-success)", borderColor: "var(--color-success)" }}
                                onClick={() => {
                                  if (window.confirm(`Approve return for "${row.item.name}"? Catalog stock will be restored and refund will be issued.`)) {
                                    handleStatusChange(row.orderId, row.item.product || row.item._id, "refunded");
                                  }
                                }}
                                title="Approve return, restock catalog, and process refund"
                              >
                                <CheckIcon size={12} />
                                <span>Approve Return</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                style={{ padding: "3px 6px", fontSize: "11px", borderColor: "var(--color-danger-border)" }}
                                onClick={() => {
                                  if (window.confirm(`Decline return request and keep order marked as fulfilled?`)) {
                                    handleStatusChange(row.orderId, row.item.product || row.item._id, "fulfilled");
                                  }
                                }}
                                title="Decline return request"
                              >
                                <XIcon size={12} />
                                <span>Decline</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "3px 6px", fontSize: "11px" }}
                                onClick={() => handleViewOrderInvoice(row)}
                                title="View Tax Invoice"
                              >
                                <ReceiptIcon size={12} />
                              </button>
                            </div>
                          )}

                          {row.item.status === "fulfilled" && (
                            <div className="flex-center gap-1">
                              <StatusBadge status="fulfilled" label="Fulfilled & Dispatched" size="sm" />
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "3px 6px", fontSize: "11px" }}
                                onClick={() => handleViewOrderInvoice(row)}
                                title="View Tax Invoice"
                              >
                                <ReceiptIcon size={12} />
                              </button>
                            </div>
                          )}

                          {row.item.status === "refunded" && (
                            <div className="flex-center gap-1">
                              <StatusBadge status="refunded" label="Refunded & Restocked" size="sm" />
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "3px 6px", fontSize: "11px" }}
                                onClick={() => handleViewOrderInvoice(row)}
                                title="View Tax Invoice"
                              >
                                <ReceiptIcon size={12} />
                              </button>
                            </div>
                          )}

                          {row.item.status === "cancelled" && (
                            <div className="flex-center gap-1">
                              <StatusBadge status="cancelled" label="Cancelled" size="sm" />
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "3px 6px", fontSize: "11px" }}
                                onClick={() => handleViewOrderInvoice(row)}
                                title="View Tax Invoice"
                              >
                                <ReceiptIcon size={12} />
                              </button>
                            </div>
                          )}
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

      {/* TAB 4: REPORTS */}
      {activeTab === "reports" && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header flex-between flex-wrap gap-2">
              <div>
                <h3 className="card-title">Retailer Performance Summary</h3>
                <p className="card-subtitle">Verified platform metrics and catalog overview</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => window.print()}
              >
                <PrinterIcon size={12} />
                Print Summary Report
              </button>
            </div>

            <div className="report-summary-grid">
              <div className="report-metric-box">
                <span className="text-muted text-xs uppercase font-semibold">Total Revenue</span>
                <span className="report-metric-val">₹{stats?.salesTotal ?? 0}</span>
                <span className="text-muted text-xs">From fulfilled sales</span>
              </div>
              <div className="report-metric-box">
                <span className="text-muted text-xs uppercase font-semibold">Total Orders</span>
                <span className="report-metric-val">{stats?.orderCount ?? 0}</span>
                <span className="text-muted text-xs">Customer line items</span>
              </div>
              <div className="report-metric-box">
                <span className="text-muted text-xs uppercase font-semibold">Listed Products</span>
                <span className="report-metric-val">{stats?.productCount ?? 0}</span>
                <span className="text-muted text-xs">Total catalog SKUs</span>
              </div>
              <div className="report-metric-box">
                <span className="text-muted text-xs uppercase font-semibold">Low Stock</span>
                <span className="report-metric-val text-danger">{stats?.lowStockCount ?? 0}</span>
                <span className="text-muted text-xs">Items with stock &lt; 5</span>
              </div>
            </div>

            {/* Category breakdown from actual products */}
            <div style={{ marginTop: "10px" }}>
              <h4 className="font-semibold text-xs" style={{ marginBottom: "6px" }}>
                Catalog Distribution by Category
              </h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: "center" }}>Product Count</th>
                      <th style={{ textAlign: "right" }}>Available Inventory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map((cat) => {
                      const catProducts = products.filter((p) => p.category === cat);
                      const totalStock = catProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
                      return (
                        <tr key={cat}>
                          <td className="font-medium">{cat}</td>
                          <td style={{ textAlign: "center" }}>{catProducts.length}</td>
                          <td style={{ textAlign: "right" }}>{totalStock} units</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Compact Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product to Store"
        maxWidth="480px"
      >
        <form onSubmit={handleAddProduct}>
          {/* Quick Preset Selector */}
          <div style={{ 
            backgroundColor: "#f1f5f9", 
            padding: "8px 10px", 
            borderRadius: "var(--radius-sm)", 
            marginBottom: "10px",
            border: "1px solid var(--color-border)"
          }}>
            <div className="flex-between" style={{ marginBottom: "4px" }}>
              <span className="font-semibold text-xs text-muted" style={{ fontSize: "11px" }}>
                Auto-Fill Sample Product & Image:
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {SAMPLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: "2px 6px",
                    fontSize: "10px",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px"
                  }}
                  onClick={() => {
                    setForm({
                      name: preset.name,
                      category: preset.category,
                      price: preset.price,
                      stock: preset.stock,
                      imageUrl: preset.imageUrl,
                      description: `Premium quality ${preset.name.toLowerCase()} sourced fresh for our local customers.`
                    });
                  }}
                >
                  + {preset.name.split(" ")[0]} ({preset.category})
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-name">Product Name *</label>
              <input
                id="prod-name"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Organic Brown Rice 1kg"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-category">Category</label>
              <select
                id="prod-category"
                className="form-select"
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-price">Price (₹) *</label>
              <input
                id="prod-price"
                type="number"
                min="0"
                step="0.01"
                required
                className="form-input"
                placeholder="e.g. 150"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-stock">Stock Quantity</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 25"
                value={form.stock}
                onChange={(e) => updateForm("stock", e.target.value)}
              />
            </div>
          </div>

          {/* Product Image Selection & Live Preview */}
          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: "6px" }}>
              <label className="form-label" style={{ margin: 0 }}>Product Image</label>
              <div className="flex-center gap-1">
                <button
                  type="button"
                  className={`btn btn-sm ${imageInputMode === "file" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "2px 8px", fontSize: "11px" }}
                  onClick={() => setImageInputMode("file")}
                >
                  <UploadIcon size={11} />
                  Upload from Device
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${imageInputMode === "url" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "2px 8px", fontSize: "11px" }}
                  onClick={() => setImageInputMode("url")}
                >
                  <ImageIcon size={11} />
                  Paste URL
                </button>
              </div>
            </div>

            {imageInputMode === "file" ? (
              <div style={{
                border: "1px dashed var(--color-border)",
                backgroundColor: "#f8fafc",
                borderRadius: "var(--radius-sm)",
                padding: "10px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px"
              }}>
                <input
                  id="prod-file-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleImageFileUpload}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="prod-file-upload"
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <UploadIcon size={13} color="#2563eb" />
                  <span>Choose Image from Computer</span>
                </label>
                <span className="text-muted text-xs" style={{ fontSize: "10px" }}>
                  Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                </span>
              </div>
            ) : (
              <input
                id="prod-image"
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={form.imageUrl}
                onChange={(e) => updateForm("imageUrl", e.target.value)}
              />
            )}

            {/* Live Image Preview */}
            {form.imageUrl && (
              <div style={{
                marginTop: "8px",
                padding: "6px 10px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px"
              }}>
                <div className="flex-center gap-2">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--color-border)" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div>
                    <span className="font-semibold text-xs text-success flex-center gap-1">
                      <CheckIcon size={11} /> Image Selected
                    </span>
                    <span className="text-muted text-xs" style={{ fontSize: "10px", display: "block" }}>
                      {form.imageUrl.startsWith("data:") ? "Local File (Auto-Optimized)" : "Web URL Link"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-danger"
                  style={{ padding: "2px 6px", fontSize: "11px" }}
                  onClick={() => updateForm("imageUrl", "")}
                >
                  <TrashIcon size={12} />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-desc">Description (Optional)</label>
            <textarea
              id="prod-desc"
              className="form-input form-textarea"
              rows={2}
              placeholder="Brief summary of the product..."
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={submittingProduct}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submittingProduct}
            >
              {submittingProduct ? "Creating..." : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product Details"
        maxWidth="480px"
      >
        <form onSubmit={handleSaveEditProduct}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-prod-name">Product Name *</label>
              <input
                id="edit-prod-name"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Organic Brown Rice 1kg"
                value={editForm.name}
                onChange={(e) => updateEditForm("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-prod-category">Category</label>
              <select
                id="edit-prod-category"
                className="form-select"
                value={editForm.category}
                onChange={(e) => updateEditForm("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-prod-price">Price (₹) *</label>
              <input
                id="edit-prod-price"
                type="number"
                min="0"
                step="0.01"
                required
                className="form-input"
                placeholder="e.g. 150"
                value={editForm.price}
                onChange={(e) => updateEditForm("price", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-prod-stock">Stock Quantity</label>
              <input
                id="edit-prod-stock"
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 25"
                value={editForm.stock}
                onChange={(e) => updateEditForm("stock", e.target.value)}
              />
            </div>
          </div>

          {/* Edit Product Image Selection & Live Preview */}
          <div className="form-group">
            <div className="flex-between" style={{ marginBottom: "6px" }}>
              <label className="form-label" style={{ margin: 0 }}>Product Image</label>
              <div className="flex-center gap-1">
                <button
                  type="button"
                  className={`btn btn-sm ${editImageInputMode === "file" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "2px 8px", fontSize: "11px" }}
                  onClick={() => setEditImageInputMode("file")}
                >
                  <UploadIcon size={11} />
                  Upload from Device
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${editImageInputMode === "url" ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "2px 8px", fontSize: "11px" }}
                  onClick={() => setEditImageInputMode("url")}
                >
                  <ImageIcon size={11} />
                  Paste URL
                </button>
              </div>
            </div>

            {editImageInputMode === "file" ? (
              <div style={{
                border: "1px dashed var(--color-border)",
                backgroundColor: "#f8fafc",
                borderRadius: "var(--radius-sm)",
                padding: "10px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px"
              }}>
                <input
                  id="edit-prod-file-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleEditImageFileUpload}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="edit-prod-file-upload"
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <UploadIcon size={13} color="#2563eb" />
                  <span>Choose Replacement Image</span>
                </label>
                <span className="text-muted text-xs" style={{ fontSize: "10px" }}>
                  Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                </span>
              </div>
            ) : (
              <input
                id="edit-prod-image"
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={editForm.imageUrl}
                onChange={(e) => updateEditForm("imageUrl", e.target.value)}
              />
            )}

            {/* Live Image Preview */}
            {editForm.imageUrl && (
              <div style={{
                marginTop: "8px",
                padding: "6px 10px",
                backgroundColor: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px"
              }}>
                <div className="flex-center gap-2">
                  <img
                    src={editForm.imageUrl}
                    alt="Preview"
                    style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--color-border)" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div>
                    <span className="font-semibold text-xs text-success flex-center gap-1">
                      <CheckIcon size={11} /> Current Image
                    </span>
                    <span className="text-muted text-xs" style={{ fontSize: "10px", display: "block" }}>
                      {editForm.imageUrl.startsWith("data:") ? "Local File (Auto-Optimized)" : "Web URL Link"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-danger"
                  style={{ padding: "2px 6px", fontSize: "11px" }}
                  onClick={() => updateEditForm("imageUrl", "")}
                >
                  <TrashIcon size={12} />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-prod-desc">Description (Optional)</label>
            <textarea
              id="edit-prod-desc"
              className="form-input form-textarea"
              rows={2}
              placeholder="Brief summary of the product..."
              value={editForm.description}
              onChange={(e) => updateEditForm("description", e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={savingEditProduct}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={savingEditProduct}
            >
              {savingEditProduct ? "Saving Changes..." : "Update Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Tax Invoice Modal for Retailers */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedInvoiceOrder}
      />
    </div>
  );
}
