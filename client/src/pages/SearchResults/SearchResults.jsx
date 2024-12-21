import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PropertyCard from '../../components/Property/PropertyCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');
  

  useEffect(() => {
    const fetchProperties = async (params) => {
      try {
        setLoading(true);
        console.log('Fetching properties with params:', params);
        const response = await api.get('/properties/search', { params });
        setProperties(response.data.data || []);
      } catch (err) {
        setError('Failed to fetch properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    const getCurrentLocation = async (position) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
      );
      const data = await response.json();
      const municipality = data.address?.municipality || '';
      const county = data.address?.county || '';
      return municipality && county ? `${municipality}, ${county}` : '';
    };

    const initializeSearch = async () => {
      try {
        // Get current position first
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // Get location name from coordinates
        const currentLocation = await getCurrentLocation(position);
        setLocationName(currentLocation);

        // Create search parameters object
        const params = {
          location: searchParams.get('location') || currentLocation,
          guests: searchParams.get('guests') || '1',
          type: searchParams.get('type') || '',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          radius: 25
        };

        console.log('Current location:', currentLocation);
        console.log('Search params:', params);
        await fetchProperties(params);
      } catch (err) {
        console.error('Search initialization error:', err);
        // Fallback to search without location
        const params = {
          location: searchParams.get('location') || '',
          guests: searchParams.get('guests') || '1',
          type: searchParams.get('type') || '',
          radius: 25
        };
        await fetchProperties(params);
      }
    };

    initializeSearch();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {locationName ? `Properties in ${locationName}` : 'Available Properties'}
      </h1>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No properties found for your search criteria</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;