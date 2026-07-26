import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  HeartIcon,
  UserIcon,
  HomeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  StarIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import api from '../../services/api';
import {
  sized,
  getPreset,
  detectCountry,
  fetchPhotos,
  propertyImage,
  DEFAULT_COUNTRY,
} from '../../services/countryImages';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/searchBar.css';
import '../../styles/homeCustom.css';
import './LandingHero.css';
import FilterContainer from '../../components/FilterContainer/FilterContainer';
import Swal from 'sweetalert2';

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
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [heroImages, setHeroImages] = useState(getPreset(DEFAULT_COUNTRY).hero);
  const [activeHero, setActiveHero] = useState(0);
  const [properties, setProperties] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const preset = useMemo(() => getPreset(country), [country]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const mapRef = useRef(null);
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0], // Will be updated when properties load
    rating: 0,
    amenities: {},
    beds: {}
  });

  // Calculate price range from current properties
  const propertyPriceRange = useMemo(() => {
    if (!properties.length) return { min: 0, max: 0 };
    const prices = properties.map(p => parseFloat(p.price)).filter(p => !isNaN(p) && p > 0);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [properties]);

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
        // Only apply price filter if the range is not at min/max
        const propertyPrice = parseFloat(property.price);
        if (isNaN(propertyPrice)) return false;
        
        const [minPrice, maxPrice] = newFilters.priceRange;
        if (minPrice > propertyPriceRange.min || maxPrice < propertyPriceRange.max) {
          if (propertyPrice < minPrice || propertyPrice > maxPrice) {
            return false;
          }
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

  // Fetch fresh hero photos for a searched location (free Pexels). Falls back
  // silently to the current curated hero images on any failure.
  const updateBackgroundImage = useCallback(async (searchLocation) => {
    if (!searchLocation || searchLocation === 'Current Location') return;
    const cleanLocation = searchLocation.split(',')[0].trim();
    const photos = await fetchPhotos(`${cleanLocation} travel landmark`, 4);
    if (photos.length > 0) {
      setHeroImages(photos);
      setActiveHero(0);
    }
  }, []);

  // Cross-fade the hero background every few seconds.
  useEffect(() => {
    if (heroImages.length < 2) return;
    const id = setInterval(() => {
      setActiveHero((i) => (i + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(id);
  }, [heroImages]);

  // When we learn the user's country, swap presets and fetch fresh hero photos.
  useEffect(() => {
    if (!userLocation) return;
    let cancelled = false;
    (async () => {
      const detected = await detectCountry(userLocation);
      if (cancelled) return;
      setCountry(detected);
      const nextPreset = getPreset(detected);
      setPopularDestinations(nextPreset.destinations);
      const fresh = await fetchPhotos(`${detected} travel landscape`, 5);
      if (!cancelled && fresh.length > 0) {
        setHeroImages(fresh);
        setActiveHero(0);
      } else if (!cancelled) {
        setHeroImages(nextPreset.hero);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  // Load popular destinations on mount from the current country preset.
  useEffect(() => {
    setPopularDestinations(getPreset(DEFAULT_COUNTRY).destinations);
  }, []);
  
  // Handle POI selection
  const handlePOIClick = (poi) => {
    setSelectedPOI(poi.name === selectedPOI ? null : poi.name);
    
    // If map is available, highlight the location
    if (mapRef.current && poi) {
      // Center map on the POI
      mapRef.current.setView([poi.lat, poi.lon], 13);
      
      // You could also add a marker or highlight effect here
      // This depends on your map implementation (Leaflet, Google Maps, etc.)
    }
  };
  
  // Handle POI deletion
  const handleDeletePOI = (poiName, e) => {
    e.stopPropagation(); // Prevent triggering the POI click
    setPopularDestinations(prev => prev.filter(poi => poi.name !== poiName));
    
    // If the deleted POI was selected, clear selection
    if (selectedPOI === poiName) {
      setSelectedPOI(null);
    }
  };
  
  // Open Google Maps with coordinates
  const openInGoogleMaps = (poi, e) => {
    e.stopPropagation(); // Prevent triggering the POI click
    const url = `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}`;
    window.open(url, '_blank');
  };

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
      // Update background image based on search location
      await updateBackgroundImage(location);

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

  // Update the property click handler to check for authentication
  const handlePropertyClick = (propertyId) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
      // User is not logged in, show login prompt
      Swal.fire({
        title: 'Login Required',
        text: 'You need to be logged in to view property details',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect to login page with return URL
          const returnUrl = `/property/${propertyId}`;
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        }
      });
    } else {
      // User is logged in, proceed to property details
      const params = new URLSearchParams();
      if (checkInDate) params.append('startDate', format(checkInDate, 'yyyy-MM-dd'));
      if (checkOutDate) params.append('endDate', format(checkOutDate, 'yyyy-MM-dd'));
      navigate(`/property/${propertyId}?${params.toString()}`);
    }
  };

  // Click a popular destination card -> run a search centered on that city.
  const handleDestinationSearch = (destination) => {
    setLocation(destination.name);
    setProperties([]);
    setFilteredProperties([]);
    setLoading(true);
    setError('');
    (async () => {
      try {
        const searchParamsLocal = {
          guests,
          type: propertyType,
          radius,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          location: destination.name,
          lat: destination.lat,
          lon: destination.lon,
        };
        const response = await api.get('/properties/search', { params: searchParamsLocal });
        if (response.data.status === 'success') {
          const withDistance = response.data.data.map((property) => ({
            ...property,
            distance: calculateDistance(destination.lat, destination.lon, property.latitude, property.longitude),
          }));
          setProperties(withDistance);
          setFilteredProperties(withDistance);
          setSearchParams(searchParamsLocal);
        } else {
          setProperties([]);
        }
      } catch (err) {
        setError(err.message || 'An error occurred while searching');
      } finally {
        setLoading(false);
      }
    })();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
    }
  };

  const heroTitleCountry = preset.label || country;

  return (
    <div className="lp-root min-h-screen bg-gray-50">
      {/* ===================== HERO ===================== */}
      <section className="lp-hero">
        {heroImages.map((img, i) => (
          <div
            key={`${img}-${i}`}
            className={`lp-hero__bg ${i === activeHero ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${sized(img, 1920, 1080)})` }}
          />
        ))}
        <div className="lp-hero__overlay" />
        <div className="lp-hero__inner">
          <span className="lp-hero__eyebrow">
            <SparklesIcon className="h-4 w-4" /> Discover {heroTitleCountry}
          </span>
          <h1 className="lp-hero__title">
            Find your <span>perfect stay</span>
            <br /> in {heroTitleCountry}
          </h1>
          <p className="lp-hero__subtitle">
            From cozy mountain cabins to city apartments and seaside villas —
            book unique places to stay at the best prices.
          </p>
          <div className="lp-hero__stats">
            <div className="lp-hero__stat">
              <b>{properties.length ? `${properties.length}` : '20+'}</b>
              <span>Places to stay</span>
            </div>
            <div className="lp-hero__stat">
              <b>4.8★</b>
              <span>Average guest rating</span>
            </div>
            <div className="lp-hero__stat">
              <b>24/7</b>
              <span>Traveler support</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SEARCH CARD ===================== */}
      <div className="lp-search">
        <form onSubmit={handleSearch} className="lp-search__card">
          <div className="lp-field">
            <label className="lp-field__label">Where</label>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Anywhere"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Property type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Guests</label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Radius</label>
            <select
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            >
              {radiusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Check-in</label>
            <DatePicker
              selected={checkInDate}
              onChange={(date) => setCheckInDate(date)}
              placeholderText="Add date"
              dateFormat="MMM d, yyyy"
              minDate={new Date()}
            />
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Check-out</label>
            <DatePicker
              selected={checkOutDate}
              onChange={(date) => setCheckOutDate(date)}
              placeholderText="Add date"
              dateFormat="MMM d, yyyy"
              minDate={checkInDate || new Date()}
            />
          </div>

          <button
            type="submit"
            className="lp-search__btn"
            disabled={loading || ((!location || location === 'Current Location') && isLoadingLocation)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      {/* ===================== QUICK CHIPS ===================== */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button className="lp-chip is-active">
            <HomeIcon className="h-4 w-4 inline mr-1 -mt-0.5" /> All stays
          </button>
          <button onClick={() => navigate('/trips')} className="lp-chip">
            My trips
          </button>
          <button
            onClick={() => { setPropertyType('villa'); }}
            className="lp-chip"
          >
            Villas
          </button>
          <button
            onClick={() => { setPropertyType('apartment'); }}
            className="lp-chip"
          >
            Apartments
          </button>
          <button
            onClick={() => { setPropertyType('hotel'); }}
            className="lp-chip"
          >
            Hotels
          </button>
          <button
            onClick={() => { setPropertyType('guesthouse'); }}
            className="lp-chip"
          >
            Guesthouses
          </button>
        </div>
      </div>

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="container mx-auto px-4 mt-10">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="hidden xl:block xl:w-1/5 xl:flex-shrink-0">
            <FilterContainer
              onFilterChange={handleFilterChange}
              properties={properties}
            />
          </div>

          {/* Right content */}
          <div className="order-2 lg:order-none xl:w-4/5 xl:flex-grow">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Mobile filter toggle */}
            <div className="xl:hidden mb-4">
              <button
                onClick={toggleFilters}
                className="w-full flex items-center justify-center bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 font-medium shadow-sm"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            <div className={`xl:hidden mb-6 ${showFilters ? 'block' : 'hidden'}`}>
              <FilterContainer onFilterChange={handleFilterChange} properties={properties} />
            </div>

            {/* Popular destinations */}
            {popularDestinations.length > 0 && (
              <div className="mb-14">
                <div className="mb-6">
                  <h2 className="lp-section-title">Popular destinations in {heroTitleCountry}</h2>
                  <p className="lp-section-sub">Handpicked places travelers love right now</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {popularDestinations.map((destination) => (
                    <div
                      key={destination.name}
                      className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
                      onClick={() => handleDestinationSearch(destination)}
                    >
                      <img
                        src={sized(destination.image, 500, 400)}
                        alt={destination.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-lg drop-shadow">{destination.name}</h3>
                        <span className="text-white/80 text-xs font-medium">Explore stays →</span>
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          onClick={(e) => openInGoogleMaps(destination, e)}
                          className="p-1.5 bg-white/85 hover:bg-white rounded-full text-gray-700 transition-colors"
                          title="Open in Google Maps"
                        >
                          <MapPinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results grid */}
            <div className="mb-14">
              {filteredProperties.length > 0 && (
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <h2 className="lp-section-title">Available stays</h2>
                    <p className="lp-section-sub">{filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.length === 0 && (
                  <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-gray-500 mb-6">
                      {loading ? 'Searching…' : properties.length > 0 ? 'No properties match your filters' : 'Search a destination to see available stays'}
                    </div>
                    {!loading && (
                      <button
                        onClick={() => {
                          if (userLocation) {
                            setLocation('Current Location');
                            handleSearch({ preventDefault: () => {} });
                          } else if (isLoadingLocation) {
                            Swal.fire({
                              title: 'Getting Your Location',
                              text: 'Please wait while we access your location...',
                              icon: 'info',
                              showConfirmButton: false,
                              allowOutsideClick: false,
                              didOpen: () => { Swal.showLoading(); },
                            });
                          } else {
                            Swal.fire({
                              title: 'Location Access Required',
                              text: 'Please allow access to your location to use this feature.',
                              icon: 'warning',
                              confirmButtonText: 'OK',
                            });
                          }
                        }}
                        className="lp-search__btn mx-auto"
                        disabled={isLoadingLocation}
                      >
                        <MapPinIcon className="h-5 w-5" />
                        {isLoadingLocation ? 'Getting location…' : 'Show stays near me'}
                      </button>
                    )}
                  </div>
                )}

                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="lp-card"
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <div className="lp-card__media">
                      <img
                        src={propertyImage(property, 800, 600)}
                        alt={property.name || 'Property'}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = propertyImage({ property_type: property.property_type }, 800, 600); }}
                      />
                      {property.property_type && (
                        <span className="lp-badge">{property.property_type}</span>
                      )}
                      <div className="lp-heart">
                        <HeartIcon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="lp-card__body">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {property.name || 'Unnamed Property'}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (property.latitude && property.longitude) {
                            window.open(`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`, '_blank');
                          }
                        }}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors mb-2"
                        title="Open in Google Maps"
                      >
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{`${property.city}, ${property.country}`}</span>
                        {property.distance != null && (
                          <span className="ml-1.5 text-gray-400 whitespace-nowrap">· {formatDistance(property.distance)}</span>
                        )}
                      </button>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {property.total_max_occupancy || property.guests || 1} guests
                        </span>
                        {property.rating > 0 && (
                          <span className="inline-flex items-center text-amber-500">
                            <StarSolid className="h-4 w-4 mr-1" />
                            {Number(property.rating).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="lp-card__footer">
                        <span>
                          {searchParams.checkIn && searchParams.checkOut ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">${Number(property.price).toFixed(0)}</span>
                              <span className="text-sm text-gray-500"> / night</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Select dates for prices</span>
                          )}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePropertyClick(property.id); }}
                          className="lp-card__btn"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Why visit */}
            <div className="mb-16">
              <div className="mb-6">
                <h2 className="lp-section-title">Why visit {heroTitleCountry}</h2>
                <p className="lp-section-sub">A few reasons to pack your bags</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {preset.highlights.map((h) => (
                  <div key={h.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                    <div className="h-52 overflow-hidden">
                      <img
                        src={sized(h.image, 800, 600)}
                        alt={h.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">{h.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{h.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust strip */}
            <div className="mb-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-gray-100">
                <ShieldCheckIcon className="h-8 w-8 text-primary-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Secure booking</h4>
                  <p className="text-sm text-gray-500">Your payment and data are always protected.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-gray-100">
                <StarIcon className="h-8 w-8 text-primary-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Verified stays</h4>
                  <p className="text-sm text-gray-500">Every property is reviewed before it goes live.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-gray-100">
                <SparklesIcon className="h-8 w-8 text-primary-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Best price promise</h4>
                  <p className="text-sm text-gray-500">Great local rates with no hidden fees.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
