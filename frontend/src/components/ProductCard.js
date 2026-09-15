import React from "react";
import { CartIcon, PackageIcon, StoreIcon, EyeIcon } from "./Icons";

export default function ProductCard({ product, onAdd, onSelect }) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const shopName = product.retailer?.shopName || product.retailer?.name || "Local Retailer";

  return (
    <div 
      className="product-card" 
      onClick={() => onSelect && onSelect(product)}
      style={{ cursor: onSelect ? "pointer" : "default" }}
    >
      <div className="product-image-container">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="product-img"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div 
          className="product-image-fallback" 
          style={{ display: product.imageUrl ? "none" : "flex" }}
        >
          <PackageIcon size={28} color="#94a3b8" />
        </div>
        
        <div className="product-card-top-badges">
          {product.category && (
            <span className="product-category-tag">{product.category}</span>
          )}
          {isOutOfStock ? (
            <span className="product-stock-pill product-stock-out">
              <span className="stock-dot stock-dot-red" />
              Out of stock
            </span>
          ) : isLowStock ? (
            <span className="product-stock-pill product-stock-low">
              <span className="stock-dot stock-dot-amber" />
              Only {product.stock} left
            </span>
          ) : (
            <span className="product-stock-pill product-stock-in">
              <span className="stock-dot stock-dot-emerald" />
              {product.stock} in stock
            </span>
          )}
        </div>

        {onSelect && (
          <div className="product-hover-overlay">
            <span className="product-quick-view-badge flex-center gap-1">
              <EyeIcon size={12} /> Quick View
            </span>
          </div>
        )}
      </div>

      <div className="product-content">
        <div className="product-shop-meta">
          <StoreIcon size={12} color="#64748b" />
          <span className="product-shop-name" title={shopName}>{shopName}</span>
        </div>

        <h3 className="product-title" title={product.name}>{product.name}</h3>

        {product.description && (
          <p className="product-desc" title={product.description}>
            {product.description}
          </p>
        )}

        <div className="product-footer">
          <div className="product-price-block">
            <span className="product-currency">₹</span>
            <span className="product-price-val">{product.price}</span>
            <span className="product-price-tax">incl. taxes</span>
          </div>

          {onAdd && (
            <button
              type="button"
              className={`btn btn-sm ${isOutOfStock ? "btn-disabled" : "btn-primary product-add-btn"}`}
              onClick={(e) => {
                e.stopPropagation();
                onAdd(product);
              }}
              disabled={isOutOfStock}
              title={isOutOfStock ? "Item is out of stock" : "Add to cart"}
            >
              <CartIcon size={13} />
              <span>{isOutOfStock ? "Out of Stock" : "Add"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
