// Shared helpers for the Booking Console flow (search -> results -> stay -> checkout -> confirmed).
import { propertyImage } from '../../services/countryImages';

export const CURRENCY = '€';

export const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${CURRENCY}${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

// ---- dates ------------------------------------------------------------------
const toDate = (iso) => new Date(`${iso}T00:00:00`);

export const fmtDay = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  iso ? toDate(iso).toLocaleDateString('en-GB', opts) : '';

export const fmtShort = (iso) => fmtDay(iso, { day: 'numeric', month: 'short' });

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const n = Math.round((toDate(checkOut) - toDate(checkIn)) / 86400000);
  return n > 0 ? n : 0;
};

/** Every night slept: [checkIn, checkOut). */
export const nightsList = (checkIn, checkOut) => {
  const out = [];
  const n = nightsBetween(checkIn, checkOut);
  for (let i = 0; i < n; i += 1) {
    const d = toDate(checkIn);
    d.setDate(d.getDate() + i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
};

// ---- the trip query lives in the URL -----------------------------------------
const TRIP_KEYS = ['location', 'lat', 'lon', 'radius', 'guests', 'rooms', 'checkIn', 'checkOut'];

export const readTrip = (searchParams) => {
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  return {
    location: searchParams.get('location') || '',
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
    lon: searchParams.get('lon') ? parseFloat(searchParams.get('lon')) : null,
    radius: parseFloat(searchParams.get('radius')) || 25,
    guests: parseInt(searchParams.get('guests'), 10) || 2,
    rooms: parseInt(searchParams.get('rooms'), 10) || 1,
    checkIn,
    checkOut,
    nights: nightsBetween(checkIn, checkOut),
  };
};

/** Query string carrying only the trip (not view/filter state) to the next screen. */
export const tripQuery = (searchParams, extra = {}) => {
  const out = new URLSearchParams();
  TRIP_KEYS.forEach((k) => {
    const v = searchParams.get(k);
    if (v) out.set(k, v);
  });
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out.set(k, String(v));
  });
  return out.toString();
};

export const tripSummary = (trip) => {
  const parts = [];
  if (trip.location) parts.push(trip.location.split(',')[0]);
  if (trip.checkIn && trip.checkOut) parts.push(`${fmtShort(trip.checkIn)} – ${fmtShort(trip.checkOut)}`);
  parts.push(`${trip.guests} guest${trip.guests === 1 ? '' : 's'}`);
  return parts.join(' · ');
};

// ---- data shaping --------------------------------------------------------------
/** Arrays in the database are sometimes stored as JSON text (even twice). */
export const toArray = (value) => {
  let v = value;
  for (let i = 0; i < 2 && typeof v === 'string'; i += 1) {
    try { v = JSON.parse(v); } catch { return []; }
  }
  return Array.isArray(v) ? v : [];
};

export const roomNightly = (room) => {
  const n = parseFloat(room?.price_per_night ?? room?.base_price);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const lowestNightly = (property) => {
  const prices = toArray(property?.rooms).map(roomNightly).filter((p) => p !== null);
  return prices.length ? Math.min(...prices) : null;
};

export const firstSentence = (text, max = 140) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentence = clean.split(/(?<=[.!?])\s/)[0];
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
};

export const TYPE_LABELS = {
  hotel: 'Hotel', apartment: 'Apartment', villa: 'Villa', resort: 'Resort', guesthouse: 'Guesthouse',
  hostel: 'Hostel', house: 'House', condo: 'Condo', townhouse: 'Townhouse', cabin: 'Cabin',
  cottage: 'Cottage', bungalow: 'Bungalow', treehouse: 'Treehouse',
};
export const typeLabel = (type) => TYPE_LABELS[type] || (type ? type[0].toUpperCase() + type.slice(1) : 'Stay');

/** tone: 'good' | 'bad' | 'muted' */
export const cancellationInfo = (policy) => {
  switch ((policy || '').toLowerCase()) {
    case 'flexible': return { label: 'Flexible cancellation', tone: 'good' };
    case 'moderate': return { label: 'Moderate cancellation', tone: 'muted' };
    case 'strict': return { label: 'Strict cancellation', tone: 'bad' };
    default: return { label: 'Cancellation on request', tone: 'muted' };
  }
};

export const TONE_TEXT = { good: 'text-primary-600', bad: 'text-secondary-600', muted: 'text-gray-500' };

export const bedsLabel = (room) => {
  const beds = toArray(room?.beds)
    .filter((b) => b && b.type)
    .map((b) => `${b.count || 1} ${String(b.type).toLowerCase().replace(/ bed$/, '')}`);
  return beds.length ? beds.join(' + ') : room?.bed_type || room?.room_type || '';
};

export const stayImage = (property, w = 480, h = 320) => propertyImage(property, w, h);

// Normalised amenity names, as the search endpoint returns them
// (lower-cased, without spaces, "&" or "-").
const amenitySet = (property) =>
  new Set([...toArray(property?.normalized_amenities), ...toArray(property?.room_amenities)]);
const hasAny = (property, names) => {
  const set = amenitySet(property);
  return names.some((n) => set.has(n));
};

/**
 * Every filter is backed by a field that actually exists on the listing.
 * `rail: true` filters also appear as deal-breakers in the docked rail.
 */
export const FILTERS = [
  { id: 'free-cancel', label: 'Free cancellation', group: 'Money', rail: true,
    test: (p) => (p.cancellation_policy || '').toLowerCase() === 'flexible' },
  { id: 'breakfast', label: 'Breakfast included', group: 'Money', rail: true,
    test: (p) => hasAny(p, ['breakfastincluded', 'breakfast']) },
  { id: 'no-deposit', label: 'No deposit', group: 'Money',
    test: (p) => toArray(p.rooms).length > 0 && toArray(p.rooms).every((r) => !parseFloat(r.securityDeposit ?? r.security_deposit)) },
  { id: 'aircon', label: 'Air conditioning', group: 'Sleep', rail: true,
    test: (p) => hasAny(p, ['airconditioning', 'ac', 'aircon']) },
  { id: 'private-bath', label: 'Private bathroom', group: 'Sleep',
    test: (p) => hasAny(p, ['privatebathroom']) },
  { id: 'balcony', label: 'Balcony', group: 'Sleep',
    test: (p) => hasAny(p, ['balcony']) },
  { id: 'extra-bed', label: 'Extra bed available', group: 'Sleep',
    test: (p) => hasAny(p, ['extrabedavailable']) },
  { id: 'wifi', label: 'Wi-Fi', group: 'Work', rail: true,
    test: (p) => hasAny(p, ['wifi', 'freewifi', 'internet']) },
  { id: 'kitchen', label: 'Kitchen', group: 'Work',
    test: (p) => hasAny(p, ['kitchen']) },
  { id: 'room-service', label: 'Room service', group: 'Work',
    test: (p) => hasAny(p, ['roomservice']) },
  { id: 'parking', label: 'Parking on site', group: 'Getting around', rail: true,
    test: (p) => hasAny(p, ['parking', 'freeparking']) },
  { id: 'near', label: 'Within 2 km of your search', group: 'Getting around',
    test: (p) => p.distance_km != null && Number(p.distance_km) <= 2 },
  { id: 'pets', label: 'Pets allowed', group: 'Getting around',
    test: (p) => hasAny(p, ['petsallowed', 'petfriendly']) },
];
export const FILTER_GROUPS = ['Sleep', 'Work', 'Money', 'Getting around'];
export const filterById = (id) => FILTERS.find((f) => f.id === id);

/** Display tags for a result card: readable versions of what the listing offers. */
export const amenityTags = (property, max = 3) =>
  FILTERS.filter((f) => f.id !== 'near' && f.test(property)).slice(0, max).map((f) => f.label);

/** Total for the stay from the per-night availability map (same rule the server charges by). */
export const stayTotal = (room, availability, nights) => {
  const nightly = roomNightly(room) || 0;
  return nights.reduce((sum, day) => {
    const custom = parseFloat(availability?.[day]?.price);
    return sum + (Number.isFinite(custom) && custom > 0 ? custom : nightly);
  }, 0);
};

export const isRoomFree = (availability, nights) =>
  nights.every((day) => {
    const status = availability?.[day]?.status;
    return !status || status === 'available';
  });

/** Kilometres between two points (great-circle). */
export const distanceKm = (lat1, lon1, lat2, lon2) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
};
