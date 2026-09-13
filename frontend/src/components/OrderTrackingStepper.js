import React from "react";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PackageIcon, 
  TruckIcon, 
  StoreIcon, 
  RefreshCwIcon,
  XIcon
} from "./Icons";

/**
 * Visual Order Tracking Stepper
 * Renders real-time multi-stage status progression with responsive indicators.
 */
export default function OrderTrackingStepper({ order }) {
  if (!order || !order.items || order.items.length === 0) return null;

  const items = order.items;
  const allCancelled = items.every((i) => i.status === "cancelled");
  const anyReturnRequested = items.some((i) => i.status === "return_requested");
  const allRefunded = items.some((i) => i.status === "refunded") || order.refundStatus === "processed";
  const allFulfilled = items.every((i) => i.status === "fulfilled" || i.status === "refunded" || i.status === "return_requested");
  const anyFulfilled = items.some((i) => i.status === "fulfilled");

  // Determine flow type
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
        desc: order.cancellationReason || "Cancelled before fulfillment",
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

  if (anyReturnRequested || allRefunded) {
    const returnSteps = [
      {
        id: "delivered",
        label: "Delivered",
        desc: "Item delivered to customer",
        status: "complete",
        icon: <CheckCircleIcon size={14} />,
      },
      {
        id: "return_req",
        label: "Return Requested",
        desc: "Customer requested return & refund",
        status: "complete",
        icon: <RefreshCwIcon size={14} />,
      },
      {
        id: "review",
        label: "Retailer Review",
        desc: allRefunded ? "Return approved & catalog restocked" : "Store reviewing request reason",
        status: allRefunded ? "complete" : "current",
        icon: <StoreIcon size={14} />,
      },
      {
        id: "refund_done",
        label: "Refund Complete",
        desc: allRefunded ? `₹${order.refundAmount || order.totalAmount} refunded to customer` : "Awaiting store approval",
        status: allRefunded ? "complete" : "upcoming",
        icon: <CheckCircleIcon size={14} />,
      },
    ];

    return (
      <div className="order-stepper-container order-stepper-return">
        <div className="order-stepper-header">
          <span className="stepper-title">Return & Refund Progress</span>
          <span className="stepper-badge text-warning">
            {allRefunded ? "Refund Completed" : "Return Under Review"}
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

  // Standard Hyperlocal Delivery Flow
  const isFulfilled = allFulfilled;
  const isProcessing = !allFulfilled && anyFulfilled;

  const steps = [
    {
      id: "placed",
      label: "Order Placed",
      desc: "Received & verified by store",
      status: "complete",
      icon: <ClockIcon size={14} />,
    },
    {
      id: "processing",
      label: "Packing & Quality Check",
      desc: isFulfilled || isProcessing ? "Items packed & ready for dispatch" : "Retailer packing items",
      status: isFulfilled ? "complete" : "current",
      icon: <PackageIcon size={14} />,
    },
    {
      id: "dispatch",
      label: "Out for Delivery",
      desc: isFulfilled ? "Dispatched from local hub" : isProcessing ? "Driver assigned" : "Estimated within 2 hrs",
      status: isFulfilled ? "complete" : isProcessing ? "current" : "upcoming",
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
        <span className={`stepper-badge ${isFulfilled ? "text-success" : "text-primary"}`}>
          {isFulfilled ? "Delivered" : "In Transit / Packing"}
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
    </div>
  );
}
