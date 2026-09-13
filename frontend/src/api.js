const rawUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const API_URL = rawUrl.endsWith("/api") ? rawUrl : rawUrl.replace(/\/+$/, "") + "/api";

function getToken() {
  return localStorage.getItem("token");
}


async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getMyProducts: () => request("/products/mine", { auth: true }),
  createProduct: (payload) => request("/products", { method: "POST", body: payload, auth: true }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: "PUT", body: payload, auth: true }),
  updateProductStock: (id, stock) => request(`/products/${id}/stock`, { method: "PATCH", body: { stock }, auth: true }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE", auth: true }),

  placeOrder: (payload) => request("/orders", { method: "POST", body: payload, auth: true }),
  getMyOrders: () => request("/orders/mine", { auth: true }),
  getRetailerOrders: () => request("/orders/retailer", { auth: true }),
  updateItemStatus: (orderId, payload) =>
    request(`/orders/${orderId}/item-status`, { method: "PUT", body: payload, auth: true }),
  updateOrderItemStatus: (orderId, productId, status) =>
    request(`/orders/${orderId}/item-status`, { method: "PUT", body: { productId, status }, auth: true }),
  cancelOrder: (orderId, payload = {}) =>
    request(`/orders/${orderId}/cancel`, { method: "PUT", body: payload, auth: true }),
  requestReturn: (orderId, payload) =>
    request(`/orders/${orderId}/return-request`, { method: "PUT", body: payload, auth: true }),


  getRetailerDashboard: () => request("/dashboard/retailer", { auth: true }),

  getPendingRetailers: () => request("/admin/retailers?status=pending", { auth: true }),
  getRetailers: (status = "all") => request(`/admin/retailers?status=${status}`, { auth: true }),
  approveRetailer: (id) => request(`/admin/retailers/${id}/approve`, { method: "PUT", auth: true }),
  rejectRetailer: (id) => request(`/admin/retailers/${id}`, { method: "DELETE", auth: true }),
  getAdminStats: () => request("/admin/stats", { auth: true }),
};
