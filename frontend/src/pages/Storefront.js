import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";
import ProductDetailsModal from "../components/ProductDetailsModal";
import { 
  SearchIcon, 
  XIcon, 
  BagIcon, 
  RefreshCwIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  MapPinIcon,
  StoreIcon,
  CompassIcon,
  PhoneIcon
} from "../components/Icons";

const CATEGORIES = ["All", "Groceries", "Apparel", "Home", "Electronics", "General"];

const LOCALITIES = [
  { id: "all", name: "All Chennai Localities", pincode: "All", distance: "City-wide Network" },
  { id: "Anna Nagar", name: "Anna Nagar", pincode: "600040", distance: "1.2 km radius • 15–25 min express" },
  { id: "T. Nagar", name: "T. Nagar", pincode: "600017", distance: "2.4 km radius • 20–30 min express" },
  { id: "Velachery", name: "Velachery", pincode: "600042", distance: "3.1 km radius • 25–35 min express" },
  { id: "Adyar", name: "Adyar", pincode: "600020", distance: "1.8 km radius • 15–25 min express" },
  { id: "Kelambakkam", name: "Kelambakkam / OMR", pincode: "600127", distance: "2.0 km radius • 20–30 min express" },
  { id: "Tambaram", name: "Tambaram", pincode: "600045", distance: "3.5 km radius • 25–35 min express" },
  { id: "Mylapore", name: "Mylapore", pincode: "600004", distance: "1.5 km radius • 15–25 min express" },
];

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedLocality, setSelectedLocality] = useState("all");
  const [selectedStore, setSelectedStore] = useState(null); // Filter by specific store
  const [viewMode, setViewMode] = useState("products"); // "products" | "stores"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cart = useCart();
  const { showToast } = useToast();

  function handleAdd(product) {
    cart.addToCart(product);
    showToast(`Added "${product.name}" to cart`, "success");
  }

  // Load products and stores on category, locality, or store filter change
  useEffect(() => {
    loadProducts(search, category, selectedLocality, selectedStore?._id);
    loadStores(selectedLocality);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, selectedLocality, selectedStore]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      loadProducts(search, category, selectedLocality, selectedStore?._id);
    }, 280);

    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function loadProducts(searchTerm = "", selectedCategory = "All", locality = "all", storeId = null) {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm;
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (locality && locality !== "all") params.locality = locality;
      if (storeId) params.retailerId = storeId;
      
      const data = await api.getProducts(params);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function loadStores(locality = "all") {
    try {
      const params = {};
      if (locality && locality !== "all") params.locality = locality;
      const data = await api.getStores(params);
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load stores", err);
    }
  }

  function handleClearSearch() {
    setSearch("");
    loadProducts("", category, selectedLocality, selectedStore?._id);
  }

  const activeLocalityObj = LOCALITIES.find((l) => l.id === selectedLocality) || LOCALITIES[0];

  return (
    <div className="page">
      {/* Hyperlocal Top Location Selector & Geofencing Status Bar */}
      <div style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 16px",
        marginBottom: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div className="flex-center gap-2 flex-wrap">
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            backgroundColor: "var(--color-primary-subtle)",
            border: "1px solid var(--color-primary-border)",
            borderRadius: "var(--radius-full)",
            color: "var(--color-primary)",
            fontSize: "12px",
            fontWeight: 700
          }}>
            <MapPinIcon size={14} />
            <span>Delivering To:</span>
          </div>

          <select
            value={selectedLocality}
            onChange={(e) => {
              setSelectedLocality(e.target.value);
              setSelectedStore(null);
            }}
            className="form-select"
            style={{
              padding: "5px 12px",
              fontSize: "12.5px",
              fontWeight: 600,
              minWidth: "200px",
              borderRadius: "var(--radius-sm)"
            }}
            aria-label="Select delivery neighborhood locality"
          >
            {LOCALITIES.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.pincode !== "All" ? `(${loc.pincode})` : ""}
              </option>
            ))}
          </select>

          <span className="text-muted text-xs font-medium" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CompassIcon size={12} color="var(--color-primary)" />
            <span>{activeLocalityObj.distance}</span>
          </span>
        </div>

        {/* View Mode Switcher (All Products vs Neighborhood Stores) */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === "products" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("products")}
            style={{ padding: "4px 12px", fontSize: "11.5px" }}
          >
            <BagIcon size={12} />
            <span>All Products ({products.length})</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === "stores" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("stores")}
            style={{ padding: "4px 12px", fontSize: "11.5px" }}
          >
            <StoreIcon size={12} />
            <span>Local Shops ({stores.length})</span>
          </button>
        </div>
      </div>

      {/* Hyperlocal Welcome Hero Banner */}
      <div className="storefront-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span>Hyperlocal Quick Commerce • 3–5 km Radius Geofencing</span>
          </div>
          <h1 className="hero-title">
            Neighborhood stores in <span className="text-gradient">{selectedLocality === "all" ? "your area" : selectedLocality}, delivered in minutes.</span>
          </h1>
          <p className="hero-subtitle">
            Order directly from authentic local Kiranas, bakeries, and pharmacies with zero corporate warehouse markup and live GPS courier tracking.
          </p>
        </div>

        <div className="hero-perks">
          <div className="hero-perk-item">
            <div className="hero-perk-icon hero-perk-blue">
              <TruckIcon size={14} />
            </div>
            <div>
              <span className="hero-perk-title">15–30 Min Express</span>
              <span className="hero-perk-desc">Geofenced 3.5 km radius</span>
            </div>
          </div>
          <div className="hero-perk-item">
            <div className="hero-perk-icon hero-perk-green">
              <ShieldCheckIcon size={14} />
            </div>
            <div>
              <span className="hero-perk-title">Physical Kirana Stores</span>
              <span className="hero-perk-desc">100% verified neighborhood shops</span>
            </div>
          </div>
          <div className="hero-perk-item">
            <div className="hero-perk-icon hero-perk-purple">
              <CreditCardIcon size={14} />
            </div>
            <div>
              <span className="hero-perk-title">Razorpay & Doorstep OTP</span>
              <span className="hero-perk-desc">Secure physical handoff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Store Filter Notice Banner */}
      {selectedStore && (
        <div style={{
          backgroundColor: "var(--color-primary-subtle)",
          border: "1px solid var(--color-primary-border)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 14px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div className="flex-center gap-2">
            <StoreIcon size={14} color="var(--color-primary)" />
            <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
              Viewing products from: <strong>{selectedStore.shopName}</strong> ({selectedStore.storeLocality})
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedStore(null)}
            style={{ fontSize: "11px", padding: "2px 8px" }}
          >
            <XIcon size={11} /> Clear Store Filter
          </button>
        </div>
      )}

      {/* VIEW MODE 1: ALL PRODUCTS VIEW */}
      {viewMode === "products" && (
        <>
          {/* Compact Unified Search & Filter Toolbar */}
          <div className="storefront-toolbar">
            <div className="search-bar">
              <span className="search-icon">
                <SearchIcon size={14} />
              </span>
              <input
                placeholder={`Search products in ${selectedLocality === "all" ? "neighborhood" : selectedLocality}...`}
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
                  onClick={() => loadProducts(search, category, selectedLocality, selectedStore?._id)}
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
              <h2 className="empty-title">No products found in {selectedLocality === "all" ? "this category" : selectedLocality}</h2>
              <p className="empty-sub">
                {selectedLocality !== "all"
                  ? `There are no active retailer listings within ${selectedLocality}. Switch locality or select "All Localities" to explore.`
                  : "No products matched your search criteria."}
              </p>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => { setSearch(""); setCategory("All"); setSelectedLocality("all"); setSelectedStore(null); }}
                style={{ marginTop: "10px" }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard 
                  key={p._id} 
                  product={p} 
                  onAdd={handleAdd} 
                  onSelect={setSelectedProduct} 
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW MODE 2: NEIGHBORHOOD STORES DIRECTORY */}
      {viewMode === "stores" && (
        <div style={{ marginTop: "10px" }}>
          <div className="flex-between" style={{ marginBottom: "12px" }}>
            <div>
              <h3 className="section-title" style={{ fontSize: "16px", margin: 0 }}>
                Verified Neighborhood Retailers in {selectedLocality === "all" ? "Chennai" : selectedLocality}
              </h3>
              <p className="text-muted text-xs" style={{ marginTop: "2px" }}>
                Physical mom-and-pop Kiranas, grocery stores, and local merchants within quick courier radius.
              </p>
            </div>
          </div>

          {stores.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <StoreIcon size={26} />
              </div>
              <h2 className="empty-title">No verified stores in this locality</h2>
              <p className="empty-sub">Select a different neighborhood to discover local Kirana stores.</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px"
            }}>
              {stores.map((st) => (
                <div
                  key={st._id}
                  className="card"
                  style={{
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.15s ease",
                    cursor: "pointer",
                    border: selectedStore?._id === st._id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)"
                  }}
                  onClick={() => {
                    setSelectedStore(st);
                    setViewMode("products");
                  }}
                >
                  <div>
                    <div className="flex-between" style={{ marginBottom: "6px" }}>
                      <span className="badge badge-success text-xs flex-center gap-1 font-bold">
                        <ShieldCheckIcon size={11} color="#10b981" /> Verified Store
                      </span>
                      <span className="badge badge-delivery text-xs" style={{ fontSize: "10px" }}>
                        ⚡ {st.estimatedDeliveryMin} mins
                      </span>
                    </div>

                    <h4 className="font-bold text-sm" style={{ margin: "4px 0 2px", color: "var(--color-text)" }}>
                      {st.shopName}
                    </h4>

                    <div className="text-muted text-xs truncate" style={{ margin: "2px 0 6px" }}>
                      <MapPinIcon size={11} style={{ display: "inline", marginRight: "3px" }} />
                      {st.storeAddress}
                    </div>

                    <div className="flex-center gap-2" style={{ marginTop: "8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                      <span><strong>{st.productCount}</strong> products in catalog</span>
                      <span>•</span>
                      <span>⭐ {st.rating} Rating</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "12px", borderTop: "1px dashed var(--color-border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {st.phone && (
                      <span className="text-muted text-xs flex-center gap-1">
                        <PhoneIcon size={10} /> {st.phone}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStore(st);
                        setViewMode("products");
                      }}
                    >
                      Browse Store Catalog ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer Full Product Details Quick View Modal */}
      <ProductDetailsModal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onAdd={handleAdd}
      />
    </div>
  );
}
