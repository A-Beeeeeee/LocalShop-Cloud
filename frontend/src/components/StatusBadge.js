import React from "react";

export default function StatusBadge({ status, label, size = "md" }) {
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "-");
  
  let variant = "badge-default";
  let displayLabel = label || status;

  if (["pending", "low-stock", "low_stock", "pending-approval"].includes(normalized)) {
    variant = "badge-warning";
    if (!label && normalized === "pending") displayLabel = "Pending";
  } else if (["fulfilled", "approved", "in-stock", "in_stock", "active"].includes(normalized)) {
    variant = "badge-success";
    if (!label && normalized === "fulfilled") displayLabel = "Fulfilled";
    if (!label && normalized === "approved") displayLabel = "Approved";
  } else if (["cancelled", "out-of-stock", "out_of_stock", "rejected"].includes(normalized)) {
    variant = "badge-danger";
    if (!label && normalized === "cancelled") displayLabel = "Cancelled";
  } else if (["customer", "retailer", "admin"].includes(normalized)) {
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
