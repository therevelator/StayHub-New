import db from '../config/database.js';

// Models are tried in order: when one is overloaded or rate-limited, the next takes over.
const geminiModels = () => [
  ...new Set([
    process.env.GEMINI_MODEL || 'gemini-flash-latest',
    ...(process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-lite-latest,gemini-3.5-flash').split(','),
  ].map((m) => m.trim()).filter(Boolean)),
];

// A bad request or a rejected key fails the same way on every model: stop there.
// Anything else (overloaded, rate-limited, retired model, network) moves on to the next.
const FATAL = new Set([400, 401, 403]);
const ATTEMPT_ROUNDS = 2;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const requestGemini = async (model, key, prompt) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Gemini error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }
};

// Call Gemini with a prompt, expecting a JSON object back.
const callGemini = async (prompt) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  let lastError;
  for (let round = 1; round <= ATTEMPT_ROUNDS; round += 1) {
    for (const model of geminiModels()) {
      try {
        return await requestGemini(model, key, prompt);
      } catch (error) {
        lastError = error;
        if (FATAL.has(error.status)) throw error;
        console.warn(`AI guide: model ${model} failed (${error.status || error.message}), round ${round}`);
      }
    }
    if (round < ATTEMPT_ROUNDS) await pause(2500);
  }
  throw lastError;
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
    if (error.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({
        status: 'error',
        message: 'The AI trip planner is not set up on this server (GEMINI_API_KEY is missing).',
      });
    }
    const status = error.status === 429 ? 429 : [500, 503].includes(error.status) ? 503 : 500;
    res.status(status).json({
      status: 'error',
      message:
        status === 429
          ? 'The AI service is rate-limited right now. Please try again in a moment.'
          : status === 503
            ? 'The AI service is overloaded right now. Please try again in a moment.'
            : 'Failed to generate the travel guide.',
    });
  }
};
