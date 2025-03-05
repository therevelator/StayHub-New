import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, MapPinIcon, ArrowPathIcon, PencilIcon, XMarkIcon, ArrowTopRightOnSquareIcon, BuildingOfficeIcon, HomeIcon, StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../../services/api';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  // Add yellow for popular attractions
  const iconColor = ['blue', 'red', 'green', 'yellow'].includes(color) ? color : 'blue';
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Map controller to fit bounds
const MapController = ({ locations }) => {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
};

const Planning = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tripDays, setTripDays] = useState([]);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [editingPOI, setEditingPOI] = useState(null);
  const [newPOIName, setNewPOIName] = useState('');
  const mapRef = useRef(null);
  
  // Trip preferences
  const [hasCar, setHasCar] = useState(false);
  const [interests, setInterests] = useState({
    nature: false,
    culture: false,
    food: false,
    adventure: false,
    relaxation: false
  });
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [tripStyle, setTripStyle] = useState({
    budget: false,
    luxury: false,
    family: false,
    romantic: false,
    solo: false
  });
  const [routePOIs, setRoutePOIs] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // POI Category selections
  const [selectedCategories, setSelectedCategories] = useState({
    tourism: [],
    natural: [],
    historic: [],
    leisure: [],
    entertainment: [],
    sports: []
  });
  
  // Transportation mode selection
  const [transportMode, setTransportMode] = useState('driving'); // Default to driving
  
  // POI Category options
  const categoryOptions = {
    tourism: [
      { value: 'tourism=attraction', label: 'Tourist Attractions' },
      { value: 'tourism=museum', label: 'Museums' },
      { value: 'tourism=gallery', label: 'Art Galleries' },
      { value: 'tourism=theme_park', label: 'Theme Parks' },
      { value: 'tourism=zoo', label: 'Zoos' },
      { value: 'tourism=aquarium', label: 'Aquariums' },
      { value: 'tourism=viewpoint', label: 'Scenic Viewpoints' },
      { value: 'tourism=information', label: 'Tourist Information' },
      { value: 'tourism=hotel', label: 'Hotels & Accommodations' }
    ],
    natural: [
      { value: 'natural=peak', label: 'Mountains & Peaks' },
      { value: 'natural=waterfall', label: 'Waterfalls' },
      { value: 'natural=wood', label: 'Woods & Forests' },
      { value: 'natural=beach', label: 'Beaches' },
      { value: 'natural=cave_entrance', label: 'Caves' },
      { value: 'natural=geyser', label: 'Geysers' },
      { value: 'natural=hot_spring', label: 'Hot Springs' }
    ],
    historic: [
      { value: 'historic=castle', label: 'Castles' },
      { value: 'historic=monument', label: 'Monuments' },
      { value: 'historic=archaeological_site', label: 'Archaeological Sites' },
      { value: 'historic=memorial', label: 'Memorials' },
      { value: 'historic=ruins', label: 'Ruins' },
      { value: 'historic=fort', label: 'Fortresses' },
      { value: 'historic=church', label: 'Religious Landmarks' }
    ],
    leisure: [
      { value: 'leisure=park', label: 'Public Parks' },
      { value: 'leisure=garden', label: 'Botanical Gardens' },
      { value: 'leisure=nature_reserve', label: 'Nature Reserves' },
      { value: 'leisure=stadium', label: 'Stadiums' },
      { value: 'leisure=playground', label: 'Playgrounds' },
      { value: 'leisure=marina', label: 'Marinas' }
    ],
    entertainment: [
      { value: 'amenity=theatre', label: 'Theatres' },
      { value: 'amenity=cinema', label: 'Cinemas' },
      { value: 'amenity=casino', label: 'Casinos' },
      { value: 'amenity=nightclub', label: 'Nightclubs' },
      { value: 'amenity=bar', label: 'Bars & Pubs' }
    ],
    sports: [
      { value: 'sport=skiing', label: 'Skiing' },
      { value: 'sport=climbing', label: 'Climbing' },
      { value: 'leisure=pitch', label: 'Sports Fields' },
      { value: 'leisure=fitness_centre', label: 'Fitness Centers' },
      { value: 'leisure=golf_course', label: 'Golf Courses' },
      { value: 'leisure=sports_centre', label: 'Sports Centers' }
    ]
  };
  
  // Search for locations using OpenCage
  const searchLocation = useCallback(async (query) => {
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
          components: result.components
        }));
        setSearchResults(locations);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length > 2) {
      searchLocation(value);
    } else {
      setSearchResults([]);
    }
  };
  
  // Debug function to log current trip days
  const logTripDays = () => {
    console.log('Current trip days:', tripDays);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Add the selected location to trip days
    const newDay = {
      id: Date.now(),
      location: {
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        city: location.components.city || location.components.town || location.components.village || '',
        country: location.components.country || ''
      },
      date: format(new Date(), 'yyyy-MM-dd'),
      pointsOfInterest: []
    };
    
    setTripDays([...tripDays, newDay]);
  };

  // Handle day removal
  const handleRemoveDay = (dayId) => {
    setTripDays(tripDays.filter(day => day.id !== dayId));
  };
  
  // Handle POI click to highlight on map
  const handlePOIClick = (poi) => {
    setSelectedPOI(poi.id === selectedPOI ? null : poi.id);
    
    // Center map on the POI if selected
    if (mapRef.current && poi.id !== selectedPOI) {
      mapRef.current.setView([poi.lat, poi.lng], 15);
    }
  };
  
  // Handle POI deletion
  const handleDeletePOI = (e, poiId) => {
    e.stopPropagation(); // Prevent triggering the POI click
    setPointsOfInterest(prev => prev.filter(poi => poi.id !== poiId));
    
    // If the deleted POI was selected, clear selection
    if (selectedPOI === poiId) {
      setSelectedPOI(null);
    }
    
    // If the deleted POI was being edited, clear editing state
    if (editingPOI === poiId) {
      setEditingPOI(null);
    }
  };
  
  // Handle POI edit
  const handleEditPOI = (e, poi) => {
    e.stopPropagation(); // Prevent triggering the POI click
    setEditingPOI(poi.id);
    setNewPOIName(poi.name);
  };
  
  // Handle save POI name
  const handleSavePOI = (e, poiId) => {
    e.stopPropagation(); // Prevent triggering the POI click
    
    if (newPOIName.trim()) {
      setPointsOfInterest(prev => 
        prev.map(poi => 
          poi.id === poiId ? { ...poi, name: newPOIName.trim() } : poi
        )
      );
    }
    
    setEditingPOI(null);
    setNewPOIName('');
  };
  
  // Handle cancel edit
  const handleCancelEdit = (e) => {
    e.stopPropagation(); // Prevent triggering the POI click
    setEditingPOI(null);
    setNewPOIName('');
  };
  
  // Open Google Maps with coordinates
  const openInGoogleMaps = (poi) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`;
    window.open(url, '_blank');
  };

  // Handle interest checkbox change
  const handleInterestChange = (interest) => {
    setInterests(prev => ({
      ...prev,
      [interest]: !prev[interest]
    }));
  };

  // Handle trip style checkbox change
  const handleTripStyleChange = (style) => {
    setTripStyle(prev => ({
      ...prev,
      [style]: !prev[style]
    }));
  };

  // Handle car checkbox change
  const handleCarChange = () => {
    setHasCar(prev => !prev);
    
    // Refresh route POIs with new car setting if we have a route
    if (routeCoordinates.length > 0) {
      setTimeout(() => findRoutePointsOfInterest(), 100);
    }
  };
  
  // Handle category selection change
  const handleCategoryChange = (category, value) => {
    setSelectedCategories(prev => {
      const currentSelections = [...prev[category]];
      
      // Toggle selection
      const newState = currentSelections.includes(value)
        ? {
            ...prev,
            [category]: currentSelections.filter(item => item !== value)
          }
        : {
            ...prev,
            [category]: [...currentSelections, value]
          };
      
      // Schedule a refresh of route POIs if we have a route
      setTimeout(() => {
        if (tripDays.length >= 2 && routeCoordinates.length > 0) {
          findRoutePointsOfInterest();
        }
      }, 100);
      
      return newState;
    });
    
    // Find points of interest along the route if we have at least 2 destinations and route coordinates
    if (tripDays.length >= 2 && routeCoordinates.length > 0) {
      findRoutePointsOfInterest();
    }
  };
  
  // Handle hotel selection
  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel.id === selectedHotel?.id ? null : hotel);
  };
  
  // Calculate distance between two points using the Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find points of interest along the route
  const findRoutePointsOfInterest = async () => {
    console.log(`Finding POIs along route with ${routeCoordinates.length} coordinates`);
    if (tripDays.length < 2 || routeCoordinates.length === 0) {
      console.warn('Cannot find route POIs: not enough destinations or no route coordinates');
      return;
    }
    
    try {
      // Create a bounding box for the entire route to limit search area
      // This ensures we only search in the region of the route
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      
      // Find the bounds of all route coordinates
      routeCoordinates.forEach(point => {
        minLat = Math.min(minLat, point[0]);
        maxLat = Math.max(maxLat, point[0]);
        minLng = Math.min(minLng, point[1]);
        maxLng = Math.max(maxLng, point[1]);
      });
      
      // Add a small buffer (0.1 degrees ~ 11km at equator, less at higher latitudes)
      minLat -= 0.1;
      maxLat += 0.1;
      minLng -= 0.1;
      maxLng += 0.1;
      
      console.log(`Route bounding box: [${minLat},${minLng},${maxLat},${maxLng}]`);
      
      // Sample points along the route to search for POIs
      // Use more points for driving to catch more attractions
      const numSamplePoints = hasCar ? 
        Math.min(10, Math.max(5, Math.floor(routeCoordinates.length / 100))) : 
        Math.min(6, Math.max(3, Math.floor(routeCoordinates.length / 150)));
      
      const sampledPoints = sampleRoutePoints(routeCoordinates, numSamplePoints);
      console.log(`Sampled ${sampledPoints.length} points for POI search along route between destinations`);
      
      // Add the actual destination points to ensure we get POIs at destinations too
      // But avoid duplicates by checking distance
      for (const day of tripDays) {
        const dayPoint = [day.location.lat, day.location.lng];
        // Only add if not too close to existing sampled points
        const isTooClose = sampledPoints.some(point => 
          calculateDistance(point[0], point[1], dayPoint[0], dayPoint[1]) < 5 // 5km threshold
        );
        if (!isTooClose) {
          sampledPoints.push(dayPoint);
        }
      }
      
      // For each sampled point, search for POIs
      const poiPromises = sampledPoints.map(async point => {
        // Search radius (km) - exactly 5km as requested
        const radius = 5; // 5km radius from the route
        
        // Prioritize POIs based on selected interest if any
        let interestFilter = '';
        if (selectedInterest) {
          const interestToPOITypes = {
            nature: ['natural', 'park', 'forest', 'beach', 'mountain', 'lake', 'river', 'waterfall', 'viewpoint'],
            culture: ['museum', 'historic', 'monument', 'castle', 'ruins', 'archaeological_site', 'theatre', 'memorial', 'artwork'],
            food: ['restaurant', 'cafe', 'bar', 'pub', 'food', 'brewery', 'winery', 'distillery'],
            adventure: ['theme_park', 'zoo', 'aquarium', 'adventure', 'sports', 'hiking', 'climbing', 'water_park', 'amusement'],
            relaxation: ['spa', 'beach', 'park', 'garden', 'viewpoint', 'hot_spring', 'resort']
          };
          
          const relevantTypes = interestToPOITypes[selectedInterest] || [];
          if (relevantTypes.length > 0) {
            interestFilter = relevantTypes.map(type => 
              `node["${type}"](around:${radius * 1000},${point[0]},${point[1]});`
            ).join('\n');
          }
        }
        
        // Build query based on selected categories or use defaults if none selected
        let categoryFilters = '';
        
        // Check if any categories are selected
        const hasSelectedCategories = Object.values(selectedCategories).some(arr => arr.length > 0);
        
        if (hasSelectedCategories) {
          // Combine all selected category filters
          const allFilters = [];
          
          Object.keys(selectedCategories).forEach(category => {
            selectedCategories[category].forEach(filter => {
              // Parse the filter value to get the key and value
              const [key, value] = filter.split('=');
              allFilters.push(`node["${key}"="${value}"](around:${radius * 1000},${point[0]},${point[1]});`);
            });
          });
          
          categoryFilters = allFilters.join('\n');
        } else {
          // Use default filters if no categories are selected
          categoryFilters = `
            node["tourism"="attraction"](around:${radius * 1000},${point[0]},${point[1]});
            node["tourism"="museum"](around:${radius * 1000},${point[0]},${point[1]});
            node["tourism"="viewpoint"](around:${radius * 1000},${point[0]},${point[1]});
            node["historic"](around:${radius * 1000},${point[0]},${point[1]});
            node["natural"](around:${radius * 1000},${point[0]},${point[1]});
            node["leisure"="park"](around:${radius * 1000},${point[0]},${point[1]});
          `;
        }
        
        // Get POIs using Overpass API with selected categories
        // Restrict search to the route's bounding box to avoid getting POIs from unrelated regions
        const query = `
          [out:json][bbox:${minLat},${minLng},${maxLat},${maxLng}];
          (
            ${categoryFilters}
            ${interestFilter}
          );
          out body;
        `;
        
        const response = await axios.post('https://overpass-api.de/api/interpreter', query);
        
        if (response.data && response.data.elements) {
          // Process and filter POIs - only include POIs with names
          const pois = response.data.elements
            .filter(element => element.tags && element.tags.name)
            .map(element => {
              // Determine if this POI matches the selected interest
              let isPrioritized = false;
              if (selectedInterest) {
                const interestToPOITypes = {
                  nature: ['natural', 'park', 'forest', 'beach', 'mountain', 'lake', 'river', 'waterfall', 'viewpoint'],
                  culture: ['museum', 'historic', 'monument', 'castle', 'ruins', 'archaeological_site', 'theatre', 'memorial', 'artwork'],
                  food: ['restaurant', 'cafe', 'bar', 'pub', 'food', 'brewery', 'winery', 'distillery'],
                  adventure: ['theme_park', 'zoo', 'aquarium', 'adventure', 'sports', 'hiking', 'climbing', 'water_park', 'amusement'],
                  relaxation: ['spa', 'beach', 'park', 'garden', 'viewpoint', 'hot_spring', 'resort']
                };
                
                const relevantTypes = interestToPOITypes[selectedInterest] || [];
                const poiType = element.tags.tourism || element.tags.historic || element.tags.amenity || element.tags.natural || '';
                const poiName = element.tags.name || '';
                
                isPrioritized = relevantTypes.some(type => 
                  poiType.toLowerCase().includes(type) || 
                  poiName.toLowerCase().includes(type)
                );
              }
              
              // Determine if this is a popular attraction
              const isPopular = element.tags.tourism === 'attraction' || 
                               element.tags.historic === 'monument' || 
                               element.tags.historic === 'castle' ||
                               element.tags.wikidata ||
                               element.tags.wikipedia;
              
              return {
                id: `route-poi-${element.id}`,
                name: element.tags.name,
                lat: element.lat,
                lng: element.lon,
                type: element.tags.tourism || element.tags.historic || element.tags.natural || element.tags.amenity || 'attraction',
                description: element.tags.description || '',
                isPrioritized,
                isPopular
              };
            })
            .slice(0, 8); // Increased limit to 8 POIs per point
          
          // Sort to prioritize popular attractions and those matching the selected interest
          pois.sort((a, b) => {
            // First prioritize popular attractions
            if (a.isPopular && !b.isPopular) return -1;
            if (!a.isPopular && b.isPopular) return 1;
            
            // Then prioritize by selected interest
            if (a.isPrioritized && !b.isPrioritized) return -1;
            if (!a.isPrioritized && b.isPrioritized) return 1;
            
            return 0;
          });
          
          return pois;
        }
        
        return [];
      });
      
      // Wait for all POI searches to complete
      const allRoutePOIs = (await Promise.all(poiPromises)).flat();
      console.log(`Found ${allRoutePOIs.length} POIs along the route before deduplication`);
      
      // Remove duplicates based on ID
      const uniquePOIs = [];
      const seenIds = new Set();
      
      for (const poi of allRoutePOIs) {
        if (!seenIds.has(poi.id)) {
          seenIds.add(poi.id);
          uniquePOIs.push(poi);
        }
      }
      
      // Sort by popularity, prioritized status, and distance to route
      uniquePOIs.sort((a, b) => {
        // First prioritize popular attractions
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        // Then prioritize those matching the selected interest
        if (a.isPrioritized && !b.isPrioritized) return -1;
        if (!a.isPrioritized && b.isPrioritized) return 1;
        return 0;
      });
      
      // Calculate the minimum distance from each POI to the route
      // This helps us verify that POIs are actually near the route
      const poisWithDistance = uniquePOIs.map(poi => {
        // Find minimum distance to any point on the route
        let minDistance = Infinity;
        for (const routePoint of routeCoordinates) {
          const distance = calculateDistance(poi.lat, poi.lng, routePoint[0], routePoint[1]);
          minDistance = Math.min(minDistance, distance);
        }
        return { ...poi, distanceToRoute: minDistance };
      });
      
      // Filter POIs that are actually within 5km of the route
      const nearRoutePOIs = poisWithDistance.filter(poi => poi.distanceToRoute <= 5);
      
      // Sort by distance to route (closest first)
      nearRoutePOIs.sort((a, b) => a.distanceToRoute - b.distanceToRoute);
      
      // Show more POIs when driving
      const poiLimit = hasCar ? 25 : 15;
      console.log(`Found ${nearRoutePOIs.length} POIs within 5km of the route (showing up to ${poiLimit})`);
      setRoutePOIs(nearRoutePOIs.slice(0, poiLimit));
    } catch (error) {
      console.error('Error finding route POIs:', error);
    }
  };
  
  // Helper function to sample points along the route
  const sampleRoutePoints = (route, count) => {
    if (!route || route.length === 0) {
      console.warn('Cannot sample empty route');
      return [];
    }
    
    console.log(`Sampling ${count} points from route with ${route.length} coordinates`);
    
    // If route is very short, just return a subset or all points
    if (route.length <= count) {
      return [...route];
    }
    
    if (route.length <= 3) {
      const midIndex = Math.floor(route.length / 2);
      return [route[midIndex]];
    }
    
    const points = [];
    
    // Always include a point near the start (but not the exact start to avoid duplicating destination POIs)
    if (route.length > 10) {
      const startIndex = Math.max(1, Math.floor(route.length * 0.1));
      points.push(route[startIndex]);
    }
    
    // For routes with multiple segments (like between 3+ destinations), sample from each segment
    // Divide the route into (count-2) segments and take a point from each
    const segmentSize = route.length / (count);
    
    // Add evenly distributed points along the route
    for (let i = 1; i < count - 1; i++) {
      const index = Math.floor(i * segmentSize);
      if (index > 0 && index < route.length - 1 && !points.some(p => p[0] === route[index][0] && p[1] === route[index][1])) {
        points.push(route[index]);
      }
    }
    
    // Always include a point near the end (but not the exact end)
    if (route.length > 10) {
      const endIndex = Math.min(route.length - 2, Math.floor(route.length * 0.9));
      if (!points.some(p => p[0] === route[endIndex][0] && p[1] === route[endIndex][1])) {
        points.push(route[endIndex]);
      }
    }
    
    console.log(`Sampled ${points.length} points along route between destinations`);
    return points;
  };

  // Find hotels from our platform for each day
  const findHotelsForTrip = async () => {
    try {
      // For each trip day, find hotels nearby
      const hotelsPromises = tripDays.map(async (day, index) => {
        // Search for hotels near this location
        const response = await api.get('/properties/search', {
          params: {
            lat: day.location.lat,
            lon: day.location.lng,
            radius: 25, // 25km radius
            type: 'hotel', // Only get hotels
            guests: 2 // Default to 2 guests
          }
        });
        
        if (response.data.status === 'success') {
          // Process hotels
          const hotels = response.data.data.map(hotel => ({
            ...hotel,
            dayIndex: index,
            distance: calculateDistance(
              day.location.lat,
              day.location.lng,
              hotel.latitude,
              hotel.longitude
            )
          }));
          
          return hotels;
        }
        
        return [];
      });
      
      // Wait for all hotel searches to complete
      const allHotels = await Promise.all(hotelsPromises);
      
      // Flatten the array and sort by distance within each day
      const flattenedHotels = allHotels.flat().sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) {
          return a.dayIndex - b.dayIndex;
        }
        return a.distance - b.distance;
      });
      
      setHotels(flattenedHotels);
    } catch (error) {
      console.error('Error finding hotels:', error);
    }
  };

  // Generate trip plan
  const generatePlan = async () => {
    // Check if we have at least 2 destinations
    if (tripDays.length < 2) {
      Swal.fire({
        title: 'Not enough destinations',
        text: 'Please add at least two destinations to generate a plan',
        icon: 'warning'
      });
      return;
    }
    
    // Log all destinations for debugging
    console.log('Generating plan with destinations:', tripDays.map((day, index) => `Day ${index + 1}: ${day.location.name}`));
    
    setIsGeneratingPlan(true);
    setRoutePOIs([]); // Clear existing route POIs
    
    try {
      // 1. Generate route between all locations in order
      const waypoints = tripDays.map(day => `${day.location.lat},${day.location.lng}`).join(';');
      console.log(`Calculating ${transportMode} route between ${tripDays.length} waypoints:`, waypoints);
      console.log(`Destinations: ${tripDays.map(day => day.location.name).join(' → ')}`);
      
      // For OSRM API, we need to ensure we have valid coordinates
      if (!waypoints.match(/^(-?\d+\.\d+,-?\d+\.\d+;)+(-?\d+\.\d+,-?\d+\.\d+)$/)) {
        console.error('Invalid waypoints format:', waypoints);
        Swal.fire({
          title: 'Invalid Coordinates',
          text: 'Some destinations have invalid coordinates. Please try different locations.',
          icon: 'error'
        });
        setIsGeneratingPlan(false);
        return;
      }
      
      try {
        const routeResponse = await axios.get(
          `https://router.project-osrm.org/route/v1/${transportMode}/${waypoints}?overview=full&geometries=geojson`
        );
        
        console.log('Route response received');
        
        if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
          // Extract route coordinates
          const route = routeResponse.data.routes[0].geometry.coordinates;
          console.log(`Route has ${route.length} coordinates`);
          
          // Get route distance and duration
          const distance = (routeResponse.data.routes[0].distance / 1000).toFixed(1); // km
          const duration = Math.round(routeResponse.data.routes[0].duration / 60); // minutes
          console.log(`Route distance: ${distance}km, duration: ${duration} minutes`);
          
          // Convert from [lng, lat] to [lat, lng] for Leaflet
          const leafletCoordinates = route.map(point => [point[1], point[0]]);
          setRouteCoordinates(leafletCoordinates);
          
          // Center map on the route
          if (mapRef.current && leafletCoordinates.length > 0) {
            const bounds = L.latLngBounds(leafletCoordinates);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
          
          // Show success message with route info
          Swal.fire({
            title: 'Route Calculated',
            html: `<p>Route between ${tripDays.length} destinations calculated successfully!</p>
                  <p>Distance: <b>${distance} km</b></p>
                  <p>Estimated travel time: <b>${duration} minutes</b></p>
                  <p>Now finding points of interest along your route...</p>`,
            icon: 'success',
            timer: 5000,
            timerProgressBar: true
          });
          
          // Find POIs along the route
          setTimeout(() => findRoutePointsOfInterest(), 500);
        } else {
          console.error('No routes found in the response');
          Swal.fire({
            title: 'Route Calculation Failed',
            text: 'Could not calculate a route between the destinations. Please try different locations or transport mode.',
            icon: 'error'
          });
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
      
      // 2. Find points of interest for each destination location
      const allPOIs = [];
      
      // Process each destination to find POIs
      for (const day of tripDays) {
        try {
          // Prioritize POIs based on selected interest if any
          let interestFilter = '';
          if (selectedInterest) {
            const interestToPOITypes = {
              nature: ['natural', 'park', 'forest', 'beach', 'mountain', 'lake', 'river'],
              culture: ['museum', 'historic', 'monument', 'castle', 'ruins', 'archaeological_site', 'theatre'],
              food: ['restaurant', 'cafe', 'bar', 'pub', 'food'],
              adventure: ['theme_park', 'zoo', 'aquarium', 'adventure', 'sports', 'hiking', 'climbing'],
              relaxation: ['spa', 'beach', 'park', 'garden', 'viewpoint']
            };
            
            const relevantTypes = interestToPOITypes[selectedInterest] || [];
            if (relevantTypes.length > 0) {
              interestFilter = relevantTypes.map(type => 
                `node["${type}"](around:5000,${day.location.lat},${day.location.lng});`
              ).join('\n');
            }
          }
          
          // Use Overpass API to find points of interest
          // Build query based on selected categories or use defaults if none selected
          let categoryFilters = '';
          
          // Check if any categories are selected
          const hasSelectedCategories = Object.values(selectedCategories).some(arr => arr.length > 0);
          
          if (hasSelectedCategories) {
            // Combine all selected category filters
            const allFilters = [];
            
            Object.keys(selectedCategories).forEach(category => {
              selectedCategories[category].forEach(filter => {
                // Parse the filter value to get the key and value
                const [key, value] = filter.split('=');
                allFilters.push(`node["${key}"="${value}"](around:5000,${day.location.lat},${day.location.lng});`);
              });
            });
            
            categoryFilters = allFilters.join('\n');
          } else {
            // Use default filters if no categories are selected
            categoryFilters = `
              node["tourism"="attraction"](around:5000,${day.location.lat},${day.location.lng});
              node["tourism"="museum"](around:5000,${day.location.lat},${day.location.lng});
              node["historic"](around:5000,${day.location.lat},${day.location.lng});
              node["leisure"="park"](around:5000,${day.location.lat},${day.location.lng});
            `;
          }
          
          const query = `
            [out:json];
            (
              ${categoryFilters}
              ${interestFilter}
            );
            out body;
          `;
          
          const overpassResponse = await axios.post(
            'https://overpass-api.de/api/interpreter',
            query,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          
          if (overpassResponse.data && overpassResponse.data.elements) {
            const pois = overpassResponse.data.elements
              .filter(element => element.tags && element.tags.name)
              .map(element => {
                // Determine if this POI matches the selected interest
                let isPrioritized = false;
                if (selectedInterest) {
                  const interestToPOITypes = {
                    nature: ['natural', 'park', 'forest', 'beach', 'mountain', 'lake', 'river'],
                    culture: ['museum', 'historic', 'monument', 'castle', 'ruins', 'archaeological_site', 'theatre'],
                    food: ['restaurant', 'cafe', 'bar', 'pub', 'food'],
                    adventure: ['theme_park', 'zoo', 'aquarium', 'adventure', 'sports', 'hiking', 'climbing'],
                    relaxation: ['spa', 'beach', 'park', 'garden', 'viewpoint']
                  };
                  
                  const relevantTypes = interestToPOITypes[selectedInterest] || [];
                  const poiType = element.tags.tourism || element.tags.historic || element.tags.amenity || '';
                  const poiName = element.tags.name || '';
                  
                  isPrioritized = relevantTypes.some(type => 
                    poiType.toLowerCase().includes(type) || 
                    poiName.toLowerCase().includes(type)
                  );
                }
                
                return {
                  id: element.id,
                  name: element.tags.name,
                  type: element.tags.tourism || element.tags.historic || element.tags.amenity || 'attraction',
                  lat: element.lat,
                  lng: element.lon,
                  dayId: day.id,
                  isPrioritized
                };
              })
              .slice(0, 10); // Limit to 10 POIs per location
            
            // Sort to prioritize POIs that match the selected interest
            pois.sort((a, b) => {
              if (a.isPrioritized && !b.isPrioritized) return -1;
              if (!a.isPrioritized && b.isPrioritized) return 1;
              return 0;
            });
            
            allPOIs.push(...pois);
          }
        } catch (error) {
          console.error(`Error finding POIs for ${day.location.name}:`, error);
        }
      }
      
      setPointsOfInterest(allPOIs);
      
      // 3. Find hotels for each day
      await findHotelsForTrip();
      
      // 4. Find points of interest along the route regardless of transport mode
      if (routeCoordinates.length > 0) {
        console.log('Finding POIs along the calculated route');
        await findRoutePointsOfInterest();
      } else {
        console.warn('No route coordinates available for POI search');
      }
      
      Swal.fire({
        title: 'Trip Plan Generated!',
        text: `Found ${allPOIs.length} points of interest across your trip destinations.`,
        icon: 'success'
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate trip plan. Please try again.',
        icon: 'error'
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Trip Planning</h1>
          <p className="text-gray-600 mb-6">
            Add destinations for each day of your trip, then get recommendations for points of interest and optimal routes.
          </p>
          
          {/* Search and Add Location */}
          <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for a location (e.g., Paris, Bucharest)"
                    className="w-full outline-none text-gray-700"
                  />
                </div>
                <button
                  onClick={() => searchLocation(searchQuery)}
                  disabled={isSearching || searchQuery.length < 3}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={logTripDays}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Debug Trip
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
            
            {/* Trip preferences checkboxes */}
            <div className="mt-4 border-t pt-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Trip Interests</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(interests).map(([interest, isChecked]) => (
                    <button
                      key={interest}
                      onClick={() => setSelectedInterest(interest === selectedInterest ? null : interest)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        interest === selectedInterest 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="capitalize">{interest}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Trip Style</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(tripStyle).map(([style, isChecked]) => (
                    <label key={style} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTripStyleChange(style)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{style}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCar}
                    onChange={handleCarChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">I have a car</span>
                </label>
                {tripDays.length < 2 && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">Add at least two destinations to see tourist attractions along the route</p>
                )}
                {tripDays.length >= 2 && (
                  <p className="text-xs text-blue-600 mt-1 ml-6">Showing tourist attractions between destinations</p>
                )}
              </div>
              
              {/* Generate Plan Button */}
              {tripDays.length >= 2 && (
                <div className="mt-4">
                  <button
                    onClick={generatePlan}
                    disabled={isGeneratingPlan}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Generating Trip Plan...
                      </>
                    ) : (
                      <>
                        Calculate {transportMode.charAt(0).toUpperCase() + transportMode.slice(1)} Route with {tripDays.length} Destinations
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    This will calculate the route between all your destinations in order and find named points of interest along the way
                  </p>
                </div>
              )}
              
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Transportation Mode</h3>
                <div className="flex flex-wrap gap-3">
                  {['driving', 'walking', 'cycling'].map((mode) => (
                    <label key={mode} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="transportMode"
                        checked={transportMode === mode}
                        onChange={() => setTransportMode(mode)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Category Selection Dropdowns */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Point of Interest Categories</h3>
                <p className="text-xs text-gray-500 mb-4">Select categories to customize your trip recommendations</p>
                
                {/* Tourism & Attractions */}
                <div className="mb-4">
                  <details className="bg-white rounded-lg shadow-sm border">
                    <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                      <span>Tourism & Attractions</span>
                      <span className="text-xs text-blue-600">{selectedCategories.tourism.length} selected</span>
                    </summary>
                    <div className="px-4 py-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.tourism.map(option => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.tourism.includes(option.value)}
                              onChange={() => handleCategoryChange('tourism', option.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
                
                {/* Natural Attractions */}
                <div className="mb-4">
                  <details className="bg-white rounded-lg shadow-sm border">
                    <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                      <span>Natural Attractions</span>
                      <span className="text-xs text-blue-600">{selectedCategories.natural.length} selected</span>
                    </summary>
                    <div className="px-4 py-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.natural.map(option => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.natural.includes(option.value)}
                              onChange={() => handleCategoryChange('natural', option.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
                
                {/* Cultural & Historical Sites */}
                <div className="mb-4">
                  <details className="bg-white rounded-lg shadow-sm border">
                    <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                      <span>Cultural & Historical Sites</span>
                      <span className="text-xs text-blue-600">{selectedCategories.historic.length} selected</span>
                    </summary>
                    <div className="px-4 py-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.historic.map(option => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.historic.includes(option.value)}
                              onChange={() => handleCategoryChange('historic', option.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
                
                {/* Recreational & Leisure */}
                <div className="mb-4">
                  <details className="bg-white rounded-lg shadow-sm border">
                    <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                      <span>Recreational & Leisure</span>
                      <span className="text-xs text-blue-600">{selectedCategories.leisure.length} selected</span>
                    </summary>
                    <div className="px-4 py-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.leisure.map(option => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.leisure.includes(option.value)}
                              onChange={() => handleCategoryChange('leisure', option.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
                
                {/* Entertainment & Nightlife */}
                <div className="mb-4">
                  <details className="bg-white rounded-lg shadow-sm border">
                    <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                      <span>Entertainment & Nightlife</span>
                      <span className="text-xs text-blue-600">{selectedCategories.entertainment.length} selected</span>
                    </summary>
                    <div className="px-4 py-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.entertainment.map(option => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.entertainment.includes(option.value)}
                              onChange={() => handleCategoryChange('entertainment', option.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
                
                {/* Sports & Outdoor Activities */}
                <div className="mb-4">
                  <details className="bg-white rounded-lg shadow-sm border">
                    <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                      <span>Sports & Outdoor Activities</span>
                      <span className="text-xs text-blue-600">{selectedCategories.sports.length} selected</span>
                    </summary>
                    <div className="px-4 py-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryOptions.sports.map(option => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.sports.includes(option.value)}
                              onChange={() => handleCategoryChange('sports', option.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Days List */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                Your Trip Days
              </h2>
              
              {tripDays.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No destinations added yet.</p>
                  <p className="text-sm mt-2">Search and add locations to plan your trip.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tripDays.map((day, index) => (
                    <div key={day.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                              Day {index + 1}
                            </span>
                            <h3 className="font-medium">{day.location.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {day.location.city && day.location.country 
                              ? `${day.location.city}, ${day.location.country}`
                              : day.location.country || 'Location details not available'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveDay(day.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove this day"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={generatePlan}
                    disabled={tripDays.length < 2 || isGeneratingPlan}
                    className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Generating Plan...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Generate Trip Plan
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Route Points of Interest */}
            {routePOIs.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Tourist Attractions Along Your Route
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Points of interest within 5km of your route ({routePOIs.length} found)
                </p>
                
                <div className="space-y-3">
                  {routePOIs.map(poi => (
                    <div 
                      key={poi.id} 
                      className={`text-sm border-l-2 ${
                        selectedPOI === poi.id ? 'border-green-500 bg-green-50' : 
                        poi.distanceToRoute <= 1 ? 'border-purple-500' : 
                        poi.isPopular ? 'border-yellow-500' : 'border-blue-500'
                      } pl-3 py-2 pr-2 rounded-r flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors`}
                      onClick={() => handlePOIClick(poi)}
                    >
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{poi.name}</p>
                          {poi.isPopular && (
                            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                          {poi.distanceToRoute && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              {poi.distanceToRoute.toFixed(1)}km
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 capitalize">{poi.type}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGoogleMaps(poi);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Open in Google Maps"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Points of Interest */}
            {pointsOfInterest.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Points of Interest</h2>
                
                <div className="space-y-6">
                  {tripDays.map((day, index) => {
                    const dayPOIs = pointsOfInterest.filter(poi => poi.dayId === day.id);
                    
                    if (dayPOIs.length === 0) return null;
                    
                    return (
                      <div key={day.id} className="space-y-3">
                        <h3 className="font-medium flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                            Day {index + 1}
                          </span>
                          {day.location.city || day.location.name}
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {dayPOIs.map(poi => (
                            <div 
                              key={poi.id} 
                              className={`text-sm border-l-2 ${selectedPOI === poi.id ? 'border-green-500 bg-green-50' : 'border-blue-500'} pl-3 py-2 pr-2 rounded-r flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors`}
                              onClick={() => handlePOIClick(poi)}
                            >
                              <div>
                                {editingPOI === poi.id ? (
                                  <input
                                    type="text"
                                    value={newPOIName}
                                    onChange={(e) => setNewPOIName(e.target.value)}
                                    className="w-full p-1 border rounded"
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <p className="font-medium">{poi.name}</p>
                                    <p className="text-xs text-gray-600 capitalize">{poi.type}</p>
                                  </>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                {editingPOI === poi.id ? (
                                  <>
                                    <button 
                                      onClick={(e) => handleSavePOI(e, poi.id)}
                                      className="p-1 text-green-600 hover:text-green-800"
                                      title="Save changes"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => handleCancelEdit(e)}
                                      className="p-1 text-gray-600 hover:text-gray-800"
                                      title="Cancel"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={(e) => handleEditPOI(e, poi)}
                                      className="p-1 text-blue-600 hover:text-blue-800"
                                      title="Edit point of interest"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => handleDeletePOI(e, poi.id)}
                                      className="p-1 text-red-600 hover:text-red-800"
                                      title="Delete point of interest"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Hotels Section */}
            {hotels.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Recommended Hotels
                </h2>
                
                <div className="space-y-6">
                  {tripDays.map((day, index) => {
                    const dayHotels = hotels.filter(hotel => hotel.dayIndex === index);
                    
                    if (dayHotels.length === 0) return null;
                    
                    return (
                      <div key={`hotels-day-${index}`} className="space-y-3">
                        <h3 className="font-medium flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                            Day {index + 1}
                          </span>
                          {day.location.city || day.location.name}
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {dayHotels.slice(0, 3).map(hotel => (
                            <div 
                              key={hotel.id} 
                              className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                selectedHotel?.id === hotel.id ? 'border-blue-500 bg-blue-50' : ''
                              }`}
                              onClick={() => handleHotelSelect(hotel)}
                            >
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">{hotel.name}</h4>
                                  <p className="text-sm text-gray-600">{hotel.city}, {hotel.country}</p>
                                  <p className="text-xs text-gray-500 mt-1">{hotel.distance.toFixed(1)} km from destination</p>
                                </div>
                                <div className="text-right">
                                  {hotel.rooms && hotel.rooms.length > 0 && (
                                    <p className="text-sm font-semibold text-blue-600">
                                      From ${Math.min(...hotel.rooms.map(r => r.price_per_night || 999))}/night
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Map Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
            <MapContainer
              center={[45.9432, 24.9668]} // Default to Romania center
              zoom={6}
              style={{ height: "600px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Show trip days markers */}
              {tripDays.map((day, index) => (
                <Marker 
                  key={day.id} 
                  position={[day.location.lat, day.location.lng]}
                  icon={createCustomIcon('blue')}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Day {index + 1}
                      </span>
                      <h3 className="font-semibold mt-1">{day.location.name}</h3>
                      {day.location.city && day.location.country && (
                        <p className="text-sm text-gray-600">{day.location.city}, {day.location.country}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
                            {/* Show route points of interest */}
              {routePOIs.map(poi => (
                <Marker 
                  key={poi.id} 
                  position={[poi.lat, poi.lng]}
                  icon={createCustomIcon(poi.isPopular ? 'yellow' : 'blue')}
                  eventHandlers={{
                    click: () => {
                      setSelectedPOI(poi.id);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{poi.name}</h3>
                        {poi.isPopular && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 capitalize">{poi.type}</p>
                      {poi.description && <p className="text-xs mt-1">{poi.description}</p>}
                      <div className="mt-2 flex justify-end">
                        <button 
                          onClick={() => openInGoogleMaps(poi)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          title="Open in Google Maps"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                          Google Maps
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Show points of interest */}
              {pointsOfInterest.map(poi => (
                <Marker 
                  key={poi.id} 
                  position={[poi.lat, poi.lng]}
                  icon={createCustomIcon(selectedPOI === poi.id ? 'green' : 'red')}
                  eventHandlers={{
                    click: () => {
                      setSelectedPOI(poi.id);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold">{poi.name}</h3>
                      <p className="text-xs text-gray-600 capitalize">{poi.type}</p>
                      {poi.distanceToRoute && (
                        <p className="text-xs mt-1">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {poi.distanceToRoute.toFixed(1)}km from route
                          </span>
                        </p>
                      )}
                      <div className="mt-2 flex justify-end">
                        <button 
                          onClick={() => openInGoogleMaps(poi)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          title="Open in Google Maps"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                          Google Maps
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Show route line with different styles based on transport mode */}
              {routeCoordinates.length > 0 && (
                <>
                  {/* Main route line */}
                  <Polyline 
                    positions={routeCoordinates}
                    color={transportMode === "driving" ? "blue" : (transportMode === "cycling" ? "green" : "purple")}
                    weight={4}
                    opacity={0.8}
                    dashArray={transportMode === "walking" ? "5, 10" : null}
                  />
                  
                  {/* 5km buffer visualization around the route (commented out as it might be visually cluttered) */}
                  {/* routeCoordinates.length > 0 && (
                    routeCoordinates.filter((_, i) => i % 20 === 0).map((point, i) => (
                      <Circle 
                        key={`buffer-${i}`}
                        center={point}
                        radius={5000}
                        pathOptions={{ color: 'rgba(0, 0, 255, 0.1)', weight: 1, fillOpacity: 0.05 }}
                      />
                    ))
                  ) */}
                </>
              )}
              
              {/* Fit map to markers */}
              {tripDays.length > 0 && (
                <MapController 
                  locations={tripDays.map(day => ({ lat: day.location.lat, lng: day.location.lng }))} 
                />
              )}
              
              {/* Store map reference */}
              <div ref={(el) => { mapRef.current = el?._map || null; }} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planning;
