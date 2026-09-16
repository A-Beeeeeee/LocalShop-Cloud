/**
 * mapsHelper.js
 * Utilities for address sanitization, multi-store extraction, and Google Maps URL generation.
 */

/**
 * Strips out recipient annotations (e.g. "(Deliver to: Siva • Ph: 8666372651)")
 * and phone numbers to ensure Google Maps geocoder receives a clean physical address.
 * 
 * @param {string} addressStr - The raw address string
 * @returns {string} - Clean physical address for Google Maps
 */
export function cleanAddressForMaps(addressStr) {
  if (!addressStr || typeof addressStr !== "string") return "Chennai, Tamil Nadu, India";

  // 1. Remove parenthesized annotations like "(Deliver to: Siva • Ph: 8666372651)" or "(Contact: ...)"
  let cleaned = addressStr
    .replace(/\s*\([^)]*(?:deliver|recipient|contact|ph|phone|call|to:)[^)]*\)/gi, "")
    // 2. Remove generic parenthesized numbers like "(+91 9876543210)" or "(8666372651)"
    .replace(/\s*\([^)]*\d{6,}[^)]*\)/g, "")
    // 3. Remove unparenthesized trailing "Deliver to: ..." or "Ph: ..."
    .replace(/\s*(?:deliver to|recipient|contact|ph|phone):.*$/gi, "")
    .trim();

  // 4. Strip trailing punctuation / separators
  cleaned = cleaned.replace(/[,/•\-–\s]+$/, "").trim();

  // 5. If string became empty, fall back to original trimmed
  if (!cleaned || cleaned.length < 3) {
    cleaned = addressStr.trim();
  }

  return cleaned;
}

/**
 * Extracts recipient name, phone, and cleaned address from formatted address strings.
 */
export function extractRecipientInfo(addressStr, fallbackName = "Customer", fallbackPhone = "") {
  if (!addressStr || typeof addressStr !== "string") {
    return { name: fallbackName, phone: fallbackPhone, cleanAddress: "Chennai, Tamil Nadu" };
  }

  const cleanAddress = cleanAddressForMaps(addressStr);
  let name = fallbackName;
  let phone = fallbackPhone;

  const deliverMatch = addressStr.match(/Deliver to:\s*([^•/(]+)(?:[•/]\s*Ph:\s*([0-9\s/]+))?/i);
  if (deliverMatch) {
    if (deliverMatch[1] && deliverMatch[1].trim()) name = deliverMatch[1].trim();
    if (deliverMatch[2] && deliverMatch[2].trim()) phone = deliverMatch[2].trim();
  }

  return { name, phone, cleanAddress };
}

/**
 * Extracts all unique stores/retailers involved in an order's items.
 * 
 * @param {object} order - The order object
 * @returns {Array} - Array of unique store objects with items, phone, and clean address
 */
export function extractUniqueStores(order) {
  if (!order || !order.items || !Array.isArray(order.items)) return [];
  const storeMap = new Map();

  order.items.forEach((item, index) => {
    const retailer = item.retailer;
    const storeKey = retailer?._id ? String(retailer._id) : (retailer?.shopName || retailer?.name || `store_${index}`);

    let storeAddress = "";
    if (retailer?.addresses && retailer.addresses.length > 0) {
      const addr = retailer.addresses[0];
      storeAddress = `${addr.flat || ""}, ${addr.area || ""}, ${addr.city || "Chennai"} ${addr.pincode || ""}`.trim();
    } else {
      const sName = retailer?.shopName || retailer?.name || "Local Merchant";
      storeAddress = `${sName}, Local Merchant, Chennai, Tamil Nadu`;
    }

    if (!storeMap.has(storeKey)) {
      storeMap.set(storeKey, {
        id: storeKey,
        storeName: retailer?.shopName || retailer?.name || `Store #${storeMap.size + 1}`,
        phone: retailer?.phone || "",
        rawAddress: storeAddress,
        cleanAddress: cleanAddressForMaps(storeAddress),
        items: [item]
      });
    } else {
      storeMap.get(storeKey).items.push(item);
    }
  });

  return Array.from(storeMap.values());
}

/**
 * Constructs a single store destination URL for Google Maps.
 */
export function getStoreMapsUrl(storeAddress) {
  const clean = cleanAddressForMaps(storeAddress);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clean)}`;
}

/**
 * Constructs a customer dropoff destination URL for Google Maps.
 */
export function getCustomerMapsUrl(customerAddress) {
  const clean = cleanAddressForMaps(customerAddress);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clean)}`;
}

/**
 * Constructs a full multi-stop navigation route in Google Maps:
 * If 1 Store: Origin = Store, Destination = Customer
 * If Multiple Stores: Origin = Store 1, Waypoints = Store 2 | Store 3, Destination = Customer
 */
export function getMultiStopRouteUrl(stores, customerAddress) {
  const cleanCustomer = cleanAddressForMaps(customerAddress);
  if (!stores || stores.length === 0) {
    return getCustomerMapsUrl(customerAddress);
  }

  const firstStore = stores[0];
  const origin = firstStore.cleanAddress;

  if (stores.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(cleanCustomer)}&travelmode=two_wheeler`;
  }

  // Multi-store route with waypoints
  const waypoints = stores
    .slice(1)
    .map((s) => s.cleanAddress)
    .join("|");

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(cleanCustomer)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=two_wheeler`;
}
