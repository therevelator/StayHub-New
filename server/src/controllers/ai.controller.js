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

const hasCoords = (p) => p && typeof p.lat === 'number' && typeof p.lon === 'number';

// Call Gemini with a prompt, expecting a JSON object back.
const callGemini = async (prompt) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
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
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
};

// Build the hidden prompt from the traveller's filters. This runs server-side
// only — the client never sees or sends the prompt text, just the raw filters.
const buildPreferenceLines = ({ interests, tripStyle, transportMode, hasCar }) => {
  const lines = [];
  if (interests?.length) {
    lines.push(
      `STRICT REQUIREMENT — the traveller selected these interests: ${interests.join(', ')}. ` +
        `Every place you suggest MUST fit at least one of these interests. ` +
        `Do NOT include anything that does not clearly match them.`
    );
  } else {
    lines.push('No specific interests were selected, so suggest the most iconic, well-rounded highlights.');
  }
  if (tripStyle?.length) {
    lines.push(`Trip style: ${tripStyle.join(', ')}. Match the pace, budget level and vibe to this.`);
  }
  if (transportMode) {
    lines.push(`They travel by ${transportMode}. Keep each day's places reachable that way and sensibly grouped.`);
  }
  if (hasCar) lines.push('They have a car, so day-trips a little further out are fine.');
  return lines.join('\n');
};

// Ask Gemini for a structured, route-aware, day-by-day itinerary as JSON.
const generateItinerary = async ({
  origin,
  destination,
  waypoints,
  days,
  interests,
  tripStyle,
  transportMode,
  hasCar,
  poiDistance,
}) => {
  const preferenceLines = buildPreferenceLines({ interests, tripStyle, transportMode, hasCar });

  const stops = [...(waypoints || []), destination].filter(Boolean);
  const hasRoute = Boolean(origin) && origin.trim().toLowerCase() !== destination.trim().toLowerCase();
  const routeIsDrivable = hasRoute && (transportMode === 'driving' || hasCar);

  const routeLine = hasRoute
    ? `This is a journey: start in "${origin}"` +
      (waypoints?.length ? `, travelling through ${waypoints.map((w) => `"${w}"`).join(', ')}` : '') +
      `, and finishing in "${destination}".`
    : `The destination is "${destination}".`;

  // Along-the-route stops only make sense for a real drivable journey.
  const routeStopsInstruction = routeIsDrivable
    ? `- "routeStops": 4-8 real attractions located ALONG the driving route between the stops, each WITHIN ${poiDistance} km of the road and OUTSIDE the main stop cities (${stops.join(', ')}). They must match the interests above. Each: {"name","category","description","lat","lon"}.`
    : `- "routeStops": an empty array [].`;

  const daysScope = stops.length > 1
    ? `covering the stop cities (${stops.join(', ')}), allocating days sensibly across them`
    : `for ${destination}`;

  const prompt = `You are an expert travel guide planning a ${days}-day trip.
${routeLine}
${preferenceLines}

Respond ONLY with JSON in EXACTLY this shape:
{
  "route": {"points":[{"name":"City name","type":"origin|waypoint|destination","lat":0.0,"lon":0.0}]},
  "routeStops": [{"name":"...","category":"landmark|museum|nature|food|shopping|nightlife|viewpoint","description":"one short sentence","lat":0.0,"lon":0.0}],
  "days": [{"day":1,"city":"which stop city this day is in","title":"short day theme","summary":"one sentence","places":[{"name":"...","category":"landmark|museum|nature|food|shopping|nightlife|viewpoint","description":"one short sentence","lat":0.0,"lon":0.0}]}]
}

Rules:
- "route.points": list ${hasRoute ? 'the origin, each waypoint in order, and the destination' : 'just the destination'} with real coordinates.
${routeStopsInstruction}
- "days": a ${days}-day plan ${daysScope}. Each day has 3-4 real places in a sensible geographic order. Every place MUST match the selected interests.
- Use real, accurate latitude/longitude for everything.`;

  const parsed = await callGemini(prompt);
  return {
    route: parsed?.route || { points: [] },
    routeStops: Array.isArray(parsed?.routeStops) ? parsed.routeStops : [],
    days: Array.isArray(parsed?.days) ? parsed.days : [],
  };
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
      origin = '',
      destination,
      waypoints = [],
      days = 3,
      interests = [],
      tripStyle = [],
      transportMode = '',
      hasCar = false,
      poiDistance = 25,
    } = req.body || {};
    if (!destination) {
      return res.status(400).json({ status: 'error', message: 'destination is required' });
    }
    const nDays = Math.min(Math.max(parseInt(days) || 3, 1), 10);
    const cleanWaypoints = (Array.isArray(waypoints) ? waypoints : [])
      .map((w) => (typeof w === 'string' ? w.trim() : ''))
      .filter(Boolean);

    const { route, routeStops, days: rawDays } = await generateItinerary({
      origin: origin.trim(),
      destination: destination.trim(),
      waypoints: cleanWaypoints,
      days: nDays,
      interests,
      tripStyle,
      transportMode,
      hasCar,
      poiDistance: Math.min(Math.max(parseInt(poiDistance) || 25, 5), 100),
    });

    // Enrich each day: keep only places with coords, and attach nearby hotels
    // from our platform at the day's centre.
    const enrichedDays = [];
    for (const day of rawDays) {
      const places = (day.places || []).filter(hasCoords);
      const centre = places.length
        ? {
            lat: places.reduce((s, p) => s + p.lat, 0) / places.length,
            lon: places.reduce((s, p) => s + p.lon, 0) / places.length,
          }
        : null;
      const hotels = centre ? await hotelsNear(centre.lat, centre.lon, 3) : [];
      enrichedDays.push({
        day: day.day,
        city: day.city || null,
        title: day.title,
        summary: day.summary,
        places,
        hotels,
      });
    }

    res.json({
      status: 'success',
      data: {
        origin: origin.trim() || null,
        destination: destination.trim(),
        waypoints: cleanWaypoints,
        route: { points: (route?.points || []).filter(hasCoords) },
        routeStops: routeStops.filter(hasCoords),
        days: enrichedDays,
      },
    });
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
