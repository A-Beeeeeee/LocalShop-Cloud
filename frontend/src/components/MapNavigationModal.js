import React, { useState } from "react";
import Modal from "./Modal";
import { 
  NavigationIcon, 
  MapPinIcon, 
  StoreIcon, 
  PhoneIcon, 
  ExternalLinkIcon, 
  CompassIcon,
  BagIcon
} from "./Icons";
import {
  extractRecipientInfo,
  extractUniqueStores,
  getStoreMapsUrl,
  getCustomerMapsUrl,
  getMultiStopRouteUrl
} from "../utils/mapsHelper";

/**
 * MapNavigationModal
 * Interactive in-app Google Maps viewer and Turn-by-Turn GPS navigation launcher
 * with full support for single-store and multi-store delivery routes, plus
 * intelligent address sanitization (removing contact annotations so GPS pins accurately).
 */
export default function MapNavigationModal({ isOpen, onClose, order, initialTarget = "customer" }) {
  const [selectedTarget, setSelectedTarget] = useState(initialTarget); // "store_0", "store_1", ..., "customer", "route"

  if (!order) return null;

  // Extract all unique stores involved in this order
  const stores = extractUniqueStores(order);
  const isMultiStore = stores.length > 1;

  // Extract cleaned customer address and recipient contact details
  const customerInfo = extractRecipientInfo(order.address, order.customer?.name || "Customer", order.customer?.phone || "");
  const cleanCustomerAddress = customerInfo.cleanAddress;

  const isPickedUp = order.deliveryStatus === "out_for_delivery" || order.deliveryStatus === "picked_up";
  const isDelivered = order.deliveryStatus === "delivered";

  // Resolve active target
  let activeTarget = selectedTarget;
  if (activeTarget === "store") {
    activeTarget = "store_0";
  }

  // Full multi-stop route URL
  const fullRouteMapsUrl = getMultiStopRouteUrl(stores, cleanCustomerAddress);
  const customerMapsUrl = getCustomerMapsUrl(cleanCustomerAddress);

  // Compute active embed query and active title
  let activeEmbedQuery = cleanCustomerAddress;
  let activeTitle = `Navigate to Customer: ${customerInfo.name}`;
  let activeExternalUrl = customerMapsUrl;

  if (activeTarget.startsWith("store_")) {
    const storeIdx = parseInt(activeTarget.replace("store_", ""), 10) || 0;
    const targetStore = stores[storeIdx] || stores[0];
    if (targetStore) {
      activeEmbedQuery = targetStore.cleanAddress;
      activeTitle = `Pickup (${storeIdx + 1}/${stores.length}): ${targetStore.storeName}`;
      activeExternalUrl = getStoreMapsUrl(targetStore.cleanAddress);
    }
  } else if (activeTarget === "route") {
    activeEmbedQuery = cleanCustomerAddress;
    activeTitle = isMultiStore 
      ? `Multi-Stop Route: ${stores.map(s => s.storeName).join(" ➔ ")} ➔ ${customerInfo.name}`
      : `Route: ${stores[0]?.storeName || "Store"} ➔ ${customerInfo.name}`;
    activeExternalUrl = fullRouteMapsUrl;
  }

  // Safe Google Maps Embed URI with clean query
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeEmbedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isMultiStore ? `Google Maps Navigation (Multi-Store: ${stores.length} Pickups)` : "Google Maps Live GPS Navigation"}
      maxWidth="820px"
    >
      <div className="map-navigation-modal-content" style={{ width: "100%", minWidth: 0 }}>
        {/* Navigation Mode Switcher Tabs */}
        <div className="tab-bar" style={{ marginBottom: "12px", overflowX: "auto", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {stores.map((store, idx) => {
            const tabKey = `store_${idx}`;
            const isSelected = activeTarget === tabKey;
            return (
              <button
                key={store.id}
                type="button"
                className={`tab-btn ${isSelected ? "tab-btn-active" : ""}`}
                onClick={() => setSelectedTarget(tabKey)}
                style={{ fontSize: "11.5px", padding: "6px 12px" }}
              >
                <StoreIcon size={13} />
                <span>{isMultiStore ? `${idx + 1}. Store: ${store.storeName}` : "1. Store Pickup"}</span>
                {!isPickedUp && idx === 0 && (
                  <span className="badge badge-warning text-xs" style={{ fontSize: "9px", padding: "1px 4px" }}>
                    Next
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className={`tab-btn ${activeTarget === "customer" ? "tab-btn-active" : ""}`}
            onClick={() => setSelectedTarget("customer")}
            style={{ fontSize: "11.5px", padding: "6px 12px" }}
          >
            <MapPinIcon size={13} />
            <span>{stores.length + 1}. Customer Dropoff</span>
            {isPickedUp && !isDelivered && (
              <span className="badge badge-success text-xs" style={{ fontSize: "9px", padding: "1px 4px" }}>
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTarget === "route" ? "tab-btn-active" : ""}`}
            onClick={() => setSelectedTarget("route")}
            style={{ fontSize: "11.5px", padding: "6px 12px" }}
          >
            <NavigationIcon size={13} />
            <span>{isMultiStore ? "Full Multi-Stop Route" : "Full Route Overview"}</span>
          </button>
        </div>

        {/* Dynamic Route Info Header */}
        <div style={{
          backgroundColor: "var(--color-primary-subtle)",
          border: "1px solid var(--color-primary-border)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          minWidth: 0
        }}>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div className="flex-center gap-1" style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase" }}>
              <CompassIcon size={13} />
              <span className="truncate">{activeTitle}</span>
            </div>
            <div className="font-semibold text-xs truncate" style={{ marginTop: "2px", color: "var(--color-text)" }} title={activeEmbedQuery}>
              {activeEmbedQuery}
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
              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
              flexShrink: 0
            }}
          >
            <NavigationIcon size={13} />
            <span>Open in Google Maps App</span>
            <ExternalLinkIcon size={12} />
          </a>
        </div>

        {/* Embedded Interactive Google Map */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "300px",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-subtle)"
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
        <div style={{ marginTop: "14px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "8px" }}>
            Trip Waypoints & Contact Details ({stores.length} Store{stores.length > 1 ? "s" : ""} ➔ Customer)
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: stores.length > 1 ? "repeat(auto-fit, minmax(240px, 1fr))" : "repeat(2, minmax(0, 1fr))",
            gap: "10px",
            width: "100%"
          }}>
            {/* Store Waypoints */}
            {stores.map((store, idx) => {
              const isTargetActive = activeTarget === `store_${idx}`;
              return (
                <div
                  key={store.id}
                  style={{
                    backgroundColor: isTargetActive ? "var(--color-primary-subtle)" : "var(--color-surface-subtle)",
                    border: isTargetActive ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px",
                    minWidth: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div className="flex-between gap-1">
                      <span className="text-xs font-bold uppercase flex-center gap-1 truncate" style={{ color: "#0284c7" }} title={`Store ${idx + 1}: ${store.storeName}`}>
                        <StoreIcon size={12} style={{ flexShrink: 0 }} />
                        <span className="truncate">{isMultiStore ? `Stop ${idx + 1}: ${store.storeName}` : `Pickup: ${store.storeName}`}</span>
                      </span>
                      {store.phone && (
                        <a href={`tel:${store.phone}`} className="btn btn-secondary btn-sm" style={{ padding: "1px 6px", fontSize: "10px", flexShrink: 0 }}>
                          <PhoneIcon size={10} /> Call Store
                        </a>
                      )}
                    </div>

                    <div className="text-muted text-xs truncate" style={{ marginTop: "4px" }} title={store.cleanAddress}>
                      {store.cleanAddress}
                    </div>

                    <div className="text-muted text-xs truncate" style={{ marginTop: "4px", fontSize: "10.5px" }}>
                      <BagIcon size={11} style={{ display: "inline", marginRight: "3px" }} />
                      <strong>Items ({store.items.length}):</strong> {store.items.map(i => `${i.qty}x ${i.name}`).join(", ")}
                    </div>
                  </div>

                  <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedTarget(`store_${idx}`)}
                      style={{ padding: "3px 8px", fontSize: "10.5px", flex: 1 }}
                    >
                      <CompassIcon size={10} />
                      <span>View on Map</span>
                    </button>
                    <a
                      href={getStoreMapsUrl(store.cleanAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ padding: "3px 8px", fontSize: "10.5px", flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                    >
                      <NavigationIcon size={10} />
                      <span>GPS</span>
                      <ExternalLinkIcon size={9} />
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Customer Point Box */}
            <div style={{
              backgroundColor: activeTarget === "customer" ? "var(--color-primary-subtle)" : "var(--color-surface-subtle)",
              border: activeTarget === "customer" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px",
              minWidth: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div className="flex-between gap-1">
                  <span className="text-xs font-bold uppercase flex-center gap-1 truncate" style={{ color: "var(--color-primary)" }} title={`Dropoff: ${customerInfo.name}`}>
                    <MapPinIcon size={12} style={{ flexShrink: 0 }} />
                    <span className="truncate">Final Dropoff: {customerInfo.name}</span>
                  </span>
                  {customerInfo.phone && (
                    <a href={`tel:${customerInfo.phone}`} className="btn btn-secondary btn-sm" style={{ padding: "1px 6px", fontSize: "10px", flexShrink: 0 }}>
                      <PhoneIcon size={10} /> Call Customer
                    </a>
                  )}
                </div>

                <div className="text-muted text-xs truncate" style={{ marginTop: "4px" }} title={cleanCustomerAddress}>
                  {cleanCustomerAddress}
                </div>

                {customerInfo.phone && (
                  <div className="text-muted text-xs truncate" style={{ marginTop: "4px", fontSize: "10.5px" }}>
                    <strong>Phone:</strong> {customerInfo.phone}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedTarget("customer")}
                  style={{ padding: "3px 8px", fontSize: "10.5px", flex: 1 }}
                >
                  <CompassIcon size={10} />
                  <span>View on Map</span>
                </button>
                <a
                  href={customerMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ padding: "3px 8px", fontSize: "10.5px", flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                >
                  <NavigationIcon size={10} />
                  <span>GPS</span>
                  <ExternalLinkIcon size={9} />
                </a>
              </div>
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
            <span>{isMultiStore ? "Launch Full Multi-Stop GPS Route" : "Launch Complete GPS Turn-by-Turn"}</span>
            <ExternalLinkIcon size={12} />
          </a>
        </div>
      </div>
    </Modal>
  );
}
