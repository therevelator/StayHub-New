// Create a utility file for fallback properties
export const generateFallbackProperties = (location) => {
  // Create some sample properties based on the search location
  const romanianCities = ['Bucharest', 'Brasov', 'Cluj-Napoca', 'Sibiu', 'Timisoara', 'Constanta'];
  const cityToUse = romanianCities.includes(location) ? location : romanianCities[Math.floor(Math.random() * romanianCities.length)];
  
  return [
    {
      id: 'sample-1',
      name: `Luxury Apartment in ${cityToUse}`,
      description: 'Beautiful apartment with modern amenities in the heart of the city.',
      property_type: 'apartment',
      city: cityToUse,
      country: 'Romania',
      address: `123 Main Street, ${cityToUse}`,
      latitude: 44.4268,
      longitude: 26.1025,
      price: '85.00',
      bedrooms: 2,
      bathrooms: 1,
      max_guests: 4,
      total_max_occupancy: 4,
      imageUrl: 'https://cdn.pixabay.com/photo/2016/11/18/17/20/living-room-1835923_1280.jpg',
      isSample: true
    },
    {
      id: 'sample-2',
      name: `Cozy Villa near ${cityToUse}`,
      description: 'Spacious villa with garden and mountain views.',
      property_type: 'villa',
      city: cityToUse,
      country: 'Romania',
      address: `456 Forest Road, ${cityToUse}`,
      latitude: 44.4268,
      longitude: 26.1025,
      price: '150.00',
      bedrooms: 3,
      bathrooms: 2,
      max_guests: 6,
      total_max_occupancy: 6,
      imageUrl: 'https://cdn.pixabay.com/photo/2016/11/29/03/53/house-1867187_1280.jpg',
      isSample: true
    },
    {
      id: 'sample-3',
      name: `Historic Guesthouse in ${cityToUse}`,
      description: 'Traditional Romanian guesthouse with authentic decor and homemade meals.',
      property_type: 'guesthouse',
      city: cityToUse,
      country: 'Romania',
      address: `789 Old Town, ${cityToUse}`,
      latitude: 44.4268,
      longitude: 26.1025,
      price: '65.00',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      total_max_occupancy: 2,
      imageUrl: 'https://cdn.pixabay.com/photo/2020/05/07/18/51/sibiu-5142325_1280.jpg',
      isSample: true
    }
  ];
}; 