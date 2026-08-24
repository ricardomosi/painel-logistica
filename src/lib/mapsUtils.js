/**
 * Utilities for Maps, Route Tracing (Google Maps / Waze) and Geolocation
 */

export function getGoogleMapsUrl(address, destinationCoords = null) {
  if (destinationCoords && destinationCoords.lat && destinationCoords.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destinationCoords.lat},${destinationCoords.lng}`;
  }
  if (!address) return 'https://maps.google.com';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function getWazeUrl(address, destinationCoords = null) {
  if (destinationCoords && destinationCoords.lat && destinationCoords.lng) {
    return `https://waze.com/ul?ll=${destinationCoords.lat},${destinationCoords.lng}&navigate=yes`;
  }
  if (!address) return 'https://waze.com';
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

export function formatAddress(address) {
  if (!address) return '';
  return address.trim();
}

/**
 * Calculates distance between 2 coordinates in Kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}
