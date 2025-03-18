import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Hardcode the API key directly for now to ensure it works
// In production, you should use environment variables properly
const PIXABAY_API_KEY = "3655340-cd4ea00e08cc15a27d1d7b097";

const LocationImages = ({ location }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!location) return;
      
      try {
        setLoading(true);
        // Use Pixabay API with hardcoded key
        const response = await axios.get(
          `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(location)}&image_type=photo&orientation=horizontal&per_page=6&safesearch=true&category=travel,places`
        );
        
        if (response.data.hits && response.data.hits.length > 0) {
          setImages(response.data.hits);
        } else {
          // If no results for specific location, try with "Romania" + location
          const fallbackResponse = await axios.get(
            `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent("Romania " + location)}&image_type=photo&orientation=horizontal&per_page=6&safesearch=true&category=travel,places`
          );
          
          if (fallbackResponse.data.hits && fallbackResponse.data.hits.length > 0) {
            setImages(fallbackResponse.data.hits);
          } else {
            // Last resort: just show Romania images
            const romaniaResponse = await axios.get(
              `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=Romania&image_type=photo&orientation=horizontal&per_page=6&safesearch=true&category=travel,places`
            );
            setImages(romaniaResponse.data.hits || []);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images');
        setLoading(false);
        
        // Fallback to static images if API fails
        setImages([
          { id: 'fallback1', webformatURL: 'https://cdn.pixabay.com/photo/2019/07/21/15/48/bran-castle-4352488_1280.jpg', tags: 'Bran Castle, Romania' },
          { id: 'fallback2', webformatURL: 'https://cdn.pixabay.com/photo/2020/03/26/22/15/romania-4971446_1280.jpg', tags: 'Bucharest, Romania' },
          { id: 'fallback3', webformatURL: 'https://cdn.pixabay.com/photo/2020/05/07/18/51/sibiu-5142325_1280.jpg', tags: 'Sibiu, Romania' },
        ]);
      }
    };

    fetchImages();
  }, [location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 container mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-4">Discover {location}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <div key={image.id} className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
            <img 
              src={image.webformatURL} 
              alt={image.tags || `Image of ${location}`}
              className="w-full h-64 object-cover transform hover:scale-105 transition-transform duration-300"
            />
            <div className="p-3 bg-white">
              <p className="text-sm text-gray-700 font-medium">{image.tags.split(',')[0]}</p>
              {image.user && (
                <p className="text-xs text-gray-500 mt-1">
                  Photo by {image.user}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationImages; 