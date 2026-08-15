/**
 * Geocoding Service for Veterans Benefits & Resettlement Portal
 * Provides OpenStreetMap Nominatim lookup + Pre-mapped verified defense hub coordinates
 * and Haversine distance calculation.
 */

// Pre-mapped verified coordinates for primary defense resettlement and industrial hubs in India
export const KNOWN_LOCATIONS = {
  bhubaneswar: { lat: 20.2961, lng: 85.8245, city: 'Bhubaneswar', state: 'Odisha' },
  cuttack: { lat: 20.4625, lng: 85.883, city: 'Cuttack', state: 'Odisha' },
  rourkela: { lat: 22.2604, lng: 84.8536, city: 'Rourkela', state: 'Odisha' },
  berhampur: { lat: 19.315, lng: 84.7941, city: 'Berhampur', state: 'Odisha' },
  puri: { lat: 19.8135, lng: 85.8312, city: 'Puri', state: 'Odisha' },
  delhi: { lat: 28.6139, lng: 77.209, city: 'New Delhi', state: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.209, city: 'New Delhi', state: 'Delhi' },
  'delhi ncr': { lat: 28.6139, lng: 77.209, city: 'Delhi NCR', state: 'Delhi' },
  noida: { lat: 28.5355, lng: 77.391, city: 'Noida', state: 'Uttar Pradesh' },
  gurgaon: { lat: 28.4595, lng: 77.0266, city: 'Gurugram', state: 'Haryana' },
  gurugram: { lat: 28.4595, lng: 77.0266, city: 'Gurugram', state: 'Haryana' },
  chandigarh: { lat: 30.7333, lng: 76.7794, city: 'Chandigarh', state: 'Punjab' },
  bengaluru: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka' },
  bangalore: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka' },
  hyderabad: { lat: 17.385, lng: 78.4867, city: 'Hyderabad', state: 'Telangana' },
  pune: { lat: 18.5204, lng: 73.8567, city: 'Pune', state: 'Maharashtra' },
  mumbai: { lat: 19.076, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
  chennai: { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu' },
  kolkata: { lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal' },
  jaipur: { lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan' },
  lucknow: { lat: 26.8467, lng: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad', state: 'Gujarat' },
  dehradun: { lat: 30.3165, lng: 78.0322, city: 'Dehradun', state: 'Uttarakhand' },
  jammu: { lat: 32.7266, lng: 74.857, city: 'Jammu', state: 'Jammu & Kashmir' },
  amritsar: { lat: 31.634, lng: 74.8723, city: 'Amritsar', state: 'Punjab' },
  jodhpur: { lat: 26.2389, lng: 73.0243, city: 'Jodhpur', state: 'Rajasthan' },
  nagpur: { lat: 21.1458, lng: 79.0882, city: 'Nagpur', state: 'Maharashtra' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  kochi: { lat: 9.9312, lng: 76.2673, city: 'Kochi', state: 'Kerala' },
};

// In-memory cache for Nominatim geocoding results
const geocodeCache = new Map();

/**
 * Calculate Great-Circle distance between two coordinates using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers (1 decimal place)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Geocode an address/city using offline lookup with OpenStreetMap Nominatim fallback
 * @param {string} city - City name
 * @param {string} state - State name
 * @param {string} address - Street / Full Address
 * @returns {Promise<{ latitude: number, longitude: number, city: string, state: string, source: string } | null>}
 */
export const geocodeLocation = async (city, state = '', address = '') => {
  const cleanCity = (city || '').trim().toLowerCase();
  const cleanState = (state || '').trim();

  // 1. Instant match in verified known hubs
  if (cleanCity && KNOWN_LOCATIONS[cleanCity]) {
    const hub = KNOWN_LOCATIONS[cleanCity];
    return {
      latitude: hub.lat,
      longitude: hub.lng,
      city: hub.city,
      state: hub.state || cleanState,
      source: 'offline_verified',
    };
  }

  // 2. Check cache
  const cacheKey = `${cleanCity}_${cleanState}`.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 3. Fallback to OpenStreetMap Nominatim with respectful headers
  try {
    const query = [address, city, state, 'India'].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VeteransPortal/1.0 (resettlement-support@veteransportal.gov)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const result = {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: city || item.display_name.split(',')[0],
          state: state || 'India',
          source: 'nominatim_osm',
        };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback on network or rate limit
    console.warn(`[Geocoding] Nominatim lookup skipped for "${city}":`, err.message);
  }

  // Default fallback if city has a partial match
  for (const [key, val] of Object.entries(KNOWN_LOCATIONS)) {
    if (cleanCity.includes(key) || key.includes(cleanCity)) {
      return {
        latitude: val.lat,
        longitude: val.lng,
        city: val.city,
        state: val.state,
        source: 'offline_partial_match',
      };
    }
  }

  return null;
};

export default {
  calculateHaversineDistance,
  geocodeLocation,
  KNOWN_LOCATIONS,
};
