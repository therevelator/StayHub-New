import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UserIcon,
  HomeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/searchBar.css';
import FilterContainer from '../../components/FilterContainer/FilterContainer';

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
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [showFilters, setShowFilters] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 1000],
    rating: 0,
    amenities: {},
    beds: {}
  });

  const handleRadiusChange = (selectedRadius) => {
    setRadius(selectedRadius);
  };
  
  // Handle filter changes - wrapped in useCallback to prevent infinite renders
  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
    
    // Check if all filters are in their default state
    const areFiltersCleared = 
      newFilters.priceRange[0] === 0 &&
      newFilters.priceRange[1] === 1000 &&
      newFilters.rating === 0 &&
      Object.values(newFilters.amenities).every(val => !val) &&
      (!newFilters.beds || Object.values(newFilters.beds).every(val => !val));

    // If all filters are cleared, reset to original properties
    if (areFiltersCleared) {
      setFilteredProperties(properties);
      return;
    }
    
    // Apply filters to properties
    if (properties.length > 0) {
      const filtered = properties.filter(property => {
        // Apply price filter
        const propertyPrice = Number(property.price) || 0;
        if (propertyPrice < newFilters.priceRange[0] || propertyPrice > newFilters.priceRange[1]) {
          return false;
        }
        
        // Apply rating filter
        if (newFilters.rating > 0 && (!property.rating || property.rating < newFilters.rating)) {
          return false;
        }
        
        // Helper function to normalize keys
        const normalizeKey = (key) => {
          return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        // Helper function to parse room data
        const parseRooms = () => {
          if (!property.rooms) return [];
          return property.rooms.map(room => {
            if (typeof room === 'string') {
              try {
                return JSON.parse(room);
              } catch (e) {
                console.error('Error parsing room:', e);
                return null;
              }
            }
            return room;
          }).filter(room => room !== null);
        };

        // Apply amenities filter
        const selectedAmenities = Object.entries(newFilters.amenities)
          .filter(([_, selected]) => selected)
          .map(([name]) => normalizeKey(name));
        
        if (selectedAmenities.length > 0) {
          console.log('\n=== Checking Property Amenities ===');
          console.log(`Property ID: ${property.id}`);
          console.log(`Property Name: ${property.name}`);
          console.log('Selected amenities:', selectedAmenities);

          // Check amenities
          const hasAllAmenities = selectedAmenities.every(amenityKey => {
            // Check for kitchen
            if (amenityKey === 'kitchen') {
              const rooms = parseRooms();
              const hasKitchen = rooms.some(room => room.has_kitchen === 1 || room.has_kitchen === true);
              if (hasKitchen) {
                console.log('✅ Found kitchen in rooms');
                return true;
              }
            }

            // Check room_amenities array
            let roomAmenities = property.room_amenities;
            if (typeof roomAmenities === 'string') {
              try {
                roomAmenities = JSON.parse(roomAmenities);
              } catch (error) {
                console.error('Error parsing room_amenities:', error);
                return false;
              }
            }

            if (Array.isArray(roomAmenities) && roomAmenities.includes(amenityKey)) {
              console.log(`✅ Found ${amenityKey} in room amenities`);
              return true;
            }

            console.log(`❌ ${amenityKey} not found`);
            return false;
          });

          if (!hasAllAmenities) {
            return false;
          }
        }

        // Apply bed types filter
        const selectedBeds = Object.entries(newFilters.beds)
          .filter(([_, selected]) => selected)
          .map(([name]) => normalizeKey(name));

        if (selectedBeds.length > 0) {
          console.log('\n=== Checking Property Beds ===');
          console.log('Selected beds:', selectedBeds);

          // Check room_beds array
          let roomBeds = property.room_beds;
          if (typeof roomBeds === 'string') {
            try {
              roomBeds = JSON.parse(roomBeds);
            } catch (error) {
              console.error('Error parsing room_beds:', error);
              return false;
            }
          }

          const hasAllBeds = selectedBeds.every(bedType => {
            if (Array.isArray(roomBeds) && roomBeds.includes(bedType)) {
              console.log(`✅ Found ${bedType} in room beds`);
              return true;
            }
            console.log(`❌ ${bedType} not found`);
            return false;
          });

          if (!hasAllBeds) {
            return false;
          }
        }
        
        return true;
      });
      
      setFilteredProperties(filtered);
    }
  }, [properties]); // Only re-create when properties change
  
  // Toggle filters visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      
      // Try to get a more precise location first with a longer timeout
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('High accuracy geolocation error:', error);
          
          // If high accuracy fails, try again with lower accuracy but higher timeout
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Low accuracy geolocation success:', position.coords);
              setUserLocation({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              });
              setIsLoadingLocation(false);
            },
            (fallbackError) => {
              console.error('Fallback geolocation error:', fallbackError);
              setIsLoadingLocation(false);
              // You could set a default location here if needed
              // setUserLocation({ lat: 40.7128, lon: -74.0060 }); // Example: New York
            },
            {
              enableHighAccuracy: false,
              timeout: 30000, // Much longer timeout
              maximumAge: 60000 // Accept cached positions up to 1 minute old
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased from 5000
          maximumAge: 0
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setIsLoadingLocation(false);
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    // If we're trying to use current location but it's still loading, show a message
    if ((!location || location === 'Current Location') && isLoadingLocation) {
      setError('Please wait while we get your location...');
      return;
    }

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
        // Debug raw API response
        console.log('Raw API response:', JSON.stringify(response.data.data));
        
        // Check for base_price in the API response
        const hasBasePrice = response.data.data.some(property => 
          property.rooms && property.rooms.some(room => room.base_price)
        );
        console.log('API response contains base_price:', hasBasePrice);
        // Preprocess to remove base_price from all properties and rooms
        const preprocessedProperties = response.data.data.map(property => {
          // Create a new property object without base_price
          const newProperty = { ...property };
          
          // If property has rooms, remove base_price from each room
          if (newProperty.rooms && Array.isArray(newProperty.rooms)) {
            newProperty.rooms = newProperty.rooms.map(room => {
              // Create a new room object without base_price
              const { base_price, ...newRoom } = room;
              return newRoom;
            });
          }
          
          return newProperty;
        });
        
        // First map to add distance
        const propertiesWithDistance = preprocessedProperties.map(property => ({
          ...property,
          distance: calculateDistance(
            searchParams.lat,
            searchParams.lon,
            property.latitude,
            property.longitude
          )
        }));
        
        // If check-in and check-out dates are provided, fetch room prices for those dates
        let propertiesWithPrices = [...propertiesWithDistance];
        
        if (searchParams.checkIn && searchParams.checkOut) {
          // Process properties sequentially to avoid too many concurrent requests
          for (let i = 0; i < propertiesWithDistance.length; i++) {
            const property = propertiesWithDistance[i];
            
            if (property.rooms && Array.isArray(property.rooms) && property.rooms.length > 0) {
              try {
                // Create an array of promises for each room's availability check
                const roomPromises = property.rooms.map(room => {
                  return api.get(`/properties/${property.id}/rooms/${room.id}/availability`, {
                    params: {
                      startDate: searchParams.checkIn,
                      endDate: searchParams.checkOut
                    }
                  }).catch(err => {
                    console.error(`Error fetching room ${room.id} availability:`, err);
                    return { data: { data: { defaultPrice: room.price_per_night || 0 } } };
                  });
                });
                
                // Wait for all room availability checks to complete
                const roomResponses = await Promise.all(roomPromises);
                
                // Extract prices and calculate the lowest price
                const roomPrices = roomResponses.map(response => {
                  if (response.data && response.data.data) {
                    // Calculate average price from availability data
                    const availabilityData = response.data.data.availability || [];
                    if (availabilityData.length > 0) {
                      // Sum all prices and divide by number of days
                      const totalPrice = availabilityData.reduce((sum, day) => {
                        return sum + (parseFloat(day.price) || 0);
                      }, 0);
                      return totalPrice / availabilityData.length;
                    } else {
                      // Use default price if no availability data
                      return parseFloat(response.data.data.defaultPrice) || 0;
                    }
                  }
                  return 0;
                }).filter(price => price > 0);
                
                // Update the property with the lowest price
                if (roomPrices.length > 0) {
                  propertiesWithPrices[i] = {
                    ...propertiesWithPrices[i],
                    price: Math.min(...roomPrices)
                  };
                } else {
                  // Fallback to basic price calculation if no room prices available
                  const basicPrices = property.rooms
                    .map(room => {
                      // Only use price_per_night
                      const pricePerNight = room.price_per_night ? parseFloat(room.price_per_night) : 0;
                      return pricePerNight;
                    })
                    .filter(price => price > 0);
                  
                  propertiesWithPrices[i] = {
                    ...propertiesWithPrices[i],
                    price: basicPrices.length > 0 ? Math.min(...basicPrices) : (property.price || 0)
                  };
                }
              } catch (error) {
                console.error(`Error processing property ${property.id}:`, error);
                // Fallback to basic price calculation
                const basicPrices = property.rooms
                  .map(room => {
                    // Only use price_per_night
                    const pricePerNight = room.price_per_night ? parseFloat(room.price_per_night) : 0;
                    return pricePerNight;
                  })
                  .filter(price => price > 0);
                
                propertiesWithPrices[i] = {
                  ...propertiesWithPrices[i],
                  price: basicPrices.length > 0 ? Math.min(...basicPrices) : (property.price || 0)
                };
              }
            } else {
              // No rooms, use property price
              propertiesWithPrices[i] = {
                ...propertiesWithPrices[i],
                price: property.price || 0
              };
            }
          }
        } else {
          // If no dates provided, use basic price calculation
          propertiesWithPrices = propertiesWithDistance.map(property => {
            let lowestPrice = null;
            if (property.rooms && Array.isArray(property.rooms) && property.rooms.length > 0) {
              // Debug room data
              console.log('Property rooms:', property.id, property.rooms.map(r => ({
                id: r.id,
                price_per_night: r.price_per_night
              })));
              
              // Calculate prices with strict type handling
              const prices = property.rooms
                .map(room => {
                  // Log room price data for debugging
                  console.log(`Room ${room.id} price data:`, {
                    price_per_night: room.price_per_night,
                    price_per_night_parsed: parseFloat(room.price_per_night)
                  });
                  
                  // Only use price_per_night
                  const pricePerNight = room.price_per_night ? parseFloat(room.price_per_night) : 0;
                  console.log(`Room ${room.id} price: ${pricePerNight}`);
                  return pricePerNight;
                })
                .filter(price => price > 0);
                
              console.log('Calculated prices:', prices);
              
              if (prices.length > 0) {
                lowestPrice = Math.min(...prices);
              }
            }
            
            // Log room prices for debugging
            if (property.rooms && Array.isArray(property.rooms) && property.rooms.length > 0) {
              console.log(`Property ${property.id} rooms:`, property.rooms.map(r => ({
                id: r.id,
                price_per_night: r.price_per_night
              })));
            }
            
            const finalPrice = lowestPrice || property.price || 0;
            console.log(`Property ${property.id} final price: ${finalPrice}`);
            return {
              ...property,
              price: finalPrice
            };
          });
        }
        
        // Final properties with both distance and accurate prices
        const propertiesWithDistanceAndPrice = propertiesWithPrices;
        
        // Enhance properties with room amenities
        const enhancedProperties = propertiesWithDistanceAndPrice.map(property => {
          // Start with the property's own amenities
          let allAmenities = Array.isArray(property.amenities) ? [...property.amenities] : [];
          
          // Add all room amenities to the property's amenities
          if (property.rooms && Array.isArray(property.rooms)) {
            property.rooms.forEach(room => {
              if (room.amenities) {
                // Handle different room amenity formats
                if (Array.isArray(room.amenities)) {
                  // Add each room amenity to the property amenities
                  room.amenities.forEach(amenity => {
                    // Handle both string and object amenities
                    const amenityValue = typeof amenity === 'object' ? 
                      (amenity.amenity || amenity.name || '') : amenity;
                    
                    if (amenityValue && !allAmenities.includes(amenityValue)) {
                      allAmenities.push(amenityValue);
                    }
                  });
                } else if (typeof room.amenities === 'object') {
                  // Handle object format amenities
                  Object.entries(room.amenities).forEach(([key, value]) => {
                    if (value === true && !allAmenities.includes(key)) {
                      allAmenities.push(key);
                    } else if (Array.isArray(value)) {
                      value.forEach(item => {
                        const amenityValue = typeof item === 'object' ? 
                          (item.amenity || item.name || '') : item;
                        
                        if (amenityValue && !allAmenities.includes(amenityValue)) {
                          allAmenities.push(amenityValue);
                        }
                      });
                    }
                  });
                }
              }
              
              // Also check for view_type and add it as an amenity
              if (room.view_type && !allAmenities.includes(room.view_type)) {
                allAmenities.push(room.view_type);
                console.log(`Added view type '${room.view_type}' from room ${room.id} to property ${property.id}`);
              }
            });
          }
          
          console.log(`Property ${property.id} amenities enhanced from ${property.amenities?.length || 0} to ${allAmenities.length}`);
          
          // Return the enhanced property with all amenities
          return {
            ...property,
            amenities: allAmenities
          };
        });
        
        console.log('Properties received:', enhancedProperties);
        setProperties(enhancedProperties);
        setFilteredProperties(enhancedProperties);
        setSearchParams(searchParams);
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

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Always visible on desktop */}
          <div className="lg:w-1/5 lg:flex-shrink-0">
            <FilterContainer 
              onFilterChange={handleFilterChange} 
              properties={properties} 
            />
          </div>

          {/* Right Content Area */}
          <div className="lg:w-4/5 lg:flex-grow">
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

                <button
                  type="submit"
                  className={`w-full bg-primary-600 text-white py-2 px-4 rounded-md font-medium text-sm hover:bg-primary-700 transition-colors ${
                    loading || ((!location || location === 'Current Location') && isLoadingLocation)
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  disabled={loading || ((!location || location === 'Current Location') && isLoadingLocation)}
                >
                  {loading 
                    ? 'Searching...' 
                    : ((!location || location === 'Current Location') && isLoadingLocation)
                      ? 'Getting location...'
                      : 'Search'
                  }
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

            {/* Filter Toggle Button (Mobile/Tablet Only) */}
            <div className="lg:hidden mb-4">
              <button
                onClick={toggleFilters}
                className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Mobile/Tablet Filters (Collapsible) */}
            <div className={`lg:hidden mb-6 ${showFilters ? 'block' : 'hidden'}`}>
              <FilterContainer onFilterChange={handleFilterChange} properties={properties} />
            </div>
            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredProperties.length === 0 && (
                <div className="col-span-full text-center text-gray-500">
                  {loading ? 'Searching...' : properties.length > 0 ? 'No properties match your filters' : 'No properties found'}
                </div>
              )}
              {filteredProperties.map((property) => (
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
                    from ${Number(property.price).toFixed(2)}/night
                    {searchParams.checkIn && searchParams.checkOut && <span className="text-xs block">for selected dates</span>}
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
      </div>
    </div>
  );
};

export default Home;