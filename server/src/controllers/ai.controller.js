import db from '../config/database.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Build the hidden prompt from the traveller's filters. This runs server-side
// only — the client never sees or sends the prompt text, just the raw filters.
const buildPreferenceLines = ({ interests, tripStyle, transportMode, hasCar }) => {
  const lines = [];
  if (interests?.length) lines.push(`The traveller is interested in: ${interests.join(', ')}.`);
  if (tripStyle?.length) lines.push(`Trip style: ${tripStyle.join(', ')}. Tailor the pace, budget level and vibe of the suggestions to this.`);
  if (transportMode) {
    lines.push(`They will get around by ${transportMode}. Keep each day's places reachable that way and grouped so travel between them is reasonable.`);
  }
  if (hasCar) lines.push('They have a car, so day-trips a bit further out are fine.');
  return lines.join('\n');
};

// Ask Gemini for a structured, day-by-day itinerary as JSON.
const generateItinerary = async ({ destination, days, interests, tripStyle, transportMode, hasCar }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');

  const preferenceLines = buildPreferenceLines({ interests, tripStyle, transportMode, hasCar });

  const prompt = `You are a travel guide. Plan a ${days}-day trip to ${destination}.
${preferenceLines}
For each day give 3-4 real places to visit (landmarks, museums, parks, neighbourhoods, viewpoints, notable restaurants), in a sensible geographic order that matches the preferences above.
For every place include its real approximate latitude and longitude.
Respond ONLY with JSON in exactly this shape:
{"days":[{"day":1,"title":"short day theme","summary":"one sentence","places":[{"name":"...","category":"landmark|museum|nature|food|shopping|nightlife|viewpoint","description":"one short sentence","lat":0.0,"lon":0.0}]}]}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Strip code fences if the model wrapped the JSON.
    const cleaned = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }
  return parsed?.days || [];
};

// Recommend up to `limit` of OUR properties nearest to a coordinate, but only
// those within `maxKm` — recommending a hotel 1000km from the destination is
// worse than recommending none.
const hotelsNear = async (lat, lon, limit = 3, maxKm = 150) => {
  if (lat == null || lon == null) return [];
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.city, p.country, p.latitude, p.longitude, p.property_type,
            (SELECT MIN(r.price_per_night) FROM rooms r WHERE r.property_id = p.id) AS from_price
     FROM properties p
     WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL`
  );
  return rows
    .map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      country: p.country,
      lat: parseFloat(p.latitude),
      lon: parseFloat(p.longitude),
      property_type: p.property_type,
      fromPrice: p.from_price != null ? parseFloat(p.from_price) : null,
      distanceKm: Math.round(haversineKm(lat, lon, parseFloat(p.latitude), parseFloat(p.longitude))),
    }))
    .filter((h) => h.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};

export const generateGuide = async (req, res) => {
  try {
    const {
      destination,
      days = 3,
      interests = [],
      tripStyle = [],
      transportMode = '',
      hasCar = false,
    } = req.body || {};
    if (!destination) {
      return res.status(400).json({ status: 'error', message: 'destination is required' });
    }
    const nDays = Math.min(Math.max(parseInt(days) || 3, 1), 7);

    const rawDays = await generateItinerary({
      destination,
      days: nDays,
      interests,
      tripStyle,
      transportMode,
      hasCar,
    });

    // Enrich each day: keep only places with coords, and attach nearby hotels
    // from our platform at the day's centre.
    const enriched = [];
    for (const day of rawDays) {
      const places = (day.places || []).filter(
        (p) => typeof p.lat === 'number' && typeof p.lon === 'number'
      );
      const centre = places.length
        ? {
            lat: places.reduce((s, p) => s + p.lat, 0) / places.length,
            lon: places.reduce((s, p) => s + p.lon, 0) / places.length,
          }
        : null;
      const hotels = centre ? await hotelsNear(centre.lat, centre.lon, 3) : [];
      enriched.push({
        day: day.day,
        title: day.title,
        summary: day.summary,
        places,
        hotels,
      });
    }

    res.json({ status: 'success', data: { destination, days: enriched } });
  } catch (error) {
    console.error('AI guide error:', error.message);
    const status = error.status === 429 ? 429 : 500;
    res.status(status).json({
      status: 'error',
      message:
        status === 429
          ? 'The AI service is rate-limited right now. Please try again in a moment.'
          : 'Failed to generate the travel guide.',
    });
  }
};
