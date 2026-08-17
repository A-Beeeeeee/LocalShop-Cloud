import React from "react";

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="card product-card">
      <div className="product-image-placeholder">IMG</div>
      <p className="product-name">{product.name}</p>
      <p className="product-shop">{product.retailer?.shopName || product.retailer?.name || ""}</p>
      <div className="product-footer">
        <span className="product-price">₹{product.price}</span>
        {onAdd && (
          <button className="small-btn" onClick={() => onAdd(product)}>
            Add
          </button>
        )}
      </div>
    </div>
  );
}
