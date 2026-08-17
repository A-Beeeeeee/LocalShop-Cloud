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
  const cart = useCart();
  const { showToast } = useToast();

  function handleAdd(product) {
    cart.addToCart(product);
    showToast(`Added "${product.name}" to cart`);
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getProducts({ search, category });
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadProducts();
  }

  return (
    <div className="page">
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <input
          placeholder="Search products or shops"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="small-btn">Search</button>
      </form>

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
