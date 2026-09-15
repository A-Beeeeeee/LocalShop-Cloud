import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api";
import { 
  CartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon, 
  MapPinIcon, 
  ArrowRightIcon, 
  PackageIcon, 
  CheckCircleIcon,
  CreditCardIcon,
  SmartphoneIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  HomeIcon,
  BriefcaseIcon,
  PhoneIcon
} from "../components/Icons";
import Modal from "../components/Modal";
import AddressModal from "../components/AddressModal";

export default function Cart() {
  const cart = useCart();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // "razorpay" | "cod"
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayTab, setRazorpayTab] = useState("upi"); // "upi" | "card" | "netbanking"
  const [upiId, setUpiId] = useState("customer@oksbi");
  const [cardNumber, setCardNumber] = useState("4532 8712 9021 3456");
  const [cardExpiry, setCardExpiry] = useState("08/28");
  const [cardCvv, setCardCvv] = useState("789");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [processingPayment, setProcessingPayment] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadSavedAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSavedAddresses() {
    try {
      setLoadingAddresses(true);
      const addrs = await api.getAddresses();
      setSavedAddresses(addrs || []);
      if (addrs && addrs.length > 0) {
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        setSelectedAddressId(defaultAddr._id);
        applyAddress(defaultAddr);
      }
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setLoadingAddresses(false);
    }
  }

  function applyAddress(addr) {
    if (!addr) return;
    const formatted = `${addr.flat}, ${addr.area} (Deliver to: ${addr.fullName} • Ph: ${addr.phone}${addr.altPhone ? ` / ${addr.altPhone}` : ""})`;
    setAddress(formatted);
  }

  function handleSelectAddress(addr) {
    setSelectedAddressId(addr._id);
    applyAddress(addr);
  }

  async function handleSaveNewAddress(addrData) {
    const updatedAddresses = await api.addAddress(addrData);
    setSavedAddresses(updatedAddresses || []);
    if (updatedAddresses && updatedAddresses.length > 0) {
      const newlyAdded = updatedAddresses[updatedAddresses.length - 1];
      setSelectedAddressId(newlyAdded._id);
      applyAddress(newlyAdded);
    }
    if (user && !user.phone) {
      updateUser({ phone: addrData.phone });
    }
    showToast("Delivery address saved successfully!", "success");
  }

  async function handleDeleteAddress(e, addrId) {
    e.stopPropagation();
    if (!window.confirm("Delete this saved address?")) return;
    try {
      const updated = await api.deleteAddress(addrId);
      setSavedAddresses(updated || []);
      if (selectedAddressId === addrId) {
        if (updated && updated.length > 0) {
          setSelectedAddressId(updated[0]._id);
          applyAddress(updated[0]);
        } else {
          setSelectedAddressId("");
          setAddress("");
        }
      }
      showToast("Address deleted", "info");
    } catch (err) {
      showToast(err.message || "Failed to delete address", "error");
    }
  }

  function handleStartCheckout() {
    setError("");
    if (cart.items.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (!address.trim()) {
      setError("Please enter a valid delivery address before proceeding");
      return;
    }

    if (paymentMethod === "razorpay") {
      setIsRazorpayModalOpen(true);
    } else {
      executeOrderPlacement("cod", "pending", null);
    }
  }

  async function executeOrderPlacement(method, status, paymentId) {
    setPlacing(true);
    setError("");
    try {
      await api.placeOrder({
        items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
        address: address.trim(),
        paymentMethod: method,
        paymentStatus: status,
        paymentId: paymentId || undefined,
      });
      cart.clearCart();
      setIsRazorpayModalOpen(false);
      showToast(
        method === "razorpay" 
          ? `Payment of ₹${cart.total} successful via Razorpay! Order placed.`
          : "Order placed successfully via Cash on Delivery!", 
        "success"
      );
      setTimeout(() => navigate("/orders"), 600);
    } catch (err) {
      setError(err.message || "Failed to place order");
      setIsRazorpayModalOpen(false);
    } finally {
      setPlacing(false);
      setProcessingPayment(false);
    }
  }

  async function handleSimulatedRazorpayPayment() {
    setProcessingPayment(true);
    setTimeout(() => {
      const generatedPayId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      executeOrderPlacement("razorpay", "paid", generatedPayId);
    }, 800);
  }

  if (cart.items.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <CartIcon size={26} />
          </div>
          <h2 className="empty-title">Your shopping cart is empty</h2>
          <p className="empty-sub">Browse our cloud catalog to add products to your cart.</p>
          <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: "12px" }}>
            Browse Storefront
            <ArrowRightIcon size={13} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">Review items and provide your delivery details</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-danger"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear your cart?")) {
              cart.clearCart();
            }
          }}
          style={{ padding: "3px 8px" }}
        >
          <TrashIcon size={13} />
          <span>Clear</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "10px" }}>
          <p>{error}</p>
        </div>
      )}

      <div className="checkout-layout">
        {/* Left Column: Cart Items & Payment Method Selector */}
        <div className="checkout-items-col">
          <div className="card" style={{ marginBottom: "16px" }}>
            <div className="card-header flex-between">
              <h2 className="card-title">Cart Items ({cart.count})</h2>
              <span className="text-muted text-xs">Total items: {cart.count}</span>
            </div>
            <div className="cart-items-list">
              {cart.items.map((item) => (
                <div key={item.productId} className="cart-item-row">
                  <div className="cart-item-info">
                    <div className="cart-item-icon">
                      <PackageIcon size={15} />
                    </div>
                    <div>
                      <h4 className="cart-item-name">{item.name}</h4>
                      <span className="cart-item-unit-price">₹{item.price} each</span>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-control" role="group" aria-label="Quantity selector">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => cart.decrement(item.productId)}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon size={10} />
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => cart.increment(item.productId)}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon size={10} />
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      ₹{item.price * item.qty}
                    </div>

                    <button
                      type="button"
                      className="btn-icon text-muted"
                      onClick={() => cart.removeFromCart(item.productId)}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Switcher Card */}
          <div className="card">
            <div className="card-header flex-between">
              <h3 className="card-title">Select Payment Method</h3>
              <span className="badge badge-success text-xs flex-center gap-1">
                <ShieldCheckIcon size={12} />
                SSL 256-Bit Encrypted
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "4px" }}>
              {/* Razorpay Option */}
              <div 
                onClick={() => setPaymentMethod("razorpay")}
                style={{
                  border: `2px solid ${paymentMethod === "razorpay" ? "var(--color-primary)" : "var(--color-border)"}`,
                  backgroundColor: paymentMethod === "razorpay" ? "var(--color-primary-subtle)" : "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div className="flex-between">
                  <div className="flex-center gap-2">
                    <div style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: `2px solid ${paymentMethod === "razorpay" ? "var(--color-primary)" : "#94a3b8"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {paymentMethod === "razorpay" && (
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                      )}
                    </div>
                    <span className="font-semibold text-xs" style={{ color: "#0f172a" }}>Razorpay Online Gateway</span>
                  </div>
                  <span className="badge badge-primary text-xs" style={{ fontSize: "10px", padding: "1px 5px" }}>Recommended</span>
                </div>
                <p className="text-muted text-xs" style={{ margin: "2px 0 0 24px", lineHeight: "1.3" }}>
                  UPI (GPay / PhonePe / Paytm), Debit/Credit Cards & NetBanking
                </p>
              </div>

              {/* Cash On Delivery Option */}
              <div 
                onClick={() => setPaymentMethod("cod")}
                style={{
                  border: `2px solid ${paymentMethod === "cod" ? "var(--color-primary)" : "var(--color-border)"}`,
                  backgroundColor: paymentMethod === "cod" ? "var(--color-primary-subtle)" : "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div className="flex-between">
                  <div className="flex-center gap-2">
                    <div style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: `2px solid ${paymentMethod === "cod" ? "var(--color-primary)" : "#94a3b8"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {paymentMethod === "cod" && (
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                      )}
                    </div>
                    <span className="font-semibold text-xs" style={{ color: "#0f172a" }}>Cash on Delivery (COD)</span>
                  </div>
                </div>
                <p className="text-muted text-xs" style={{ margin: "2px 0 0 24px", lineHeight: "1.3" }}>
                  Pay cash directly to the local retailer upon item delivery
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Address & Summary (Sticky) */}
        <div className="checkout-summary-col">
          <div className="card">
            <div className="card-header flex-between">
              <div className="flex-center gap-1">
                <MapPinIcon size={14} color="#64748b" />
                <h3 className="card-title">Delivery Address</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: "2px 8px", fontSize: "11px" }}
                onClick={() => setIsAddressModalOpen(true)}
              >
                <PlusIcon size={11} />
                <span>Add Address</span>
              </button>
            </div>

            {/* Saved Addresses List */}
            <div className="saved-addresses-stack">
              {loadingAddresses ? (
                <div className="text-muted text-xs text-center" style={{ padding: "10px" }}>
                  Loading addresses...
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="no-address-callout">
                  <p className="no-address-text">No address saved yet. Add your delivery address for 1-click checkout.</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-block"
                    onClick={() => setIsAddressModalOpen(true)}
                    style={{ marginTop: "6px" }}
                  >
                    <PlusIcon size={12} />
                    <span>Deliver To: Add Address</span>
                  </button>
                  <div style={{ marginTop: "10px" }}>
                    <label className="form-label" style={{ fontSize: "10.5px" }}>Or type address manually:</label>
                    <textarea
                      id="delivery-address"
                      className="form-input form-textarea"
                      placeholder="Flat / House No., Street, Area, City, Postal Code"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="address-cards-list">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <div
                        key={addr._id}
                        className={`saved-address-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectAddress(addr)}
                      >
                        <div className="saved-address-top">
                          <div className="flex-center gap-1">
                            <span className={`address-type-pill ${addr.addressType?.toLowerCase()}`}>
                              {addr.addressType === "Work" ? <BriefcaseIcon size={11} /> : <HomeIcon size={11} />}
                              <span>{addr.addressType || "Home"}</span>
                            </span>
                            <span className="saved-address-name">{addr.fullName}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-icon text-muted hover-danger"
                            onClick={(e) => handleDeleteAddress(e, addr._id)}
                            title="Delete address"
                            style={{ padding: "2px" }}
                          >
                            <TrashIcon size={11} />
                          </button>
                        </div>

                        <div className="saved-address-body">
                          <div className="saved-address-flat">{addr.flat}</div>
                          <div className="saved-address-area">{addr.area}</div>
                          <div className="saved-address-phone">
                            <PhoneIcon size={10} color="#64748b" />
                            <span>{addr.phone}{addr.altPhone ? ` • Alt: ${addr.altPhone}` : ""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <span className="text-muted">Subtotal ({cart.count} items)</span>
              <span className="font-semibold">₹{cart.total}</span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Payment Mode</span>
              <span className="font-semibold text-primary">
                {paymentMethod === "razorpay" ? "Razorpay Gateway" : "Cash on Delivery"}
              </span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Delivery</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-total-row">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary summary-total-price">₹{cart.total}</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: "12px", padding: "8px 12px" }}
              onClick={handleStartCheckout}
              disabled={placing}
            >
              {placing ? (
                <span>Processing Order...</span>
              ) : paymentMethod === "razorpay" ? (
                <>
                  <CreditCardIcon size={14} />
                  <span>Pay with Razorpay (₹{cart.total})</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon size={14} />
                  <span>Place COD Order (₹{cart.total})</span>
                </>
              )}
            </button>

            <div className="flex-center justify-center gap-2" style={{ marginTop: "10px" }}>
              <ShieldCheckIcon size={12} color="#10b981" />
              <p className="text-muted text-xs text-center" style={{ fontSize: "0.72rem", margin: 0 }}>
                100% Secure Cloud Transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAY CLOUD CHECKOUT MODAL */}
      <Modal
        isOpen={isRazorpayModalOpen}
        onClose={() => !processingPayment && setIsRazorpayModalOpen(false)}
        title="Razorpay Cloud Payment Gateway"
        maxWidth="460px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Razorpay Brand Header */}
          <div style={{
            background: "linear-gradient(135deg, #0c2340 0%, #1e3a8a 100%)",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>
                Merchant: LocalShop Cloud
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>₹{cart.total}.00</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ 
                backgroundColor: "rgba(255,255,255,0.2)", 
                padding: "2px 8px", 
                borderRadius: "12px", 
                fontSize: "11px",
                fontWeight: 600
              }}>
                Razorpay Live Sandbox
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            <button
              type="button"
              className={`btn btn-sm ${razorpayTab === "upi" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, padding: "5px 8px", fontSize: "11px" }}
              onClick={() => setRazorpayTab("upi")}
            >
              <SmartphoneIcon size={12} />
              <span>UPI / QR</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${razorpayTab === "card" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, padding: "5px 8px", fontSize: "11px" }}
              onClick={() => setRazorpayTab("card")}
            >
              <CreditCardIcon size={12} />
              <span>Card</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${razorpayTab === "netbanking" ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, padding: "5px 8px", fontSize: "11px" }}
              onClick={() => setRazorpayTab("netbanking")}
            >
              <span>NetBanking</span>
            </button>
          </div>

          {/* Tab 1: UPI */}
          {razorpayTab === "upi" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ 
                backgroundColor: "#f8fafc", 
                padding: "10px", 
                borderRadius: "var(--radius-sm)", 
                border: "1px dashed var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <QrCodeIcon size={30} color="#2563eb" />
                </div>
                <div>
                  <div className="font-semibold text-xs">Scan & Pay with Any UPI App</div>
                  <div className="text-muted text-xs">Google Pay, PhonePe, Paytm, CRED UPI</div>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="upi-id" style={{ fontSize: "11px" }}>Or Enter Virtual Payment Address (VPA)</label>
                <input
                  id="upi-id"
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="e.g. mobile@upi or username@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Credit / Debit Card */}
          {razorpayTab === "card" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="card-num" style={{ fontSize: "11px" }}>Card Number</label>
                <input
                  id="card-num"
                  type="text"
                  className="form-input form-input-sm font-mono"
                  placeholder="4532 8712 9021 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="card-exp" style={{ fontSize: "11px" }}>Expiry (MM/YY)</label>
                  <input
                    id="card-exp"
                    type="text"
                    className="form-input form-input-sm font-mono"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="card-cvv" style={{ fontSize: "11px" }}>CVV</label>
                  <input
                    id="card-cvv"
                    type="password"
                    maxLength="4"
                    className="form-input form-input-sm font-mono"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: NetBanking */}
          {razorpayTab === "netbanking" && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="select-bank" style={{ fontSize: "11px" }}>Select Bank</label>
              <select
                id="select-bank"
                className="form-select form-select-sm"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
              </select>
            </div>
          )}

          {/* Security details & Pay button */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ padding: "8px 12px", backgroundColor: "#0c2340", borderColor: "#0c2340" }}
              onClick={handleSimulatedRazorpayPayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <span className="flex-center justify-center gap-2">
                  <span className="spin">⚙️</span>
                  <span>Verifying & Authorizing ₹{cart.total}...</span>
                </span>
              ) : (
                <span className="flex-center justify-center gap-2">
                  <ShieldCheckIcon size={14} color="#10b981" />
                  <span>Authorize & Pay ₹{cart.total}</span>
                </span>
              )}
            </button>
            <div className="text-muted text-xs text-center" style={{ fontSize: "0.68rem", marginTop: "6px" }}>
              Powered by Razorpay Payments API • Cloud Sandbox Demo
            </div>
          </div>
        </div>
      </Modal>

      {/* DELIVER TO / ADD NEW ADDRESS MODAL */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSaveAddress={handleSaveNewAddress}
        userProfile={user}
      />
    </div>
  );
}

