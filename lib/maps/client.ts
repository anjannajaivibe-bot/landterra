export function isGoogleMapsConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  return Boolean(key && !key.includes('your-'));
}

export function getGoogleMapsApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ''
  );
}

/**
 * For properties with approximateLocation = true, returns a slightly randomized
 * centroid coordinate for public display while keeping true coordinates protected.
 */
export function getPublicMapCoordinates(lat: number, lng: number, isApproximate: boolean) {
  if (!isApproximate) {
    return { lat, lng, isApproximate: false, radiusMeters: 0 };
  }

  // Consistent pseudo-random offset based on lat/lng so marker doesn't jump around
  const hash = Math.sin(lat * 1000 + lng * 1000) * 10000;
  const offsetLat = ((hash % 10) - 5) * 0.0008; // ~80-100m offset
  const offsetLng = (((hash * 10) % 10) - 5) * 0.0008;

  return {
    lat: Number((lat + offsetLat).toFixed(6)),
    lng: Number((lng + offsetLng).toFixed(6)),
    isApproximate: true,
    radiusMeters: 400, // 400m privacy circle
  };
}
