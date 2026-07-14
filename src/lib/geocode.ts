/** Reverse-geocodes coordinates to a short "City, Country" label via OpenStreetMap Nominatim. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    const addr = data.address ?? {};
    const place = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state;
    const country = addr.country;
    if (place && country) return `${place}, ${country}`;
    if (place) return place;
    if (typeof data.display_name === 'string') {
      return data.display_name.split(',').slice(0, 2).join(',').trim();
    }
    return null;
  } catch {
    return null;
  }
}
