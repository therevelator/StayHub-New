const DISTANCE_THRESHOLD = 1; // Maximum allowed distance in kilometers

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

class LocationService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Verify that the provided coordinates match the given address
   * @param {Object} locationData - Location data to verify
   * @param {string} locationData.street - Street address
   * @param {string} locationData.city - City
   * @param {string} locationData.state - State/Province
   * @param {string} locationData.country - Country
   * @param {string} locationData.postal_code - Postal code
   * @param {number|string} locationData.latitude - Latitude
   * @param {number|string} locationData.longitude - Longitude
   * @returns {Promise<Object>} Verification result with match details
   */
  async verifyCoordinatesMatchAddress(locationData) {
    try {
      const {
        street = '',
        city = '',
        state = '',
        country = '',
        postal_code = '',
        latitude,
        longitude
      } = locationData;

      // Build address query
      const addressQuery = [street, city, state, country, postal_code]
        .filter(Boolean)
        .join(', ');

      if (!addressQuery || !latitude || !longitude) {
        throw new Error('Both address and coordinates are required for verification');
      }

      // Geocode the address
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(addressQuery)}&key=${this.apiKey}&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return {
          matches: false,
          reason: 'Address not found',
          distance: null,
          suggestedLocation: null
        };
      }

      // Find best matching result
      const matchingResult = data.results.find(result => {
        const components = result.components;
        const cityMatch = 
          components.city?.toLowerCase() === city.toLowerCase() ||
          components.town?.toLowerCase() === city.toLowerCase();
        const countryMatch = 
          components.country?.toLowerCase() === country.toLowerCase();
        return cityMatch && countryMatch;
      }) || data.results[0];

      // Calculate distance between provided coordinates and geocoded location
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        matchingResult.geometry.lat,
        matchingResult.geometry.lng
      );

      const matches = distance <= DISTANCE_THRESHOLD;

      return {
        matches,
        reason: matches ? 'Location verified' : `Location mismatch: ${distance.toFixed(2)}km difference`,
        distance,
        suggestedLocation: {
          latitude: matchingResult.geometry.lat,
          longitude: matchingResult.geometry.lng,
          formattedAddress: matchingResult.formatted,
          components: matchingResult.components
        }
      };
    } catch (error) {
      console.error('Error verifying location:', error);
      throw new Error('Failed to verify location: ' + error.message);
    }
  }
};

export default LocationService;
