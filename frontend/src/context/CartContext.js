import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  // Calculate unique localities
  const uniqueLocalities = Array.from(
    new Set(items.map((i) => (i.storeLocality || "Anna Nagar").trim()))
  );
  const isMultiLocality = uniqueLocalities.length > 1;
  const deliveryTier = isMultiLocality ? "standard" : "express";

  function persist(nextItems) {
    const nextLocs = Array.from(
      new Set(nextItems.map((i) => (i.storeLocality || "Anna Nagar").trim()))
    );
    const nextTier = nextLocs.length > 1 ? "standard" : "express";
    setItems(nextItems);
    localStorage.setItem("cart", JSON.stringify(nextItems));
    localStorage.setItem("cart_delivery_tier", nextTier);
  }

  // Ensure stored tier stays in sync with initial items load
  useEffect(() => {
    localStorage.setItem("cart_delivery_tier", deliveryTier);
  }, [deliveryTier]);

  /**
   * Adds an item to the cart.
   * Supports two delivery modes:
   * 1. Express (15–30 mins): Restricted to stores within the same 3–5 km locality.
   * 2. Standard (1–2 Days): Allows mixing stores across different city zones.
   *
   * @param {Object} product - Product to add
   * @param {boolean} force - If true, replaces cart with new item for Express in new locality
   * @param {number} quantity - Quantity of item to add
   * @param {string|null} switchTier - "standard" to merge cross-zone items and switch to 1–2 day delivery
   */
  function addToCart(product, force = false, quantity = 1, switchTier = null) {
    const pLocality = (product.retailer?.storeLocality || "Anna Nagar").trim();
    const pShopName = product.retailer?.shopName || product.retailer?.name || "Local Retailer";

    if (items.length > 0) {
      const existingLocality = (items[0].storeLocality || "Anna Nagar").trim();
      const isCrossLocality = existingLocality.toLowerCase() !== pLocality.toLowerCase();

      // Check if user is trying to add a cross-locality product without confirmation
      if (isCrossLocality && !force && switchTier !== "standard") {
        return {
          conflict: true,
          currentLocality: existingLocality,
          newLocality: pLocality,
          currentShop: items[0].shopName || "Existing Store",
          newShop: pShopName,
        };
      }
    }

    let nextItems;

    if (force && items.length > 0) {
      // Option 1: Replace cart and keep Express 15-30 min mode in new locality
      nextItems = [{
        productId: product._id,
        name: product.name,
        price: product.price,
        qty: quantity,
        imageUrl: product.imageUrl,
        retailerId: product.retailer?._id,
        shopName: pShopName,
        storeLocality: pLocality,
      }];
    } else {
      const existing = items.find((i) => i.productId === product._id);
      if (existing) {
        nextItems = items.map((i) => (i.productId === product._id ? { ...i, qty: i.qty + quantity } : i));
      } else {
        nextItems = [
          ...items,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            qty: quantity,
            imageUrl: product.imageUrl,
            retailerId: product.retailer?._id,
            shopName: pShopName,
            storeLocality: pLocality,
          },
        ];
      }
    }

    persist(nextItems);
    const nextLocs = Array.from(new Set(nextItems.map((i) => (i.storeLocality || "Anna Nagar").trim())));
    return { success: true, tier: nextLocs.length > 1 ? "standard" : "express" };
  }

  function removeFromCart(productId) {
    const remaining = items.filter((i) => i.productId !== productId);
    persist(remaining);
  }

  function setQty(productId, qty) {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    persist(items.map((i) => (i.productId === productId ? { ...i, qty } : i)));
  }

  function increment(productId) {
    const item = items.find((i) => i.productId === productId);
    if (item) setQty(productId, item.qty + 1);
  }

  function decrement(productId) {
    const item = items.find((i) => i.productId === productId);
    if (item) setQty(productId, item.qty - 1);
  }

  function clearCart() {
    persist([]);
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  const cartLocality = items.length === 0
    ? null
    : isMultiLocality
    ? `City-Wide (${uniqueLocalities.join(" + ")})`
    : items[0].storeLocality || "Anna Nagar";

  return (
    <CartContext.Provider
      value={{ 
        items, 
        addToCart, 
        removeFromCart, 
        setQty, 
        increment, 
        decrement, 
        clearCart, 
        total, 
        count,
        cartLocality,
        deliveryTier,
        isMultiLocality,
        uniqueLocalities
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
