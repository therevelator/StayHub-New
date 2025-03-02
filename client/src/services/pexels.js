const searchPhotos = async (query) => {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': import.meta.env.VITE_PEXELS_API_KEY
      }
    });
    const data = await response.json();
    return data.photos;
  } catch (error) {
    console.error('Error fetching photos from Pexels:', error);
    return null;
  }
};

export const getRandomCityPhoto = async (city) => {
  try {
    const photos = await searchPhotos(city);
    if (photos && photos.length > 0) {
      return photos[0].src.landscape;
    }
    return null;
  } catch (error) {
    console.error('Error getting random city photo:', error);
    return null;
  }
};

export { searchPhotos };
