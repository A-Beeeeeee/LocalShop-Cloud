import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Storefront from "./pages/Storefront";
import Cart from "./pages/Cart";
import RetailerDashboard from "./pages/RetailerDashboard";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Storefront />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/cart"
              element={
                <PrivateRoute role="customer">
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/retailer"
              element={
                <PrivateRoute role="retailer">
                  <RetailerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute role="admin">
                  <AdminPanel />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </ToastProvider>
  );
}
