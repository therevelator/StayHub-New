// Simple location image utility
export const getLocationImageUrl = (location: string, width = 800, height = 600): string => {
  // Format location for URL - lowercase and remove special characters
  const formattedLocation = location.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Use direct placeholder images
  return `https://placehold.co/${width}x${height}/jpeg?text=${formattedLocation}`;
};

// Default fallback image URL
export const DEFAULT_IMAGE = 'https://placehold.co/800x600/jpeg?text=Default';

// For backward compatibility
export const getLocationImage = (location: string): string => {
  return getLocationImageUrl(location);
}; 