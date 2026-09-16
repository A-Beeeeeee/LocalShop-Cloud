import React from "react";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PackageIcon, 
  TruckIcon, 
  StoreIcon, 
  RefreshCwIcon,
  XIcon,
  KeyIcon,
  ZapIcon,
  ShieldCheckIcon,
  BikeIcon,
  PhoneIcon
} from "./Icons";

/**
 * Visual Order Tracking Stepper
 * Renders real-time multi-stage status progression, Live Hyperlocal ETA, and Secure Doorstep Delivery OTP.
 */
export default function OrderTrackingStepper({ order }) {
  if (!order || !order.items || order.items.length === 0) return null;

  const items = order.items;
  const totalCount = items.length;
  
  const fulfilledItems = items.filter((i) => i.status === "fulfilled");
  const pendingItems = items.filter((i) => i.status === "pending");
  const cancelledItems = items.filter((i) => i.status === "cancelled");
  const returnRequestedItems = items.filter((i) => i.status === "return_requested");
  const refundedItems = items.filter((i) => i.status === "refunded");

  const allCancelled = totalCount > 0 && items.every((i) => i.status === "cancelled");
  const allRefundedOrReturned = totalCount > 0 && items.every((i) => i.status === "refunded" || i.status === "return_requested");
  
  // Active delivery items are those not cancelled or refunded
  const activeItems = items.filter((i) => i.status === "pending" || i.status === "fulfilled");
  const activeCount = activeItems.length;
  const allActiveFulfilled = activeCount > 0 && activeItems.every((i) => i.status === "fulfilled");
  const someActiveFulfilled = activeCount > 0 && fulfilledItems.length > 0;

  // Safe fallback 4-digit OTP derivation for legacy or new orders
  const deliveryOtp = order.deliveryOtp || (order._id ? (order._id.replace(/\D/g, "").slice(-4) || "4821") : "4821");

  // Case 1: Entire Order was Cancelled
  if (allCancelled) {
    const isOnlinePaid = order.paymentMethod === "razorpay";
    const cancelSteps = [
      {
        id: "placed",
        label: "Order Placed",
        desc: "Order confirmed by customer",
        status: "complete",
        icon: <ClockIcon size={14} />,
      },
      {
        id: "cancelled",
        label: "Order Cancelled",
        desc: order.cancellationReason || "Cancelled by customer / store",
        status: "cancelled",
        icon: <XIcon size={14} />,
      },
      {
        id: "refund",
        label: isOnlinePaid ? "Refund Processed" : "No Payment Due",
        desc: isOnlinePaid ? `₹${order.refundAmount || order.totalAmount} refunded to source` : "Cash on Delivery cancelled",
        status: isOnlinePaid ? "complete" : "inactive",
        icon: <CheckCircleIcon size={14} />,
      },
    ];

    return (
      <div className="order-stepper-container order-stepper-cancelled">
        <div className="order-stepper-header">
          <span className="stepper-title">Order Status: Cancelled</span>
          <span className="stepper-badge text-danger">Cancelled</span>
        </div>
        <div className="order-stepper-track">
          {cancelSteps.map((step, idx) => (
            <div key={step.id} className={`stepper-step stepper-step-${step.status}`}>
              <div className="stepper-step-indicator">
                <div className="stepper-node">{step.icon}</div>
                {idx < cancelSteps.length - 1 && <div className="stepper-line" />}
              </div>
              <div className="stepper-step-body">
                <span className="stepper-step-label">{step.label}</span>
                <span className="stepper-step-desc">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Case 2: Entire Order was Returned & Refunded
  if (allRefundedOrReturned) {
    const allRefundsProcessed = refundedItems.length === totalCount;
    const returnSteps = [
      {
        id: "delivered",
        label: "Delivered",
        desc: "Items delivered to customer",
        status: "complete",
        icon: <CheckCircleIcon size={14} />,
      },
      {
        id: "return_req",
        label: "Return Requested",
        desc: "Return request submitted",
        status: "complete",
        icon: <RefreshCwIcon size={14} />,
      },
      {
        id: "review",
        label: "Retailer Review",
        desc: allRefundsProcessed ? "Return approved & catalog restocked" : "Stores reviewing request reason",
        status: allRefundsProcessed ? "complete" : "current",
        icon: <StoreIcon size={14} />,
      },
      {
        id: "refund_done",
        label: "Refund Complete",
        desc: allRefundsProcessed ? `₹${order.refundAmount || order.totalAmount} refunded to customer` : "Awaiting store approval",
        status: allRefundsProcessed ? "complete" : "upcoming",
        icon: <CheckCircleIcon size={14} />,
      },
    ];

    return (
      <div className="order-stepper-container order-stepper-return">
        <div className="order-stepper-header">
          <span className="stepper-title">Return & Refund Progress</span>
          <span className="stepper-badge text-warning">
            {allRefundsProcessed ? "Refund Completed" : "Return Under Review"}
          </span>
        </div>
        <div className="order-stepper-track">
          {returnSteps.map((step, idx) => (
            <div key={step.id} className={`stepper-step stepper-step-${step.status}`}>
              <div className="stepper-step-indicator">
                <div className="stepper-node">{step.icon}</div>
                {idx < returnSteps.length - 1 && <div className="stepper-line" />}
              </div>
              <div className="stepper-step-body">
                <span className="stepper-step-label">{step.label}</span>
                <span className="stepper-step-desc">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Case 3: Standard / Multi-Store Live Delivery Flow (Default)
  const isFulfilled = allActiveFulfilled;
  const isPartiallyFulfilled = someActiveFulfilled && !allActiveFulfilled;

  const steps = [
    {
      id: "placed",
      label: "Order Placed",
      desc: "Received & verified by stores",
      status: "complete",
      icon: <ClockIcon size={14} />,
    },
    {
      id: "processing",
      label: "Packing & Quality Check",
      desc: isFulfilled 
        ? `All ${activeCount} active items packed`
        : isPartiallyFulfilled 
        ? `${fulfilledItems.length} of ${activeCount} items packed & dispatched` 
        : `Stores preparing ${activeCount} items`,
      status: isFulfilled ? "complete" : "current",
      icon: <PackageIcon size={14} />,
    },
    {
      id: "dispatch",
      label: "Out for Delivery",
      desc: isFulfilled 
        ? "All packages in transit / delivered" 
        : isPartiallyFulfilled 
        ? "Partial packages out for delivery" 
        : "Estimated within 30-45 mins",
      status: isFulfilled ? "complete" : isPartiallyFulfilled ? "current" : "upcoming",
      icon: <TruckIcon size={14} />,
    },
    {
      id: "delivered",
      label: "Delivered",
      desc: isFulfilled ? "Handed over to customer" : "Estimated soon",
      status: isFulfilled ? "complete" : "upcoming",
      icon: <CheckCircleIcon size={14} />,
    },
  ];

  return (
    <div className="order-stepper-container">
      <div className="order-stepper-header">
        <span className="stepper-title">Live Delivery Progress</span>
        <span className={`stepper-badge ${isFulfilled ? "text-success" : isPartiallyFulfilled ? "text-primary" : "text-warning"}`}>
          {isFulfilled 
            ? "Delivered (All items fulfilled)" 
            : isPartiallyFulfilled 
            ? `In Transit (${fulfilledItems.length} of ${activeCount} items fulfilled)` 
            : `Order Placed (${pendingItems.length} items awaiting packing)`}
        </span>
      </div>
      <div className="order-stepper-track">
        {steps.map((step, idx) => (
          <div key={step.id} className={`stepper-step stepper-step-${step.status}`}>
            <div className="stepper-step-indicator">
              <div className="stepper-node">
                {step.icon}
              </div>
              {idx < steps.length - 1 && <div className="stepper-line" />}
            </div>
            <div className="stepper-step-body">
              <span className="stepper-step-label">{step.label}</span>
              <span className="stepper-step-desc">{step.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hyperlocal Dispatch & Live Doorstep Delivery OTP Widget */}
      <div className="delivery-dispatch-card">
        <div className="delivery-dispatch-main">
          <div className="delivery-partner-badge">
            <span className={`radar-dot ${isFulfilled ? "radar-dot-success" : "radar-dot-active"}`} />
            <span className="delivery-partner-name flex-center gap-1">
              {isFulfilled ? (
                <span>Doorstep Handover Complete</span>
              ) : order.deliveryPartner ? (
                <>
                  <BikeIcon size={13} />
                  <span>
                    Rider: <strong>{order.deliveryPartner.name}</strong> ({order.deliveryPartner.vehicleType || "Bike"} • {order.deliveryPartner.vehicleNumber || "Partner"})
                  </span>
                </>
              ) : (
                <span>{order.courierPartner || "LocalShop HyperExpress • Local Courier Assigned"}</span>
              )}
            </span>
          </div>
          <div className="delivery-eta-text">
            <ZapIcon size={12} color={isFulfilled ? "#10b981" : "#d97706"} />
            <span>
              {isFulfilled 
                ? "Package verified & delivered to customer" 
                : order.deliveryPartner
                ? (order.deliveryStatus === "out_for_delivery" 
                    ? "Rider is en route to your address • Arriving soon" 
                    : "Rider assigned • Heading to local store for pickup")
                : isPartiallyFulfilled
                ? "In Transit • Arriving in ~15-25 mins"
                : "Express Local Delivery • Estimated within 30-45 mins"}
            </span>
            {!isFulfilled && order.deliveryPartner?.phone && (
              <a 
                href={`tel:${order.deliveryPartner.phone}`} 
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: "8px", padding: "1px 6px", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "3px" }}
              >
                <PhoneIcon size={10} /> Call Rider
              </a>
            )}
          </div>
        </div>

        {/* Secure 4-Digit Doorstep Delivery OTP */}
        <div className="delivery-otp-wrapper">
          <div className="delivery-otp-label">
            {isFulfilled ? <ShieldCheckIcon size={12} color="#10b981" /> : <KeyIcon size={12} color="#2563eb" />}
            <span>{isFulfilled ? "Handover Verified" : "Doorstep Delivery OTP"}</span>
          </div>
          <div className="delivery-otp-digits" title="Share with delivery partner upon doorstep handover">
            {deliveryOtp.split("").map((digit, idx) => (
              <span key={idx} className={`otp-digit ${isFulfilled ? "otp-digit-verified" : ""}`}>
                {digit}
              </span>
            ))}
          </div>
          <span className="delivery-otp-subtext">
            {isFulfilled ? "OTP Verified on Handover" : "Share with courier upon delivery"}
          </span>
        </div>
      </div>

      {/* Item-level refund/cancel summary note for partial orders */}
      {(refundedItems.length > 0 || returnRequestedItems.length > 0 || cancelledItems.length > 0) && (
        <div style={{
          marginTop: "8px",
          padding: "4px 8px",
          backgroundColor: "#f1f5f9",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          fontSize: "10.5px",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span>
            {refundedItems.length > 0 && `• ${refundedItems.length} item(s) refunded (₹${order.refundAmount || 0} processed)`}
            {returnRequestedItems.length > 0 && ` • ${returnRequestedItems.length} item(s) under return review`}
            {cancelledItems.length > 0 && ` • ${cancelledItems.length} item(s) cancelled`}
          </span>
        </div>
      )}
    </div>
  );
}

