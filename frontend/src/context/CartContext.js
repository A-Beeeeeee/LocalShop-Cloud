import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  function persist(next) {
    setItems(next);
    localStorage.setItem("cart", JSON.stringify(next));
  }

  /**
   * Adds an item to the cart.
   * Enforces Hyperlocal Geofencing by ensuring all items in a single cart
   * originate from stores within the same neighborhood cluster (e.g. Anna Nagar).
   * 
   * If a conflict is detected across different city zones (e.g. Velachery vs T. Nagar),
   * returns a conflict descriptor unless force=true is passed.
   */
  function addToCart(product, force = false, quantity = 1) {
    const pLocality = (product.retailer?.storeLocality || "Anna Nagar").trim();
    const pShopName = product.retailer?.shopName || product.retailer?.name || "Local Retailer";

    if (items.length > 0 && !force) {
      const existingLocality = (items[0].storeLocality || "Anna Nagar").trim();
      if (existingLocality.toLowerCase() !== pLocality.toLowerCase()) {
        return {
          conflict: true,
          currentLocality: existingLocality,
          newLocality: pLocality,
          currentShop: items[0].shopName || "Existing Store",
          newShop: pShopName,
        };
      }
    }

    let next;
    if (force && items.length > 0) {
      // Replace cart with new item from new locality
      next = [{
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
        next = items.map((i) => (i.productId === product._id ? { ...i, qty: i.qty + quantity } : i));
      } else {
        next = [
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

    persist(next);
    return { success: true };
  }

  function removeFromCart(productId) {
    persist(items.filter((i) => i.productId !== productId));
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
  const cartLocality = items.length > 0 ? (items[0].storeLocality || "Anna Nagar") : null;

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
        cartLocality 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
