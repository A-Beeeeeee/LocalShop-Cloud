import React, { useState } from "react";
import Modal from "./Modal";
import { 
  NavigationIcon, 
  MapPinIcon, 
  StoreIcon, 
  PhoneIcon, 
  ExternalLinkIcon, 
  CompassIcon
} from "./Icons";

/**
 * MapNavigationModal
 * Interactive in-app Google Maps viewer and Turn-by-Turn GPS navigation launcher
 * for delivery partners.
 */
export default function MapNavigationModal({ isOpen, onClose, order, initialTarget = "customer" }) {
  const [navTarget, setNavTarget] = useState(initialTarget); // "store" | "customer" | "route"

  if (!order) return null;

  const retailer = order.items?.[0]?.retailer;
  const storeName = retailer?.shopName || retailer?.name || "Local Retail Partner";
  
  // Format retailer store address
  let storeAddress = "";
  if (retailer?.addresses && retailer.addresses.length > 0) {
    const addr = retailer.addresses[0];
    storeAddress = `${addr.flat || ""}, ${addr.area || ""}, ${addr.city || "Chennai"} ${addr.pincode || ""}`.trim();
  } else {
    storeAddress = `${storeName}, Local Merchant, Chennai, Tamil Nadu`;
  }

  const customerName = order.customer?.name || "Customer";
  const customerAddress = order.address || "Local Delivery Point, Chennai";

  // Google Maps Universal URLs
  const storeMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}`;
  const customerMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}`;
  const fullRouteMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(storeAddress)}&destination=${encodeURIComponent(customerAddress)}&travelmode=two_wheeler`;

  const isPickedUp = order.deliveryStatus === "out_for_delivery" || order.deliveryStatus === "picked_up";
  const isDelivered = order.deliveryStatus === "delivered";

  // Active query for Google Maps Embed
  let activeEmbedQuery = customerAddress;
  let activeTitle = `Navigate to Customer: ${customerName}`;
  let activeExternalUrl = customerMapsUrl;

  if (navTarget === "store") {
    activeEmbedQuery = storeAddress;
    activeTitle = `Navigate to Store: ${storeName}`;
    activeExternalUrl = storeMapsUrl;
  } else if (navTarget === "route") {
    activeEmbedQuery = `${customerAddress}`;
    activeTitle = `Route: ${storeName} to ${customerName}`;
    activeExternalUrl = fullRouteMapsUrl;
  }

  // Safe Google Maps Embed URI (no API key required)
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeEmbedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Maps Live GPS Navigation"
      maxWidth="720px"
    >
      <div className="map-navigation-modal-content">
        {/* Navigation Mode Switcher */}
        <div className="tab-bar" style={{ marginBottom: "12px" }}>
          <button
            type="button"
            className={`tab-btn ${navTarget === "store" ? "tab-btn-active" : ""}`}
            onClick={() => setNavTarget("store")}
          >
            <StoreIcon size={14} />
            <span>1. Store Pickup</span>
            {!isPickedUp && <span className="badge badge-warning text-xs" style={{ fontSize: "9px", padding: "1px 4px" }}>Next</span>}
          </button>
          <button
            type="button"
            className={`tab-btn ${navTarget === "customer" ? "tab-btn-active" : ""}`}
            onClick={() => setNavTarget("customer")}
          >
            <MapPinIcon size={14} />
            <span>2. Customer Dropoff</span>
            {isPickedUp && !isDelivered && <span className="badge badge-success text-xs" style={{ fontSize: "9px", padding: "1px 4px" }}>Active</span>}
          </button>
          <button
            type="button"
            className={`tab-btn ${navTarget === "route" ? "tab-btn-active" : ""}`}
            onClick={() => setNavTarget("route")}
          >
            <NavigationIcon size={14} />
            <span>Full Route Overview</span>
          </button>
        </div>

        {/* Dynamic Route Info Header */}
        <div style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div>
            <div className="flex-center gap-1" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase" }}>
              <CompassIcon size={13} />
              <span>{activeTitle}</span>
            </div>
            <div className="font-semibold text-xs" style={{ marginTop: "2px", color: "#1e293b" }}>
              {navTarget === "store" ? storeAddress : customerAddress}
            </div>
          </div>

          <a
            href={activeExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)"
            }}
          >
            <NavigationIcon size={13} />
            <span>Open Google Maps GPS</span>
            <ExternalLinkIcon size={12} />
          </a>
        </div>

        {/* Embedded Interactive Google Map */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "320px",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          backgroundColor: "#e2e8f0"
        }}>
          <iframe
            title="Google Maps Navigation View"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Waypoint Details and Contact Shortcuts */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "12px"
        }}>
          {/* Store Point Box */}
          <div style={{
            backgroundColor: navTarget === "store" ? "#f0fdf4" : "#f8fafc",
            border: navTarget === "store" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px"
          }}>
            <div className="flex-between">
              <span className="text-xs font-bold uppercase flex-center gap-1" style={{ color: "#0284c7" }}>
                <StoreIcon size={12} />
                <span>Pickup: {storeName}</span>
              </span>
              {retailer?.phone && (
                <a href={`tel:${retailer.phone}`} className="btn btn-secondary btn-sm" style={{ padding: "1px 6px", fontSize: "10px" }}>
                  <PhoneIcon size={10} /> Call Store
                </a>
              )}
            </div>
            <div className="text-muted text-xs truncate" style={{ marginTop: "4px" }} title={storeAddress}>
              {storeAddress}
            </div>
            <div style={{ marginTop: "6px" }}>
              <a
                href={storeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary flex-center gap-1"
                style={{ textDecoration: "underline" }}
              >
                <span>Navigate to Store in Google Maps</span>
                <ExternalLinkIcon size={10} />
              </a>
            </div>
          </div>

          {/* Customer Point Box */}
          <div style={{
            backgroundColor: navTarget === "customer" ? "#f0fdf4" : "#f8fafc",
            border: navTarget === "customer" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px"
          }}>
            <div className="flex-between">
              <span className="text-xs font-bold uppercase flex-center gap-1" style={{ color: "var(--color-primary)" }}>
                <MapPinIcon size={12} />
                <span>Dropoff: {customerName}</span>
              </span>
              {order.customer?.phone && (
                <a href={`tel:${order.customer.phone}`} className="btn btn-secondary btn-sm" style={{ padding: "1px 6px", fontSize: "10px" }}>
                  <PhoneIcon size={10} /> Call Customer
                </a>
              )}
            </div>
            <div className="text-muted text-xs truncate" style={{ marginTop: "4px" }} title={customerAddress}>
              {customerAddress}
            </div>
            <div style={{ marginTop: "6px" }}>
              <a
                href={customerMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary flex-center gap-1"
                style={{ textDecoration: "underline" }}
              >
                <span>Navigate to Customer in Google Maps</span>
                <ExternalLinkIcon size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-actions" style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close Map
          </button>

          <a
            href={fullRouteMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <NavigationIcon size={13} />
            <span>Launch Complete GPS Turn-by-Turn</span>
            <ExternalLinkIcon size={12} />
          </a>
        </div>
      </div>
    </Modal>
  );
}
