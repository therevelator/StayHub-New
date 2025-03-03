import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { StarIcon, CalendarDaysIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import propertyService from '../../services/propertyService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { debounce } from 'lodash';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map events and bounds
const MapEventsHandler = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    }
  });
  return null;
};

// Component to handle map controls
const MapController = ({ location }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, {
        duration: 1.5
      });
    }
  }, [location, map]);
  
  return null;
};

const Trips = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Only used for booking
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [mapCenter, setMapCenter] = useState([45.9432, 24.9668]); // Default to Romania center
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [visibleProperties, setVisibleProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState(null);
  
  // Search for locations using OpenCage
  const searchLocation = useCallback(debounce(async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}&limit=5`
      );
      const data = await response.json();
      
      if (data.results) {
        const locations = data.results.map(result => ({
          name: result.formatted,
          lat: result.geometry.lat,
          lng: result.geometry.lng,
          bounds: result.bounds
        }));
        setSearchResults(locations);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  }, 500), []);

  // Handle location selection
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = useCallback((location) => {
    setSearchQuery(location.name);
    setSearchResults([]);
    setSelectedLocation({
      lat: location.lat,
      lng: location.lng
    });
    
    // Handle bounds for property filtering
    if (location.bounds) {
      const bounds = L.latLngBounds(
        [location.bounds.southwest.lat, location.bounds.southwest.lng],
        [location.bounds.northeast.lat, location.bounds.northeast.lng]
      );
      handleBoundsChange(bounds);
    }
  }, []);

  // Map ready handler
  const onMapReady = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Handle search button click
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(searchQuery)}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}&limit=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = {
          name: data.results[0].formatted,
          lat: data.results[0].geometry.lat,
          lng: data.results[0].geometry.lng,
          bounds: data.results[0].bounds
        };
        handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, handleLocationSelect]);

  // Parse room data to handle objects and arrays
  const parseRoomData = useCallback((room) => {
    if (!room) return room;
    try {
      return {
        ...room,
        beds: typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds,
        amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities,
        accessibility_features: typeof room.accessibility_features === 'string' ? 
          JSON.parse(room.accessibility_features) : room.accessibility_features,
        images: typeof room.images === 'string' ? JSON.parse(room.images) : room.images
      };
    } catch (error) {
      console.error('Error parsing room data:', error);
      return room;
    }
  }, []);

  // Handle booking room click
  const handleBookNowClick = useCallback((propertyId, roomId) => {
    if (!startDate || !endDate) {
      // Show error message if dates not selected
      Swal.fire({
        title: 'Select Dates',
        text: 'Please select check-in and check-out dates first',
        icon: 'warning',
      });
      return;
    }

    if (!user) {
      // Save intended destination with dates
      const destination = `/property/${propertyId}/room/${roomId}?` + 
        `startDate=${startDate.toISOString().split('T')[0]}&` +
        `endDate=${endDate.toISOString().split('T')[0]}`;
      localStorage.setItem('redirectAfterLogin', destination);
      navigate('/login');
      return;
    }

    // Navigate with dates as query parameters
    navigate(`/property/${propertyId}/room/${roomId}?` + 
      `startDate=${startDate.toISOString().split('T')[0]}&` +
      `endDate=${endDate.toISOString().split('T')[0]}`);
  }, [user, navigate, startDate, endDate]);

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds) => {
    if (!bounds || !properties?.length) return;
    
    // Extend the bounds by 50% to include nearby properties
    const extendedBounds = bounds.pad(0.5);
    
    console.log('Map bounds:', {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
    
    console.log('Extended bounds:', {
      north: extendedBounds.getNorth(),
      south: extendedBounds.getSouth(),
      east: extendedBounds.getEast(),
      west: extendedBounds.getWest()
    });
    
    const visible = properties.filter(property => {
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      
      console.log(`Checking property ${property.id}:`, {
        name: property.name,
        lat,
        lng,
        isValid: !isNaN(lat) && !isNaN(lng),
        isInBounds: !isNaN(lat) && !isNaN(lng) ? extendedBounds.contains([lat, lng]) : false
      });
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      // Check if property is within the extended bounds
      return extendedBounds.contains([lat, lng]);
    });
    
    console.log('Visible properties:', visible.map(p => ({ id: p.id, name: p.name })));
    setVisibleProperties(visible);
  }, [properties]);

  // Fetch all properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertyService.getAll();
        const propertiesData = response.data || [];
        
        // Parse room data for each property
        const parsedProperties = propertiesData.map(property => {
          console.log('Property data:', {
            id: property.id,
            name: property.name,
            latitude: property.latitude,
            longitude: property.longitude,
            address: `${property.street}, ${property.city}, ${property.state}, ${property.country}`
          });
          return {
            ...property,
            rooms: (property.rooms || []).map(parseRoomData)
          };
        });
        
        setProperties(parsedProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    fetchProperties();
  }, [parseRoomData]);

  // Debounced availability check
  const debouncedCheckAvailability = useCallback(
    debounce(async (property, start, end) => {
      if (!start || !end || !property?.rooms?.length) return;

      try {
        const formattedStartDate = start.toISOString().split('T')[0];
        const formattedEndDate = end.toISOString().split('T')[0];
        
        const availability = await propertyService.getRoomAvailability(
          property.id,
          property.rooms[0].id,
          formattedStartDate,
          formattedEndDate
        );

        // Check if all requested dates are available
        const dates = Object.keys(availability.data.availability || {});
        const isAvailable = dates.every(date => 
          availability.data.availability[date].status === 'available'
        );

        setSelectedProperty(prev => {
          if (prev?.id !== property.id) return prev; // Don't update if property changed
          return {
            ...prev,
            rooms: prev.rooms.map(room => ({
              ...room,
              isAvailable,
              price: availability.data.default_price
            }))
          };
        });
      } catch (error) {
        console.error(`Error checking availability:`, error);
      }
    }, 1000), // Wait 1 second after changes before checking
    [] // Empty dependency array since we pass all needed data as arguments
  );

  // Effect to trigger availability check
  useEffect(() => {
    if (startDate && endDate && selectedProperty) {
      debouncedCheckAvailability(selectedProperty, startDate, endDate);
    }
    
    // Cleanup pending checks when component unmounts
    return () => debouncedCheckAvailability.cancel();
  }, [debouncedCheckAvailability, startDate, endDate, selectedProperty?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Plan Your Trip</h1>
          
          {/* Search and Date Selection */}
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
            {/* Location Search */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchLocation(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    placeholder="Where are you going? (e.g., Paris, Bucharest)"
                    className="w-full outline-none text-gray-700"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(result)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      {result.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-1">
                <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                <div className="w-full">
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    placeholderText="Check-in date"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dateFormat="MMM d, yyyy"
                    popperClassName="z-[1000]"
                    popperPlacement="bottom-start"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                <div className="w-full">
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="Check-out date"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dateFormat="MMM d, yyyy"
                    popperClassName="z-[1000]"
                    popperPlacement="bottom-start"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapEventsHandler onBoundsChange={handleBoundsChange} />
              {selectedLocation && <MapController location={selectedLocation} />}
              {visibleProperties.map((property) => (
                <Marker 
                  key={property.id} 
                  position={[property.latitude, property.longitude]}
                  eventHandlers={{
                    click: () => setSelectedProperty(property)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold">{property.name}</h3>
                      <p className="text-sm text-gray-600">{property.city}, {property.country}</p>
                      {property.rooms?.[0] && (
                        <p className="text-sm font-medium">From ${property.rooms[0].price_per_night}/night</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Property Details Section */}
          <div className="space-y-4">
            {selectedProperty ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {selectedProperty.images?.[0] && (
                  <img 
                    src={selectedProperty.images[0].url} 
                    alt={selectedProperty.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{selectedProperty.name}</h3>
                  <p className="text-gray-600">{selectedProperty.city}, {selectedProperty.country}</p>
                  
                  {/* Property Info */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {selectedProperty.star_rating > 0 && (
                      <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400" />
                        <span className="ml-1 text-sm font-medium">{selectedProperty.star_rating}</span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500">Property Type</h4>
                      <p className="text-gray-700">{selectedProperty.type || 'Not specified'}</p>
                    </div>
                    {selectedProperty.amenities && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500">Amenities</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Array.isArray(selectedProperty.amenities) 
                            ? selectedProperty.amenities.map((amenity, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                                  {amenity}
                                </span>
                              ))
                            : null
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Available Rooms */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-4">Available Rooms</h4>
                    <div className="space-y-3">
                      {selectedProperty.rooms?.map(room => (
                        <div 
                          key={room.id}
                          className={`p-4 border rounded-lg hover:shadow-md transition-shadow
                            ${room.isAvailable ? 'border-green-500' : 'border-red-500'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{room.name}</p>
                              <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">${room.price_per_night}</p>
                              <p className="text-sm text-gray-500">per night</p>
                            </div>
                          </div>
                          
                          {/* Room Details */}
                          <div className="space-y-2 my-3">
                            {room.beds && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a1 1 0 011-1h14a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM4 12V8a2 2 0 012-2h12a2 2 0 012 2v4M7 19v2M17 19v2" />
                                </svg>
                                {typeof room.beds === 'object' 
                                  ? Object.entries(room.beds)
                                      .map(([type, count]) => `${count} ${type}`)
                                      .join(', ')
                                  : room.beds
                                }
                              </div>
                            )}
                            {room.amenities && (
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(room.amenities) 
                                  ? room.amenities.slice(0, 3).map((amenity, index) => (
                                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        {amenity}
                                      </span>
                                    ))
                                  : null
                                }
                                {Array.isArray(room.amenities) && room.amenities.length > 3 && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">+{room.amenities.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>

                          {startDate && endDate ? (
                            <div className="flex items-center justify-between mt-4">
                              <p className={`text-sm font-medium ${room.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {room.isAvailable ? 'Available' : 'Not available for selected dates'}
                              </p>
                              <button
                                onClick={() => handleBookNowClick(selectedProperty.id, room.id)}
                                disabled={!room.isAvailable}
                                className={`px-4 py-2 rounded-lg font-medium
                                  ${room.isAvailable 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                              >
                                {room.isAvailable ? 'Book Now' : 'Unavailable'}
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-4">Select dates to check availability</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a property on the map to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trips;
