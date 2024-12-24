import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { geocodeByAddress, getLatLng } from 'react-places-autocomplete';

const LocationMap = ({ 
  address, 
  coordinates, 
  setCoordinates, 
  onVerifyLocation,
  isEditing = false 
}) => {
  const [map, setMap] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(coordinates);

  // Update current position when coordinates prop changes
  useEffect(() => {
    if (coordinates?.lat && coordinates?.lng) {
      setCurrentPosition(coordinates);
      if (map) {
        map.panTo({ lat: coordinates.lat, lng: coordinates.lng });
      }
    }
  }, [coordinates, map]);

  const defaultCenter = {
    lat: currentPosition?.lat || coordinates?.lat || 0,
    lng: currentPosition?.lng || coordinates?.lng || 0
  };

  const handleVerifyLocation = useCallback(async () => {
    if (!address) {
      setVerificationStatus('Please enter an address first');
      return;
    }

    setIsLoading(true);
    try {
      const results = await geocodeByAddress(address);
      if (results && results[0]) {
        const latLng = await getLatLng(results[0]);
        
        setCurrentPosition(latLng);
        setCoordinates(latLng);
        
        if (map) {
          map.panTo(latLng);
        }

        onVerifyLocation({
          coordinates: latLng,
          formattedAddress: results[0].formatted_address,
          addressComponents: results[0].address_components
        });

        setVerificationStatus('Location verified successfully!');
      } else {
        setVerificationStatus('Could not verify location. Please check the address.');
      }
    } catch (error) {
      console.error('Error verifying location:', error);
      setVerificationStatus('Error verifying location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [address, map, setCoordinates, onVerifyLocation]);

  return (
    <div className="relative w-full h-[400px]">
      <GoogleMap
        mapContainerClassName="w-full h-full rounded-lg"
        center={defaultCenter}
        zoom={15}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
        options={{
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true
        }}
      >
        {currentPosition && (
          <Marker
            position={currentPosition}
            draggable={isEditing}
            onDragEnd={(e) => {
              const newPos = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              };
              setCurrentPosition(newPos);
              setCoordinates(newPos);
            }}
          />
        )}
      </GoogleMap>

      {isEditing && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleVerifyLocation}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${
              isLoading 
                ? 'bg-gray-400' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Verifying...' : 'Verify Location'}
          </button>
          {verificationStatus && (
            <div className={`mt-2 p-2 rounded-md text-sm ${
              verificationStatus.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {verificationStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationMap; 