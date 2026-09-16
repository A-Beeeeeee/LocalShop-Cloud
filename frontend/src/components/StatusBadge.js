import React from "react";

export default function StatusBadge({ status, label, size = "md" }) {
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "-");
  
  let variant = "badge-default";
  let displayLabel = label || status;

  if (["pending", "low-stock", "low_stock", "pending-approval"].includes(normalized)) {
    variant = "badge-warning";
    if (!label && normalized === "pending") displayLabel = "Pending";
  } else if (["return-requested", "return_requested"].includes(normalized)) {
    variant = "badge-warning";
    if (!label) displayLabel = "Return Requested";
  } else if (["refunded"].includes(normalized)) {
    variant = "badge-retailer";
    if (!label) displayLabel = "Refunded";
  } else if (["fulfilled", "approved", "in-stock", "in_stock", "active", "delivered"].includes(normalized)) {
    variant = "badge-success";
    if (!label && normalized === "fulfilled") displayLabel = "Fulfilled";
    if (!label && normalized === "approved") displayLabel = "Approved";
    if (!label && normalized === "delivered") displayLabel = "Delivered";
  } else if (["assigned", "picked_up", "picked-up", "out_for_delivery", "out-for-delivery"].includes(normalized)) {
    variant = "badge-retailer";
    if (!label && (normalized === "out_for_delivery" || normalized === "out-for-delivery")) displayLabel = "Out for Delivery";
    if (!label && (normalized === "picked_up" || normalized === "picked-up")) displayLabel = "Picked Up";
    if (!label && normalized === "assigned") displayLabel = "Rider Assigned";
  } else if (["unassigned"].includes(normalized)) {
    variant = "badge-warning";
    if (!label) displayLabel = "Ready for Pickup";
  } else if (["cancelled", "out-of-stock", "out_of_stock", "rejected", "failed"].includes(normalized)) {
    variant = "badge-danger";
    if (!label && normalized === "cancelled") displayLabel = "Cancelled";
  } else if (["customer", "retailer", "admin", "delivery"].includes(normalized)) {
    variant = `badge-${normalized}`;
  }

  const sizeClass = size === "sm" ? "badge-sm" : "";

  return (
    <span className={`status-badge ${variant} ${sizeClass}`}>
      <span className="badge-dot" />
      {displayLabel}
    </span>
  );
}
