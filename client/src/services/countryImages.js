/**
 * Country-aware image service.
 *
 * Source: Pexels (Pexels License — free for commercial use, no attribution
 * required, no permission needed). Direct images.pexels.com CDN URLs are
 * permanent, so the curated presets below NEVER break, even if the API is
 * rate-limited or offline. The old `source.unsplash.com` endpoint used across
 * the app was shut down by Unsplash and is what caused the broken images.
 */

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

/** Append responsive sizing params to a permanent Pexels CDN url. */
export const sized = (url, w = 1600, h) =>
  url
    ? `${url}?auto=compress&cs=tinysrgb&fit=crop&w=${w}${h ? `&h=${h}` : ''}`
    : '';

/**
 * Curated, permanent fallbacks. Keyed by country name (as returned by the
 * reverse geocoder). `Romania` is the default because the platform's inventory
 * lives there; add more countries here as the inventory grows.
 */
export const COUNTRY_PRESETS = {
  Romania: {
    label: 'Romania',
    hero: [
      'https://images.pexels.com/photos/5651718/pexels-photo-5651718.jpeg',   // Peleș Castle
      'https://images.pexels.com/photos/5105467/pexels-photo-5105467.jpeg',   // Bran Castle
      'https://images.pexels.com/photos/26146516/pexels-photo-26146516.jpeg', // Carpathian Mountains
      'https://images.pexels.com/photos/10560194/pexels-photo-10560194.jpeg', // Bucharest aerial
    ],
    highlights: [
      {
        title: 'Rich History & Culture',
        image: 'https://images.pexels.com/photos/5105467/pexels-photo-5105467.jpeg',
        text: 'Explore medieval castles, fortified churches, and well-preserved historic towns that showcase a fascinating past.',
      },
      {
        title: 'Breathtaking Nature',
        image: 'https://images.pexels.com/photos/26146516/pexels-photo-26146516.jpeg',
        text: 'From the Carpathian Mountains to the Danube Delta, discover diverse landscapes and unforgettable outdoor adventures.',
      },
      {
        title: 'Delicious Cuisine',
        image: 'https://images.pexels.com/photos/10589774/pexels-photo-10589774.jpeg',
        text: 'Taste traditional dishes like sarmale, mămăligă, and mici, paired with excellent local wines.',
      },
    ],
    destinations: [
      { name: 'Brașov', lat: 45.6579, lon: 25.6012, image: 'https://images.pexels.com/photos/5718472/pexels-photo-5718472.jpeg' },
      { name: 'Cluj-Napoca', lat: 46.7712, lon: 23.6236, image: 'https://images.pexels.com/photos/36789066/pexels-photo-36789066.jpeg' },
      { name: 'Sibiu', lat: 45.7983, lon: 24.1256, image: 'https://images.pexels.com/photos/14340590/pexels-photo-14340590.jpeg' },
      { name: 'Constanța', lat: 44.1598, lon: 28.6348, image: 'https://images.pexels.com/photos/37378613/pexels-photo-37378613.jpeg' },
    ],
  },
};

/** Generic, permanent property-card fallbacks by property type. */
const PROPERTY_FALLBACKS = {
  apartment: 'https://images.pexels.com/photos/7587828/pexels-photo-7587828.jpeg',
  hotel: 'https://images.pexels.com/photos/7745929/pexels-photo-7745929.jpeg',
  villa: 'https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg',
  resort: 'https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg',
  guesthouse: 'https://images.pexels.com/photos/34119673/pexels-photo-34119673.jpeg',
  hostel: 'https://images.pexels.com/photos/34119673/pexels-photo-34119673.jpeg',
  default: 'https://images.pexels.com/photos/7587828/pexels-photo-7587828.jpeg',
};

/** Pick a stable image for a property card. */
export const propertyImage = (property, w = 800, h = 600) => {
  const direct =
    property?.imageUrl ||
    property?.image_url ||
    (Array.isArray(property?.images) && property.images[0]?.url) ||
    property?.thumbnail;
  if (direct) return direct;
  const type = (property?.property_type || '').toLowerCase();
  return sized(PROPERTY_FALLBACKS[type] || PROPERTY_FALLBACKS.default, w, h);
};

/** Permanent Pexels fallbacks for room cards, keyed loosely by room type. */
const ROOM_FALLBACKS = {
  suite: 'https://images.pexels.com/photos/14022458/pexels-photo-14022458.jpeg',
  deluxe: 'https://images.pexels.com/photos/6466285/pexels-photo-6466285.jpeg',
  double: 'https://images.pexels.com/photos/29702285/pexels-photo-29702285.jpeg',
  twin: 'https://images.pexels.com/photos/29702285/pexels-photo-29702285.jpeg',
  studio: 'https://images.pexels.com/photos/7587828/pexels-photo-7587828.jpeg',
  villa: 'https://images.pexels.com/photos/16573669/pexels-photo-16573669.jpeg',
  default: 'https://images.pexels.com/photos/7745929/pexels-photo-7745929.jpeg',
};

/** Permanent Pexels fallback for a property hero. */
const HERO_FALLBACK = 'https://images.pexels.com/photos/3011575/pexels-photo-3011575.jpeg';

/** First usable URL from an images array (strings or {url}/{src} objects). */
const firstUrl = (imgs) => {
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const f = imgs[0];
  return typeof f === 'string' ? f : f?.url || f?.src || null;
};

/**
 * Image for a room card. Uses the room's own photo when present, otherwise a
 * permanent Pexels fallback by room type. Pass `fallbackOnly` (from onError) to
 * force the fallback when the direct URL fails to load.
 */
export const roomImage = (room, w = 800, h = 600, { fallbackOnly = false } = {}) => {
  if (!fallbackOnly) {
    const direct = firstUrl(room?.images) || room?.imageUrl || room?.image_url;
    if (direct) return direct;
  }
  const type = (room?.room_type || '').toLowerCase();
  const key = Object.keys(ROOM_FALLBACKS).find((k) => type.includes(k)) || 'default';
  return sized(ROOM_FALLBACKS[key], w, h);
};

/** Image for the property hero, with a permanent Pexels fallback. */
export const heroImage = (property, w = 1600, h = 700, { fallbackOnly = false } = {}) => {
  if (!fallbackOnly) {
    const direct =
      firstUrl(property?.photos) ||
      firstUrl(property?.images) ||
      property?.imageUrl ||
      property?.image_url;
    if (direct) return direct;
  }
  return sized(HERO_FALLBACK, w, h);
};

const DEFAULT_COUNTRY = 'Romania';

/** Preset for a country, falling back to the default country. */
export const getPreset = (country) =>
  COUNTRY_PRESETS[country] || COUNTRY_PRESETS[DEFAULT_COUNTRY];

/** Reverse-geocode a coordinate to a country name (free Nominatim). */
export const detectCountry = async ({ lat, lon }) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&accept-language=en`
    );
    const data = await res.json();
    return data?.address?.country || DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
};

/**
 * Fetch fresh landscape photos for a query from Pexels. Returns an array of
 * `original` CDN urls, or an empty array on any failure (caller keeps its
 * curated fallback).
 */
export const fetchPhotos = async (query, count = 4) => {
  if (!PEXELS_KEY) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    return (data?.photos || []).map((p) => p.src.original);
  } catch {
    return [];
  }
};

export { DEFAULT_COUNTRY };
