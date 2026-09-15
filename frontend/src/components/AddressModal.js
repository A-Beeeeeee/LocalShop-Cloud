import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { 
  HomeIcon, 
  BriefcaseIcon, 
  MapPinIcon, 
  AlertCircleIcon
} from "./Icons";

export default function AddressModal({ 
  isOpen, 
  onClose, 
  onSaveAddress, 
  initialData = null, 
  userProfile = null 
}) {
  const [flat, setFlat] = useState("");
  const [area, setArea] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      if (initialData) {
        setFlat(initialData.flat || "");
        setArea(initialData.area || "");
        setFullName(initialData.fullName || userProfile?.name || "");
        setPhone(initialData.phone || userProfile?.phone || "");
        setAltPhone(initialData.altPhone || "");
        setAddressType(initialData.addressType || "Home");
      } else {
        setFlat("");
        setArea("");
        setFullName(userProfile?.name || "");
        setPhone(userProfile?.phone || "");
        setAltPhone("");
        setAddressType("Home");
      }
    }
  }, [isOpen, initialData, userProfile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!flat.trim()) {
      setError("Please enter your Flat / House / Building name.");
      return;
    }
    if (!area.trim()) {
      setError("Please enter your Area / Locality / Landmark.");
      return;
    }
    if (!fullName.trim()) {
      setError("Please enter your Full Name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSaving(true);
    try {
      await onSaveAddress({
        flat: flat.trim(),
        area: area.trim(),
        fullName: fullName.trim(),
        phone: cleanPhone,
        altPhone: altPhone.trim(),
        addressType,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deliver To"
      maxWidth="460px"
    >
      {/* Accuracy Notice Banner */}
      <div className="address-banner-box">
        <div className="address-banner-icon">
          <AlertCircleIcon size={16} color="#d97706" />
        </div>
        <p className="address-banner-text">
          Ensure your address details are accurate for a smooth delivery experience
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "12px", padding: "6px 10px", fontSize: "11.5px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="deliver-to-form">
        {/* Field 1: Flat / House / Building name */}
        <div className="form-group" style={{ marginBottom: "10px" }}>
          <input
            type="text"
            className="form-input deliver-to-input"
            placeholder="Flat/House/building name *"
            value={flat}
            onChange={(e) => setFlat(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Field 2: Area / Sector / Locality */}
        <div className="form-group deliver-to-floating" style={{ marginBottom: "10px" }}>
          <label className="deliver-to-sublabel">Area / Sector / Locality *</label>
          <input
            type="text"
            className="form-input deliver-to-input"
            placeholder="Street, Locality, Area, City, Pincode"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          />
        </div>

        {/* Field 3: Full Name */}
        <div className="form-group deliver-to-floating" style={{ marginBottom: "10px" }}>
          <label className="deliver-to-sublabel">Enter your full name *</label>
          <input
            type="text"
            className="form-input deliver-to-input"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        {/* Field 4: 10-Digit Mobile Number */}
        <div className="form-group deliver-to-floating" style={{ marginBottom: "10px" }}>
          <label className="deliver-to-sublabel">10-digit mobile number *</label>
          <input
            type="tel"
            maxLength="10"
            className="form-input deliver-to-input"
            placeholder="Mobile Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
          />
        </div>

        {/* Field 5: Alternate Phone Number (Optional) */}
        <div className="form-group" style={{ marginBottom: "12px" }}>
          <input
            type="tel"
            maxLength="10"
            className="form-input deliver-to-input"
            placeholder="Alternate phone number (Optional)"
            value={altPhone}
            onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
        </div>

        {/* Field 6: Type of Address Chips */}
        <div className="address-type-section">
          <span className="address-type-title">Type of address</span>
          <div className="address-type-chips">
            <button
              type="button"
              className={`address-type-chip ${addressType === "Home" ? "active" : ""}`}
              onClick={() => setAddressType("Home")}
            >
              <HomeIcon size={14} />
              <span>Home</span>
            </button>
            <button
              type="button"
              className={`address-type-chip ${addressType === "Work" ? "active" : ""}`}
              onClick={() => setAddressType("Work")}
            >
              <BriefcaseIcon size={14} />
              <span>Work</span>
            </button>
            <button
              type="button"
              className={`address-type-chip ${addressType === "Other" ? "active" : ""}`}
              onClick={() => setAddressType("Other")}
            >
              <MapPinIcon size={14} />
              <span>Other</span>
            </button>
          </div>
        </div>

        {/* Save Address Button */}
        <button
          type="submit"
          className="btn btn-primary btn-block deliver-to-submit-btn"
          disabled={saving}
        >
          {saving ? "Saving Address..." : "Save address"}
        </button>
      </form>
    </Modal>
  );
}

