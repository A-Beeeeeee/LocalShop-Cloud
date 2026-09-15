import React, { useState } from "react";
import Modal from "./Modal";
import { 
  CartIcon, 
  PackageIcon, 
  StoreIcon, 
  ShieldCheckIcon, 
  TruckIcon, 
  PlusIcon, 
  MinusIcon, 
  CheckIcon 
} from "./Icons";

export default function ProductDetailsModal({ isOpen, onClose, product, onAdd }) {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const shopName = product.retailer?.shopName || product.retailer?.name || "Verified Local Retailer";
  const maxQty = Math.max(1, product.stock || 1);

  function handleIncrement() {
    if (qty < maxQty) setQty((prev) => prev + 1);
  }

  function handleDecrement() {
    if (qty > 1) setQty((prev) => prev - 1);
  }

  function handleAddToCart() {
    if (isOutOfStock) return;
    for (let i = 0; i < qty; i++) {
      onAdd(product);
    }
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      maxWidth="640px"
    >
      <div className="product-details-grid">
        {/* Left Column: Product Image */}
        <div className="product-details-image-wrap">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-details-img"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="product-details-fallback"
            style={{ display: product.imageUrl ? "none" : "flex" }}
          >
            <PackageIcon size={48} color="#94a3b8" />
          </div>

          <div className="product-details-img-tag">
            <span>{product.category || "General"}</span>
          </div>
        </div>

        {/* Right Column: Product Specs & Actions */}
        <div className="product-details-info">
          <div className="product-details-shop-badge">
            <StoreIcon size={13} color="#2563eb" />
            <span className="font-semibold text-xs text-primary">{shopName}</span>
            <span className="badge-verified flex-center gap-1">
              <ShieldCheckIcon size={11} color="#059669" /> Verified Store
            </span>
          </div>

          <h2 className="product-details-title">{product.name}</h2>

          <div className="product-details-price-row">
            <div className="flex-center gap-1">
              <span className="product-details-currency">₹</span>
              <span className="product-details-price">{product.price}</span>
            </div>
            <span className="product-details-tax-hint">Inclusive of all taxes</span>
          </div>

          {/* Live Stock Indicator */}
          <div style={{ margin: "8px 0" }}>
            {isOutOfStock ? (
              <span className="product-stock-pill product-stock-out">
                <span className="stock-dot stock-dot-red" />
                Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="product-stock-pill product-stock-low">
                <span className="stock-dot stock-dot-amber" />
                Hurry, only {product.stock} units left in stock!
              </span>
            ) : (
              <span className="product-stock-pill product-stock-in">
                <span className="stock-dot stock-dot-emerald" />
                In Stock ({product.stock} available for fast delivery)
              </span>
            )}
          </div>

          {/* Full Un-truncated Description */}
          <div className="product-details-desc-box">
            <h4 className="product-details-section-title">Product Description</h4>
            <p className="product-details-desc-text">
              {product.description || "No specific description provided by retailer for this item."}
            </p>
          </div>

          {/* Delivery & Assurance Perks */}
          <div className="product-details-perks">
            <div className="product-detail-perk">
              <TruckIcon size={13} color="#2563eb" />
              <span>Express Hyperlocal Delivery</span>
            </div>
            <div className="product-detail-perk">
              <CheckIcon size={13} color="#059669" />
              <span>Freshness & Quality Guaranteed</span>
            </div>
          </div>

          {/* Quantity Picker & Add to Cart */}
          <div className="product-details-actions">
            {!isOutOfStock && (
              <div className="qty-picker">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={handleDecrement}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <MinusIcon size={12} />
                </button>
                <span className="qty-val">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={handleIncrement}
                  disabled={qty >= maxQty}
                  aria-label="Increase quantity"
                >
                  <PlusIcon size={12} />
                </button>
              </div>
            )}

            <button
              type="button"
              className={`btn ${isOutOfStock ? "btn-disabled" : "btn-primary"} product-details-add-btn`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <CartIcon size={15} />
              <span>
                {isOutOfStock ? "Out of Stock" : `Add to Cart • ₹${product.price * qty}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
