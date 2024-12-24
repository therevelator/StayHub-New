import React from 'react';
import LocationMap from '../Map/LocationMap';

const PropertyLocation = ({ formData, setFormData }) => {
  const getFullAddress = () => {
    const { street, city, state, country, postalCode } = formData.location;
    return [street, city, state, postalCode, country]
      .filter(Boolean)
      .join(', ');
  };

  const handleVerifyLocation = (verifiedData) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: verifiedData.coordinates,
        // Optionally update other address components based on verification
        street: verifiedData.addressComponents.find(c => c.types.includes('street_number'))?.long_name || prev.location.street,
        city: verifiedData.addressComponents.find(c => c.types.includes('locality'))?.long_name || prev.location.city,
        state: verifiedData.addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name || prev.location.state,
        country: verifiedData.addressComponents.find(c => c.types.includes('country'))?.long_name || prev.location.country,
        postalCode: verifiedData.addressComponents.find(c => c.types.includes('postal_code'))?.long_name || prev.location.postalCode
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Address input fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ... your existing address input fields ... */}
      </div>

      {/* Map */}
      <div className="mt-4">
        <LocationMap
          address={getFullAddress()}
          coordinates={formData.location.coordinates}
          setCoordinates={(coords) => {
            setFormData(prev => ({
              ...prev,
              location: {
                ...prev.location,
                coordinates: coords
              }
            }));
          }}
          onVerifyLocation={handleVerifyLocation}
          isEditing={true}
        />
      </div>
    </div>
  );
};

export default PropertyLocation; 