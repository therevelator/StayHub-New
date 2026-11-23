/**
 * Read a JSON column value. PostgreSQL returns jsonb already parsed, while some
 * older rows hold JSON text stored as a string, so accept both: parsed values
 * pass through, strings are parsed, and empty or unreadable values give the fallback.
 */
export const parseJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
};
