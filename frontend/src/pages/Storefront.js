import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";
import { SearchIcon, XIcon, BagIcon, RefreshCwIcon } from "../components/Icons";

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
    showToast(`Added "${product.name}" to cart`, "success");
  }

  // Load products on category change
  useEffect(() => {
    loadProducts(search, category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      if (search.trim() || category !== "All") {
        loadProducts(search, category);
      } else {
        loadProducts("", "All");
      }
    }, 280);

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
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load products");
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
      {/* Compact Unified Search & Filter Toolbar */}
      <div className="storefront-toolbar">
        <div className="search-bar">
          <span className="search-icon">
            <SearchIcon size={14} />
          </span>
          <input
            placeholder="Search products or shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            aria-label="Search products"
          />
          {search && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              <XIcon size={12} />
            </button>
          )}
        </div>

        <div className="flex-center gap-2 flex-wrap" style={{ flex: 1, justifyContent: "space-between" }}>
          <div className="chip-row" role="tablist">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                className={`chip ${category === c ? "chip-active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex-center gap-2">
            <span className="results-count text-xs">
              {loading ? "Searching..." : `${products.length} item${products.length === 1 ? "" : "s"}`}
            </span>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm" 
              onClick={() => loadProducts(search, category)}
              disabled={loading}
              title="Reload catalog"
              style={{ padding: "3px 6px" }}
            >
              <RefreshCwIcon size={12} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "10px" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div className="product-card skeleton-card" key={i}>
              <div className="skeleton" style={{ height: "90px" }} />
              <div style={{ padding: "8px 10px" }}>
                <div className="skeleton" style={{ height: "12px", width: "40%", marginBottom: "6px" }} />
                <div className="skeleton" style={{ height: "14px", width: "80%", marginBottom: "8px" }} />
                <div className="skeleton" style={{ height: "20px", width: "100%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <BagIcon size={26} />
          </div>
          <h2 className="empty-title">No products found</h2>
          <p className="empty-sub">
            {search || category !== "All"
              ? "No products matched your criteria. Try different keywords or select another category."
              : "No products available in the cloud catalog yet."}
          </p>
          {(search || category !== "All") && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => { setSearch(""); setCategory("All"); }}
              style={{ marginTop: "10px" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </div>
  );
}
