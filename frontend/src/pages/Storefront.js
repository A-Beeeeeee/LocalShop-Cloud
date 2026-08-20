import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["All", "Groceries", "Apparel", "Home", "Electronics", "General"];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const cart = useCart();
  const { showToast } = useToast();

  function handleAdd(product) {
    cart.addToCart(product);
    showToast(`Added "${product.name}" to cart`);
  }

  // Load products on category change
  useEffect(() => {
    loadProducts(search, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Debounced search
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout);

    // Set new timeout for search
    const timeout = setTimeout(() => {
      if (search.trim() || category !== "All") {
        loadProducts(search, category);
      } else {
        loadProducts("", "All");
      }
    }, 300); // 300ms debounce delay

    setSearchTimeout(timeout);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function loadProducts(searchTerm = "", selectedCategory = "All") {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm;
      if (selectedCategory !== "All") params.category = selectedCategory;
      const data = await api.getProducts(params);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClearSearch() {
    setSearch("");
    loadProducts("", category);
  }

  return (
    <div className="page">
      <div className="search-bar-wrapper">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search products or shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={handleClearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="chip-row">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className={`chip ${category === c ? "chip-active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </span>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="card product-card skeleton-card" key={i}>
              <div className="skeleton skeleton-img" />
              <div className="skeleton skeleton-line" style={{ width: "70%" }} />
              <div className="skeleton skeleton-line" style={{ width: "45%" }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <p className="empty-title">No products here yet</p>
          <p className="empty-sub">
            Once a retailer adds products, they'll show up here. Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </div>
  );
}
