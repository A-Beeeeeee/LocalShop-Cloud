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
      {/* Search and Filter Toolbar */}
      <div className="storefront-toolbar">
        <div className="search-bar">
          <span className="search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            placeholder="Search products or local retailers..."
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
              <XIcon size={14} />
            </button>
          )}
        </div>

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
      </div>

      {/* Results Header Bar */}
      <div className="results-header">
        <span className="results-count">
          {loading ? "Searching..." : `${products.length} product${products.length === 1 ? "" : "s"} found`}
        </span>
        <button 
          type="button" 
          className="btn btn-ghost btn-sm" 
          onClick={() => loadProducts(search, category)}
          disabled={loading}
          title="Reload products"
        >
          <RefreshCwIcon size={13} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="product-card skeleton-card" key={i}>
              <div className="skeleton" style={{ height: "130px", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "14px", width: "40%", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "18px", width: "80%", marginBottom: "12px" }} />
              <div className="skeleton" style={{ height: "24px", width: "100%" }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <BagIcon size={32} />
          </div>
          <h2 className="empty-title">No products found</h2>
          <p className="empty-sub">
            {search || category !== "All"
              ? "No products matched your search or filter. Try adjusting your keywords or category."
              : "No products are currently available in the cloud catalog. Retailers will add inventory soon."}
          </p>
          {(search || category !== "All") && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => { setSearch(""); setCategory("All"); }}
              style={{ marginTop: "14px" }}
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
