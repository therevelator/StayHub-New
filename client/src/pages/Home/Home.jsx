import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UserIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/searchBar.css';

const propertyTypes = [
  { label: 'Any Type', value: '' },
  { label: 'Hotel', value: 'hotel' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Villa', value: 'villa' },
  { label: 'Resort', value: 'resort' },
  { label: 'Guesthouse', value: 'guesthouse' },
  { label: 'Hostel', value: 'hostel' }
];

const radiusOptions = [
  { value: 25, label: '25 km', includes: [25] },
  { value: 50, label: '50 km', includes: [25, 50] },
  { value: 75, label: '75 km', includes: [25, 50, 75] }
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${Math.round(distance)} km`;
};

const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState(1);
  const [propertyType, setPropertyType] = useState('');
  const [radius, setRadius] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);

  const handleRadiusChange = (selectedRadius) => {
    setRadius(selectedRadius);
  };

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let searchParams = {
        guests,
        type: propertyType,
        radius,
        checkIn: checkInDate,
        checkOut: checkOutDate
      };

      // Handle location and coordinates
      if (!location || location === 'Current Location') {
        if (userLocation) {
          searchParams = {
            ...searchParams,
            location: 'Current Location',
            lat: userLocation.lat,
            lon: userLocation.lon
          };
          console.log('Using current location:', userLocation);
        } else {
          throw new Error('Could not get your location. Please allow location access or enter a location manually.');
        }
      } else {
        try {
          // Geocode the entered location
          console.log('Geocoding location:', location);
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
          const geocodeResponse = await fetch(geocodeUrl);
          const geocodeData = await geocodeResponse.json();

          if (!geocodeData.length) {
            throw new Error('Location not found');
          }

          console.log('Geocoding result:', geocodeData[0]);
          searchParams = {
            ...searchParams,
            location,
            lat: parseFloat(geocodeData[0].lat),
            lon: parseFloat(geocodeData[0].lon)
          };
        } catch (error) {
          console.error('Geocoding error:', error);
          throw new Error('Failed to find the location. Please try a different location.');
        }
      }

      console.log('Final search parameters:', searchParams);

      const response = await api.get('/properties/search', {
        params: searchParams
      });

      if (response.data.status === 'success') {
        const propertiesWithDistance = response.data.data.map(property => ({
          ...property,
          distance: calculateDistance(
            searchParams.lat,
            searchParams.lon,
            property.latitude,
            property.longitude
          )
        }));
        
        console.log('Properties received:', propertiesWithDistance);
        setProperties(propertiesWithDistance);
      } else {
        console.error('Search error:', response.data.message);
        setProperties([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
          Find Your Perfect Stay
        </h1>
        <p className="text-lg text-gray-600 text-center mb-8">
          Discover amazing properties at the best prices
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="search-bar">
            <div className="search-section">
              <label className="search-label">Location</label>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Destination..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="search-section">
              <label className="search-label">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="search-select"
              >
                <option value="">Any Type</option>
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-section">
              <label className="search-label">Guests</label>
              <input
                type="number"
                min="1"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="search-input"
              />
            </div>

            <div className="search-section">
              <label className="search-label">Radius</label>
              <select
                value={radius}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                className="search-select"
              >
                {radiusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-section">
              <label className="search-label">Check-in Date</label>
              <DatePicker
                selected={checkInDate}
                onChange={date => setCheckInDate(date)}
                placeholderText="Check-in date"
                className="date-picker"
                dateFormat="MMM d, yyyy"
                minDate={new Date()}
              />
            </div>

            <div className="search-section">
              <label className="search-label">Check-out Date</label>
              <DatePicker
                selected={checkOutDate}
                onChange={date => setCheckOutDate(date)}
                placeholderText="Check-out date"
                className="date-picker"
                dateFormat="MMM d, yyyy"
                minDate={checkInDate || new Date()}
              />
            </div>

            <button type="submit" className="search-button" disabled={loading}>
              <MagnifyingGlassIcon className="search-icon" />
              <span className="search-button-text">Search</span>
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              {loading ? 'Searching...' : 'No properties found'}
            </div>
          )}
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <img
                src={property.imageUrl || '/placeholder-property.jpg'}
                alt={property.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {property.name || 'Unnamed Property'}
                </h3>
                <p className="text-gray-600 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  {`${property.city}, ${property.country}`}
                  {property.distance && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({formatDistance(property.distance)})
                    </span>
                  )}
                </p>
                <p className="text-gray-600 mb-4">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  {property.total_max_occupancy} guests max
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-primary-600 font-semibold">
                    ${property.price || 0}/night
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/property/${property.id}`);
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;