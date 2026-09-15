import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { 
  HomeIcon, 
  BriefcaseIcon, 
  MapPinIcon, 
  AlertCircleIcon, 
  CheckIcon
} from "./Icons";

const LOCALITY_PRESETS = [
  "Bascon Futura SV IT Park, Venkatanarayana Road, T Nagar, Chennai, Tamil Nadu, 600017",
  "Anna Nagar West, 2nd Avenue, Near Roundtana, Chennai, Tamil Nadu, 600040",
  "Adyar Signal, Gandhi Nagar 1st Main Rd, Chennai, Tamil Nadu, 600020",
  "Velachery Main Road, Near Vijaya Nagar Bus Stand, Chennai, Tamil Nadu, 600042",
  "OMR IT Expressway, Thoraipakkam, Chennai, Tamil Nadu, 600097",
  "Shanthi Colony, 4th Main Road, Anna Nagar, Chennai, Tamil Nadu, 600040",
];

export default function AddressModal({ 
  isOpen, 
  onClose, 
  onSaveAddress, 
  initialData = null, 
  userProfile = null 
}) {
  const [flat, setFlat] = useState("");
  const [area, setArea] = useState(LOCALITY_PRESETS[0]);
  const [isChangingArea, setIsChangingArea] = useState(false);
  const [customArea, setCustomArea] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setIsChangingArea(false);
      if (initialData) {
        setFlat(initialData.flat || "");
        setArea(initialData.area || LOCALITY_PRESETS[0]);
        setFullName(initialData.fullName || userProfile?.name || "");
        setPhone(initialData.phone || userProfile?.phone || "");
        setAltPhone(initialData.altPhone || "");
        setAddressType(initialData.addressType || "Home");
      } else {
        setFlat("");
        setArea(LOCALITY_PRESETS[0]);
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
      setError("Please select or enter your Area / Locality.");
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

  function handleSelectPreset(preset) {
    setArea(preset);
    setIsChangingArea(false);
  }

  function handleApplyCustomArea() {
    if (customArea.trim()) {
      setArea(customArea.trim());
      setCustomArea("");
      setIsChangingArea(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deliver To"
      maxWidth="460px"
    >
      {/* Accuracy Warning Banner */}
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

        {/* Field 2: Area / Sector / Locality Container with [Change] button */}
        <div className="locality-picker-card">
          <div className="flex-between align-start">
            <span className="locality-label">Area / Sector / Locality</span>
            <button
              type="button"
              className="btn-change-locality"
              onClick={() => setIsChangingArea(!isChangingArea)}
            >
              {isChangingArea ? "Cancel" : "Change"}
            </button>
          </div>
          
          <div className="locality-value-text">
            {area}
          </div>

          {/* Expanded Locality Quick Chooser */}
          {isChangingArea && (
            <div className="locality-chooser-drawer">
              <div className="text-muted text-xs" style={{ marginBottom: "6px", fontWeight: 600 }}>
                Select popular hyperlocal hub:
              </div>
              <div className="locality-preset-list">
                {LOCALITY_PRESETS.map((p, idx) => (
                  <div
                    key={idx}
                    className={`locality-preset-item ${area === p ? "selected" : ""}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    <MapPinIcon size={12} color={area === p ? "var(--color-primary)" : "#64748b"} />
                    <span className="locality-preset-text">{p}</span>
                    {area === p && <CheckIcon size={12} color="var(--color-primary)" />}
                  </div>
                ))}
              </div>

              {/* Custom Locality Input */}
              <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Or enter custom area, landmark & pincode..."
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCustomArea())}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleApplyCustomArea}
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Field 3: Full Name */}
        <div className="form-group deliver-to-floating" style={{ marginBottom: "10px" }}>
          <label className="deliver-to-sublabel">Enter your full name *</label>
          <input
            type="text"
            className="form-input deliver-to-input"
            placeholder="e.g. Priya Dharshini"
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
            placeholder="7550024142"
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
