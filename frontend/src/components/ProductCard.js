import React from "react";

export default function ProductCard({ product, onAdd }) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="card product-card">
      <div className="product-image-placeholder">IMG</div>
      <p className="product-name">{product.name}</p>
      <p className="product-shop">{product.retailer?.shopName || product.retailer?.name || ""}</p>
      <p className="product-stock" style={{ color: isOutOfStock ? "#d32f2f" : "#4caf50", fontSize: "0.85rem", marginTop: "0.25rem" }}>
        {isOutOfStock ? "Out of Stock" : `${product.stock} in stock`}
      </p>
      <div className="product-footer">
        <span className="product-price">₹{product.price}</span>
        {onAdd && (
          <button 
            className="small-btn" 
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? "not-allowed" : "pointer" }}
          >
            {isOutOfStock ? "Out of Stock" : "Add"}
          </button>
        )}
      </div>
    </div>
  );
}
