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

  function addToCart(product) {
    const existing = items.find((i) => i.productId === product._id);
    let next;
    if (existing) {
      next = items.map((i) => (i.productId === product._id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      next = [...items, { productId: product._id, name: product.name, price: product.price, qty: 1 }];
    }
    persist(next);
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

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, setQty, increment, decrement, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
