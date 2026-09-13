import React from "react";
import Modal from "./Modal";
import { 
  PrinterIcon, 
  StoreIcon, 
  CreditCardIcon, 
  CheckCircleIcon, 
  ShieldCheckIcon,
  QrCodeIcon
} from "./Icons";

export default function InvoiceModal({ isOpen, onClose, order, customerInfo }) {
  if (!order) return null;

  const invoiceNumber = `INV-${order._id.slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const subtotal = order.totalAmount || 0;
  // Simulated GST breakdown (5% included in subtotal)
  const taxableAmount = (subtotal / 1.05).toFixed(2);
  const totalTax = (subtotal - taxableAmount).toFixed(2);
  const cgst = (totalTax / 2).toFixed(2);
  const sgst = (totalTax / 2).toFixed(2);

  const customerName = customerInfo?.name || order.customer?.name || "Verified Customer";
  const customerEmail = customerInfo?.email || order.customer?.email || "customer@localshop.cloud";

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Tax Invoice & Receipt"
      maxWidth="680px"
    >
      <div className="invoice-container" id="printable-invoice">
        {/* Invoice Top Header */}
        <div className="invoice-header">
          <div className="invoice-brand">
            <div className="flex-center gap-2">
              <div className="logo-icon-sm" style={{ width: "28px", height: "28px" }}>
                <StoreIcon size={16} color="#ffffff" />
              </div>
              <div>
                <h3 className="invoice-brand-title">LocalShop Cloud</h3>
                <span className="invoice-brand-subtitle">Hyperlocal Commerce Platform</span>
              </div>
            </div>
            <div className="invoice-platform-meta">
              <span>GSTIN: <strong>29ABCDE1234F1Z5</strong></span>
              <span>Cloud Node: <strong>Vercel-Render-Atlas</strong></span>
            </div>
          </div>

          <div className="invoice-meta-right">
            <div className="invoice-badge">TAX INVOICE</div>
            <div className="invoice-detail-row">
              <span className="invoice-meta-label">Invoice No:</span>
              <span className="invoice-meta-val font-mono">{invoiceNumber}</span>
            </div>
            <div className="invoice-detail-row">
              <span className="invoice-meta-label">Order Ref:</span>
              <span className="invoice-meta-val font-mono">#{order._id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="invoice-detail-row">
              <span className="invoice-meta-label">Date & Time:</span>
              <span className="invoice-meta-val">{orderDate}</span>
            </div>
          </div>
        </div>

        <div className="invoice-divider" />

        {/* Customer & Payment Info Columns */}
        <div className="invoice-info-grid">
          <div className="invoice-info-box">
            <h4 className="invoice-section-title">Billed & Shipped To:</h4>
            <div className="invoice-info-content">
              <p className="font-semibold text-xs">{customerName}</p>
              <p className="text-muted text-xs">{customerEmail}</p>
              <p className="text-muted text-xs font-medium" style={{ marginTop: "4px" }}>
                {order.address || "Standard Local Delivery Address"}
              </p>
            </div>
          </div>

          <div className="invoice-info-box">
            <h4 className="invoice-section-title">Payment & Settlement:</h4>
            <div className="invoice-info-content">
              <div className="invoice-pay-row">
                <span className="text-muted text-xs">Payment Method:</span>
                <span className="font-semibold text-xs flex-center gap-1">
                  <CreditCardIcon size={11} color="#2563eb" />
                  {order.paymentMethod === "razorpay" ? "Razorpay Online (Prepaid)" : "Cash on Delivery (COD)"}
                </span>
              </div>
              <div className="invoice-pay-row">
                <span className="text-muted text-xs">Payment Status:</span>
                <span className={`font-semibold text-xs ${order.paymentStatus === "paid" || order.paymentMethod === "razorpay" ? "text-success" : "text-muted"}`}>
                  {order.paymentStatus === "paid" || order.paymentMethod === "razorpay" ? "PAID / SETTLED" : "PAYMENT ON DELIVERY"}
                </span>
              </div>
              {order.paymentId && (
                <div className="invoice-pay-row">
                  <span className="text-muted text-xs">Transaction ID:</span>
                  <span className="font-mono text-xs font-semibold">{order.paymentId}</span>
                </div>
              )}
              {order.refundStatus === "processed" && (
                <div className="invoice-pay-row" style={{ marginTop: "4px", backgroundColor: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>
                  <span className="text-success text-xs font-semibold">Refund Status:</span>
                  <span className="text-success text-xs font-bold">PROCESSED (₹{order.refundAmount || order.totalAmount})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Products Table */}
        <div className="invoice-table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: "35px" }}>#</th>
                <th>Item Description</th>
                <th style={{ width: "70px", textAlign: "right" }}>Unit Price</th>
                <th style={{ width: "45px", textAlign: "center" }}>Qty</th>
                <th style={{ width: "65px", textAlign: "right" }}>Tax (5%)</th>
                <th style={{ width: "85px", textAlign: "right" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => {
                const itemTotal = item.price * item.qty;
                const itemTax = (itemTotal * 0.05).toFixed(2);
                return (
                  <tr key={idx}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <span className="font-medium text-xs">{item.name}</span>
                      {item.status === "cancelled" && (
                        <span className="badge badge-danger text-xs" style={{ marginLeft: "6px", fontSize: "9px" }}>Cancelled</span>
                      )}
                      {item.status === "refunded" && (
                        <span className="badge badge-retailer text-xs" style={{ marginLeft: "6px", fontSize: "9px" }}>Refunded</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>₹{item.price.toFixed(2)}</td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{item.qty}</td>
                    <td style={{ textAlign: "right" }} className="text-muted">₹{itemTax}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹{itemTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation */}
        <div className="invoice-summary-grid">
          <div className="invoice-legal-note">
            <div className="flex-center gap-1 text-muted text-xs" style={{ marginBottom: "4px" }}>
              <ShieldCheckIcon size={13} color="#10b981" />
              <span className="font-semibold text-success">Verified LocalShop Cloud Digital Invoice</span>
            </div>
            <p className="text-muted text-xs" style={{ fontSize: "10px", lineHeight: "1.3" }}>
              This is a cryptographically verified computer-generated invoice. No physical signature is required. Subject to local jurisdiction.
            </p>
            <div className="invoice-qr-badge">
              <QrCodeIcon size={28} color="#475569" />
              <span className="font-mono text-xs" style={{ fontSize: "9px" }}>
                AUTH-{order._id.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="invoice-totals-box">
            <div className="invoice-tot-row">
              <span className="text-muted text-xs">Taxable Value:</span>
              <span className="text-xs">₹{taxableAmount}</span>
            </div>
            <div className="invoice-tot-row">
              <span className="text-muted text-xs">CGST (2.5%):</span>
              <span className="text-xs">₹{cgst}</span>
            </div>
            <div className="invoice-tot-row">
              <span className="text-muted text-xs">SGST (2.5%):</span>
              <span className="text-xs">₹{sgst}</span>
            </div>
            <div className="invoice-tot-row">
              <span className="text-muted text-xs">Delivery / Handling:</span>
              <span className="text-xs text-success font-semibold">FREE</span>
            </div>
            <div className="invoice-divider-sm" />
            <div className="invoice-tot-row invoice-grand-total">
              <span className="font-bold text-xs">Grand Total:</span>
              <span className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="modal-actions" style={{ marginTop: "16px" }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
        >
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handlePrint}
        >
          <PrinterIcon size={13} />
          Print / Save PDF
        </button>
      </div>
    </Modal>
  );
}
