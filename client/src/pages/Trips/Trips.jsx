import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { StarIcon, CalendarDaysIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import propertyService from '../../services/propertyService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { debounce } from 'lodash';
import { format } from 'date-fns';

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
  const [nearestPlaces, setNearestPlaces] = useState([]);
const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
const [markerClusterGroup, setMarkerClusterGroup] = useState(null);
  
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
    console.log('=== TRIPS DATE DEBUG ===');
    console.log('Selected dates in Trips:', {
      startDate: startDate ? {
        raw: startDate,
        localDate: format(startDate, 'yyyy-MM-dd'),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      } : null,
      endDate: endDate ? {
        raw: endDate,
        localDate: format(endDate, 'yyyy-MM-dd'),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      } : null
    });

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

    // Format dates in local timezone to preserve the actual selected dates
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    console.log('Navigating to RoomPage with dates:', {
      startDateStr,
      endDateStr
    });

    // Navigate with dates as query parameters
    navigate(`/property/${propertyId}/room/${roomId}?startDate=${startDateStr}&endDate=${endDateStr}`);
  }, [user, navigate, startDate, endDate]);

  // Handle map bounds change
  const handleBoundsChange = useCallback((bounds) => {
    if (!bounds || !properties?.length) return;
    
    try {
      // Create a safe copy of bounds to prevent recursion
      const safeBounds = L.latLngBounds(
        L.latLng(bounds.getSouth(), bounds.getWest()),
        L.latLng(bounds.getNorth(), bounds.getEast())
      );
      
      // Extend the bounds by 50% to include nearby properties
      const extendedBounds = safeBounds.pad(0.5);
      
      // Filter visible properties
      const visible = properties.filter(property => {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return false;
        
        // Create a safe LatLng object for the property
        const propertyLatLng = L.latLng(lat, lng);
        return extendedBounds.contains(propertyLatLng);
      });
      
      // Calculate nearest places based on map center
      const center = safeBounds.getCenter();
      const nearest = visible
        .map(property => {
          // Create safe LatLng objects for distance calculation
          const propertyLatLng = L.latLng(property.latitude, property.longitude);
          const centerLatLng = L.latLng(center.lat, center.lng);
          const distanceInKm = propertyLatLng.distanceTo(centerLatLng) / 1000;
          
          return {
            ...property,
            distance: Math.round(distanceInKm * 10) / 10 // Round to 1 decimal
          };
        })
        .filter(property => {
          if (!property.rooms?.length) return false;
          const minPrice = Math.min(...property.rooms.map(r => r.price_per_night || 0));
          return minPrice >= priceRange.min && minPrice <= priceRange.max;
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      
      setVisibleProperties(visible);
      setNearestPlaces(nearest);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Map bounds:', {
          north: extendedBounds.getNorth(),
          south: extendedBounds.getSouth(),
          east: extendedBounds.getEast(),
          west: extendedBounds.getWest(),
          visibleCount: visible.length,
          nearestCount: nearest.length
        });
      }
    } catch (error) {
      console.error('Error in handleBoundsChange:', error);
    }
  }, [properties, priceRange]);

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
        
        // Check availability for each room
        const roomAvailabilities = await Promise.all(
          property.rooms.map(room =>
            propertyService.getRoomAvailability(
              property.id,
              room.id,
              formattedStartDate,
              formattedEndDate
            )
          )
        );

        // Process each room's availability
        const updatedRooms = property.rooms.map((room, index) => {
          const availability = roomAvailabilities[index];
          const roomAvailability = availability.data?.requested_room?.availability || {};
          
          // Check if all dates in the range are available
          const startDate = new Date(formattedStartDate);
          const endDate = new Date(formattedEndDate);
          let current = new Date(startDate);
          let isAvailable = true;

          while (current <= endDate) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const dateInfo = roomAvailability[dateStr];

            if (!dateInfo || dateInfo.status !== 'available' || dateInfo.booking_id) {
              isAvailable = false;
              break;
            }
            current.setDate(current.getDate() + 1);
          }

          return {
            ...room,
            isAvailable,
            availability: roomAvailability,
            price: availability.data?.requested_room?.price_per_night || room.price_per_night
          };
        });

        setSelectedProperty(prev => {
          if (prev?.id !== property.id) return prev; // Don't update if property changed
          return {
            ...prev,
            rooms: updatedRooms
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
              {/* Marker Cluster Group */}
              <div id="marker-cluster-group" />
              {visibleProperties
                .filter(property => {
                  const minPrice = Math.min(...property.rooms.map(r => r.price_per_night));
                  return minPrice >= priceRange.min && minPrice <= priceRange.max;
                })
                .map((property) => (
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
                        {property.type && (
                          <p className="text-xs text-gray-500 mt-1">{property.type}</p>
                        )}
                        {property.amenities && Array.isArray(property.amenities) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {property.amenities.slice(0, 2).map((amenity, index) => (
                              <span key={index} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>

            {/* Price Range Filter */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-4">Filter by Price</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Min Price ($)</label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Max Price ($)</label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Nearest Places Section */}
            {nearestPlaces.length > 0 && (
              <div className="mt-6 p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Nearest Places</h3>
                <div className="grid gap-4">
                  {nearestPlaces.map((property) => (
                    <div 
                      key={property.id}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedProperty(property)}
                    >
                      {property.images?.[0] && (
                        <img 
                          src={property.images[0].url} 
                          alt={property.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold">{property.name}</h4>
                        <p className="text-sm text-gray-600">{property.city}, {property.country}</p>
                        <p className="text-sm text-blue-600 font-medium">{property.distance} km away</p>
                        {property.rooms?.[0] && (
                          <p className="text-sm font-medium mt-1">From ${property.rooms[0].price_per_night}/night</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {property.star_rating > 0 && (
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400" />
                              <span className="ml-1 text-sm">{property.star_rating}</span>
                            </div>
                          )}
                          {property.type && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{property.type}</span>
                          )}
                        </div>
                        {property.amenities && Array.isArray(property.amenities) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {property.amenities.slice(0, 2).map((amenity, index) => (
                              <span key={index} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                {amenity}
                              </span>
                            ))}
                            {property.amenities.length > 2 && (
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                +{property.amenities.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      {selectedProperty.rooms?.map(room => {
                        // Get availability status and any blocked dates
                        const isAvailable = room.isAvailable;
                        const blockedDates = room.availability ? 
                          Object.entries(room.availability)
                            .filter(([_, info]) => info.status !== 'available' || info.booking_id)
                            .map(([date]) => date)
                          : [];
                        
                        return (
                          <div 
                            key={room.id}
                            className={`p-4 border rounded-lg hover:shadow-md transition-shadow
                              ${isAvailable ? 'border-green-500' : 'border-red-500'}`}
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
                              <div className="flex flex-col mt-4">
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                    {isAvailable ? 'Available' : 'Not available'}
                                  </p>
                                  <button
                                    onClick={() => handleBookNowClick(selectedProperty.id, room.id)}
                                    disabled={!isAvailable}
                                    className={`px-4 py-2 rounded-lg font-medium
                                      ${isAvailable 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                  >
                                    {isAvailable ? 'Book Now' : 'Unavailable'}
                                  </button>
                                </div>
                                {!isAvailable && blockedDates.length > 0 && (
                                  <p className="text-xs text-red-500 mt-2">
                                    Room is not available on: {blockedDates.slice(0, 3).join(', ')}
                                    {blockedDates.length > 3 && ` and ${blockedDates.length - 3} more dates`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-4">Select dates to check availability</p>
                            )}
                          </div>
                        );
                      })}
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
