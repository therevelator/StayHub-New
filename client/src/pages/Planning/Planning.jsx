import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  ArrowPathIcon,
  PencilIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  CheckIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../../services/api';
import propertyService from '../../services/propertyService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '../../components/ui/button';
// Import html2canvas for capturing the map
import html2canvas from 'html2canvas';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  const iconColor = ['blue', 'red', 'green', 'yellow'].includes(color)
    ? color
    : 'blue';

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Map controller to fit bounds
const MapController = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations && locations.length > 0) {
      // Filter out any locations with missing lat/lng
      const validLocations = locations.filter(loc => loc && loc.lat !== undefined && loc.lng !== undefined);
      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(validLocations.map((loc) => [loc.lat, loc.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [locations, map]);

  return null;
};

// Component to handle map click events
const MapEvents = ({ onClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.on('click', onClick);

    return () => {
      map.off('click', onClick);
    };
  }, [map, onClick]);

  return null;
};

const Planning = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tripDays, setTripDays] = useState([]);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [poisByLocality, setPoisByLocality] = useState({});
  const [sampledSearchPoints, setSampledSearchPoints] = useState([]);
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
    relaxation: false,
  });
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [tripStyle, setTripStyle] = useState({
    budget: false,
    luxury: false,
    family: false,
    romantic: false,
    solo: false,
  });
  const [routePOIs, setRoutePOIs] = useState([]);
  const [poiRoutes, setPoiRoutes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [isUsingAiForPoi, setIsUsingAiForPoi] = useState(true); // AI enabled by default
  const [accommodationStops, setAccommodationStops] = useState([]); // Recommended overnight stops
  const [bookingAppProperties, setBookingAppProperties] = useState([]); // Properties from our booking app
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [isProcessingAiPoi, setIsProcessingAiPoi] = useState(false);
  // Use the API key from localStorage or environment variable, but don't hardcode it
  // Use the API key from localStorage or environment variable, but don't hardcode it
  const [groqApiKey, setGroqApiKey] = useState(localStorage.getItem('groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || '');
  // Enforce Groq per user request
  const aiProvider = 'groq';

  // POI Category selections
  const [selectedCategories, setSelectedCategories] = useState({
    tourism: [],
    natural: [],
    historic: [],
    leisure: [],
    entertainment: [],
    sports: [],
  });

  // Transportation mode selection
  const [transportMode, setTransportMode] = useState('driving'); // Default to driving

  // POI distance from route selection
  const [poiDistance, setPoiDistance] = useState(10); // Default to 10km

  // AI Route Recommendation State
  const [tripDuration, setTripDuration] = useState(3);
  const [returnToStart, setReturnToStart] = useState(false);
  const [recommendedRoutes, setRecommendedRoutes] = useState([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [numRoutesToRecommend, setNumRoutesToRecommend] = useState(5); // Customizable, max 10

  // New state for additional features
  const [avoidOptions, setAvoidOptions] = useState({
    tolls: false,
    highways: false,
    unpaved: false,
  });
  const [stopTimes, setStopTimes] = useState({});
  const [scenicRoute, setScenicRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState({
    distance: 0,
    duration: 0,
    steps: [],
  });
  const [poiCategories, setPoiCategories] = useState({
    attractions: true,
    restaurants: true,
    gasStations: false,
    accommodations: false,
  });

  // Overpass API endpoints with fallback (ordered by reliability)
  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ];

  // Track when we last made a request to avoid rate limiting
  const lastRequestTime = React.useRef(0);

  // Make request with fallback to different endpoints
  const makeOverpassRequest = async (query) => {
    // Enforce minimum delay between requests (1 second)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    lastRequestTime.current = Date.now();

    let lastError;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await axios.post(endpoint, query, {
          timeout: 15000, // 15 second timeout
        });
        return response.data;
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error.message);
        lastError = error;

        // If it's a 429 (rate limit), don't try other endpoints - they share limits
        if (error.response?.status === 429) {
          console.warn('Rate limited by Overpass API - stopping retries');
          throw new Error('OVERPASS_RATE_LIMITED');
        }

        // Small delay before trying next endpoint
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }

    throw lastError; // If all endpoints fail, throw the last error
  };

  // Calculate popularity score based on OSM tags
  const calculatePopularity = (tags) => {
    let score = 0;

    // Check for various popularity indicators
    if (tags.stars) score += parseInt(tags.stars) || 0;
    if (tags.rating) score += parseFloat(tags.rating) * 2 || 0;
    if (tags.reviews) score += Math.min(parseInt(tags.reviews) / 10, 5) || 0;
    if (tags.wikipedia) score += 5; // Has Wikipedia article
    if (tags.wikidata) score += 3; // Has Wikidata entry
    if (tags.website) score += 2; // Has official website
    if (tags.description) score += 1; // Has description
    if (tags.image || tags.image_url) score += 2; // Has images

    // Check importance tags
    if (tags.tourism === 'attraction') score += 3;
    if (tags.historic === 'monument') score += 2;
    if (tags.heritage) score += 2;

    // Additional bonuses for specific types
    const popularTypes = {
      museum: 4,
      castle: 4,
      palace: 4,
      landmark: 3,
      viewpoint: 3,
      artwork: 2,
      gallery: 2,
      theatre: 2,
    };

    Object.entries(popularTypes).forEach(([type, bonus]) => {
      if (Object.values(tags).includes(type)) score += bonus;
    });

    return score;
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear results if query is too short
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Automatically search as user types
    searchLocation(query);
  };

  // Handle map click events
  const handleMapClick = useCallback((e) => {
    if (!isMapClickMode) return;

    const { lat, lng } = e.latlng;
    setIsSearching(true);

    // Reverse geocode the clicked location
    axios
      .get(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}&language=en`
      )
      .then((response) => {
        if (response.data.results.length > 0) {
          const result = response.data.results[0];
          const location = {
            name: result.formatted,
            lat,
            lng,
            components: result.components,
          };
          handleLocationSelect(location);
        }
      })
      .catch((error) => {
        console.error('Error reverse geocoding:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to get location information. Please try again.',
          icon: 'error',
        });
      })
      .finally(() => {
        setIsSearching(false);
        setIsMapClickMode(false);
      });
  }, [isMapClickMode]);

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
        country: location.components.country || '',
      },
      date: format(new Date(), 'yyyy-MM-dd'),
      pointsOfInterest: [],
      timeAtStop: 60, // Default 60 minutes
    };

    setTripDays([...tripDays, newDay]);
  };

  // Handle day removal
  const handleRemoveDay = (dayId) => {
    setTripDays(tripDays.filter((day) => day.id !== dayId));
    // Also remove any POIs associated with this day
    setPointsOfInterest(pointsOfInterest.filter((poi) => poi.dayId !== dayId));
  };

  // Handle POI click
  const handlePOIClick = (poi) => {
    if (editingPOI) {
      // If currently editing, save changes first
      handleCancelEdit();
    }

    setSelectedPOI(selectedPOI === poi.id ? null : poi.id);

    // If the POI has coordinates, pan the map to it
    if (poi.lat && poi.lng && mapRef.current) {
      const map = mapRef.current;
      // Ensure coordinates are numbers
      const lat = typeof poi.lat === 'number' ? poi.lat : parseFloat(poi.lat);
      const lng = typeof poi.lng === 'number' ? poi.lng : parseFloat(poi.lng);

      // Only pan if coordinates are valid
      if (!isNaN(lat) && !isNaN(lng)) {
        map.panTo([lat, lng]);
        map.setZoom(15);
      } else {
        console.warn('Cannot pan to POI with invalid coordinates:', poi.name);
      }
    }
  };

  // Handle POI deletion
  const handleDeletePOI = (e, poiId) => {
    e.stopPropagation();
    setPointsOfInterest(pointsOfInterest.filter((poi) => poi.id !== poiId));
    if (selectedPOI === poiId) {
      setSelectedPOI(null);
    }
    if (editingPOI === poiId) {
      setEditingPOI(null);
    }
  };

  // Handle POI editing
  const handleEditPOI = (e, poi) => {
    e.stopPropagation();
    setEditingPOI(poi.id);
    setNewPOIName(poi.name);
  };

  // Handle saving edited POI
  const handleSavePOI = (e, poiId) => {
    e.stopPropagation();
    if (newPOIName.trim()) {
      setPointsOfInterest(
        pointsOfInterest.map((poi) =>
          poi.id === poiId ? { ...poi, name: newPOIName.trim() } : poi
        )
      );
      setEditingPOI(null);
      setNewPOIName('');
    }
  };

  // Handle canceling POI edit
  const handleCancelEdit = (e) => {
    if (e) e.stopPropagation();
    setEditingPOI(null);
    setNewPOIName('');
  };

  // Handle interest selection
  const handleInterestChange = (interest) => {
    setInterests({
      ...interests,
      [interest]: !interests[interest],
    });
  };

  // Handle trip style selection
  const handleTripStyleChange = (style) => {
    setTripStyle({
      ...tripStyle,
      [style]: !tripStyle[style],
    });
  };

  // Handle car availability toggle
  const handleCarChange = () => {
    setHasCar(!hasCar);
    if (!hasCar) {
      setTransportMode('driving');
    }
  };

  // Handle category selection
  const handleCategoryChange = (category, value) => {
    const currentValues = selectedCategories[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    setSelectedCategories({
      ...selectedCategories,
      [category]: newValues,
    });
  };

  // Handle hotel selection
  const handleHotelSelect = (hotel) => {
    setSelectedHotel(selectedHotel === hotel.id ? null : hotel.id);
  };

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
      { value: 'tourism=hotel', label: 'Hotels & Accommodations' },
    ],
    natural: [
      { value: 'natural=peak', label: 'Mountains & Peaks' },
      { value: 'natural=waterfall', label: 'Waterfalls' },
      { value: 'natural=wood', label: 'Woods & Forests' },
      { value: 'natural=beach', label: 'Beaches' },
      { value: 'natural=cave_entrance', label: 'Caves' },
      { value: 'natural=geyser', label: 'Geysers' },
      { value: 'natural=hot_spring', label: 'Hot Springs' },
    ],
    historic: [
      { value: 'historic=castle', label: 'Castles' },
      { value: 'historic=monument', label: 'Monuments' },
      { value: 'historic=archaeological_site', label: 'Archaeological Sites' },
      { value: 'historic=memorial', label: 'Memorials' },
      { value: 'historic=ruins', label: 'Ruins' },
      { value: 'historic=fort', label: 'Fortresses' },
      { value: 'historic=church', label: 'Religious Landmarks' },
    ],
    leisure: [
      { value: 'leisure=park', label: 'Public Parks' },
      { value: 'leisure=garden', label: 'Botanical Gardens' },
      { value: 'leisure=nature_reserve', label: 'Nature Reserves' },
      { value: 'leisure=stadium', label: 'Stadiums' },
      { value: 'leisure=playground', label: 'Playgrounds' },
      { value: 'leisure=marina', label: 'Marinas' },
    ],
    entertainment: [
      { value: 'amenity=theatre', label: 'Theatres' },
      { value: 'amenity=cinema', label: 'Cinemas' },
      { value: 'amenity=casino', label: 'Casinos' },
      { value: 'amenity=nightclub', label: 'Nightclubs' },
      { value: 'amenity=bar', label: 'Bars & Pubs' },
    ],
    sports: [
      { value: 'sport=skiing', label: 'Skiing' },
      { value: 'sport=climbing', label: 'Climbing' },
      { value: 'leisure=pitch', label: 'Sports Fields' },
      { value: 'leisure=fitness_centre', label: 'Fitness Centers' },
      { value: 'leisure=golf_course', label: 'Golf Courses' },
      { value: 'leisure=sports_centre', label: 'Sports Centers' },
    ],
  };

  // Search for locations using OpenCage
  const searchLocation = useCallback(async (query) => {
    if (!query || query.length < 3) {
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
        const locations = data.results.map((result) => ({
          name: result.formatted,
          lat: result.geometry.lat,
          lng: result.geometry.lng,
          components: result.components,
        }));
        setSearchResults(locations);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Find POIs in the current map bounds
  const findPOIsInMapBounds = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const bounds = map.getBounds();
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    // Show loading state
    setIsSearching(true);

    // Construct Overpass query for POIs in the bounding box
    const overpassQuery = `
      [out:json];
      (
        node["tourism"](${south},${west},${north},${east});
        node["historic"](${south},${west},${north},${east});
        node["natural"](${south},${west},${north},${east});
        node["leisure"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `;

    // Make request to Overpass API
    makeOverpassRequest(overpassQuery)
      .then(data => {
        if (data && data.elements) {
          // Process the POIs
          const pois = data.elements.map(element => {
            // Ensure coordinates are properly formatted as numbers
            const lat = typeof element.lat === 'number' ? element.lat : parseFloat(element.lat);
            const lng = typeof element.lon === 'number' ? element.lon : parseFloat(element.lon);

            // Skip POIs with invalid coordinates
            if (isNaN(lat) || isNaN(lng)) {
              console.warn('Skipping POI with invalid coordinates:', element);
              return null;
            }

            return {
              id: `osm-${element.id}`,
              name: element.tags.name || `Unnamed ${element.tags.tourism || element.tags.historic || element.tags.natural || element.tags.leisure}`,
              type: element.tags.tourism || element.tags.historic || element.tags.natural || element.tags.leisure,
              lat: lat,
              lng: lng,
              tags: element.tags,
              popularity: calculatePopularity(element.tags),
              selected: false,
              location: {
                name: element.tags.name || 'Unnamed Location',
                lat: lat,
                lng: lng,
                city: element.tags.city || '',
                country: element.tags.country || '',
              }
            };
          }).filter(poi => poi !== null); // Filter out null entries (invalid coordinates)

          // Update state with found POIs
          setPointsOfInterest(prevPois => {
            // Combine with existing POIs, avoiding duplicates
            const existingIds = new Set(prevPois.map(p => p.id));
            const newPois = pois.filter(p => !existingIds.has(p.id));
            return [...prevPois, ...newPois];
          });

          Swal.fire({
            title: 'Points of Interest Found',
            text: `Found ${pois.length} points of interest in the current map view`,
            icon: 'success'
          });
        }
      })
      .catch(error => {
        console.error('Error fetching POIs from Overpass:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to find points of interest in the current area',
          icon: 'error'
        });
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, [mapRef, makeOverpassRequest, calculatePopularity]);

  // Debug function to log current trip days
  const logTripDays = () => {
    console.log('Current trip points:', tripDays);
  };

  // Effect to update mapLocations when tripDays change
  useEffect(() => {
    if (tripDays.length > 0) {
      const locations = tripDays
        .filter((day) => day && day.location && day.location.lat !== undefined && day.location.lng !== undefined)
        .map((day) => ({
          lat: day.location.lat,
          lng: day.location.lng,
        }));

      // Update the mapLocations state
      setMapLocations(locations);
    }
  }, [tripDays]);

  // Modify the openInGoogleMaps function to handle both POIs and locations properly
  const openInGoogleMaps = (item) => {
    let url;
    const name = item.name || item.location?.name;
    const locality = item.locality || item.location?.city || item.location?.country;

    // Use name-based search for real places (better accuracy if coordinates are approximate)
    // Avoid name search for generic/unnamed/custom points which need exact coordinates
    const shouldUseNameSearch = name &&
      name !== 'Unnamed' &&
      name !== 'Custom Location' &&
      name !== 'Search Point' &&
      !name.includes('Dropped Pin');

    if (shouldUseNameSearch) {
      // Prioritize name + locality for best resolution
      const query = locality ? `${name}, ${locality}` : name;
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    } else {
      // Logic to extract coordinates
      let lat, lng;

      if (item.lat !== undefined && item.lng !== undefined) {
        lat = typeof item.lat === 'number' ? item.lat : parseFloat(item.lat);
        lng = typeof item.lng === 'number' ? item.lng : parseFloat(item.lng);
      } else if (item.location?.lat !== undefined && item.location?.lng !== undefined) {
        lat = typeof item.location.lat === 'number' ? item.location.lat : parseFloat(item.location.lat);
        lng = typeof item.location.lng === 'number' ? item.location.lng : parseFloat(item.location.lng);
      }

      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      } else {
        // Final fallback
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name || 'Unknown location')}`;
      }
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  // Calculate distance between two points using the Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch properties from our booking app that are near the route
  const fetchBookingAppProperties = async (currentRouteCoordinates) => {
    try {
      console.log('Fetching properties from booking app...');
      const response = await propertyService.getAll();
      const allProperties = response?.data || response || [];

      if (!Array.isArray(allProperties) || allProperties.length === 0) {
        console.log('No properties found in booking app');
        return [];
      }

      console.log(`Found ${allProperties.length} properties in booking app`);

      // Filter properties that have coordinates and are within poiDistance of the route
      const nearbyProperties = allProperties.filter(property => {
        if (!property.latitude || !property.longitude) return false;

        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);

        if (isNaN(lat) || isNaN(lng)) return false;

        // Check distance to route
        if (currentRouteCoordinates && currentRouteCoordinates.length > 0) {
          const step = Math.max(1, Math.floor(currentRouteCoordinates.length / 50));
          for (let i = 0; i < currentRouteCoordinates.length; i += step) {
            const routePoint = currentRouteCoordinates[i];
            const dist = calculateDistance(lat, lng, routePoint[0], routePoint[1]);
            if (dist <= poiDistance * 2) { // Double radius for accommodations
              return true;
            }
          }
        }

        // Check distance to trip destinations
        for (const day of tripDays) {
          if (day.location && day.location.lat && day.location.lng) {
            const dist = calculateDistance(
              lat, lng,
              parseFloat(day.location.lat),
              parseFloat(day.location.lng)
            );
            if (dist <= poiDistance * 2) {
              return true;
            }
          }
        }

        return false;
      });

      console.log(`Found ${nearbyProperties.length} properties near route`);

      // Transform to our POI format
      const formattedProperties = nearbyProperties.map(property => ({
        id: `property-${property.id}`,
        name: property.name,
        type: 'accommodation',
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude),
        locality: property.city || property.state || 'Unknown',
        description: property.description?.substring(0, 100) || `${property.property_type || 'Property'} in ${property.city}`,
        isBookingAppProperty: true,
        isOvernightStop: true,
        propertyId: property.id,
        propertyType: property.property_type,
        starRating: property.star_rating,
        selected: false,
        location: {
          name: property.name,
          lat: parseFloat(property.latitude),
          lng: parseFloat(property.longitude),
          city: property.city,
          country: property.country,
        }
      }));

      setBookingAppProperties(formattedProperties);
      return formattedProperties;
    } catch (error) {
      console.error('Error fetching booking app properties:', error);
      return [];
    }
  };

  // AI Best POI Selection
  const recommendBestPOIs = async () => {
    if (pointsOfInterest.length === 0) return;

    setIsRecommending(true);

    try {
      // Limit to 40 names to avoid token limits, prioritize by popularity/wiki score if available
      const candidates = pointsOfInterest
        .slice(0, 50)
        .map(p => `- ${p.name} (${p.locality || 'Unknown'}, ${p.type})`)
        .join('\n');

      const prompt = `
        I have a list of tourist attractions:
        ${candidates}
        
        Select the 10 absolute "must-visit" best locations from this list and what I can see on the way to them.
        Focus on famous landmarks, unique experiences, and high-rated attractions.
        
        Respond with ONLY valid JSON:
        {
          "selectedNames": ["Exact Name 1", "Exact Name 2"]
        }
      `;

      const currentKey = groqApiKey;
      if (!currentKey) {
        Swal.fire('Error', 'Groq API Key missing.', 'error');
        return;
      }

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are a travel curator. Respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`
          }
        }
      );

      const data = JSON.parse(response.data.choices[0].message.content);
      const selectedNames = data.selectedNames || [];

      if (selectedNames.length > 0) {
        setPointsOfInterest(prevPois =>
          prevPois.map(poi => ({
            ...poi,
            selected: selectedNames.some(name => poi.name.includes(name) || name.includes(poi.name))
          }))
        );

        Swal.fire({
          title: 'AI Recommendations Applied',
          text: `Selected ${selectedNames.length} top attractions for you!`,
          icon: 'success',
          timer: 2000
        });
      }

    } catch (error) {
      console.error("AI Recommendation Error", error);
      Swal.fire('Error', 'Failed to generate recommendations.', 'error');
    } finally {
      setIsRecommending(false);
    }
  };

  // AI Route Recommendation
  const recommendRoutes = async () => {
    if (tripDays.length === 0) return;

    setIsRecommending(true);
    setRecommendedRoutes([]);

    try {
      const startLocation = tripDays[0].location.name;

      const prompt = `
        I am planning a trip starting from ${startLocation}.
        Duration: ${tripDuration} days.
        Return to start: ${returnToStart ? 'Yes' : 'No'}.
        Interests: ${Object.keys(selectedCategories).filter(k => selectedCategories[k].length > 0).join(', ') || 'General Sightseeing'}.
        
        Please recommend ${numRoutesToRecommend} distinct, detailed route itineraries.
        Each option should have a name, description, and a list of stop names (cities/locations).
        
        Respond with ONLY valid JSON in this format:
        {
          "routes": [
            {
              "name": "Route Name",
              "description": "Short description of the vibe",
              "stops": ["Start City", "Stop 1", "Stop 2", "End City"]
            }
          ]
        }
      `;

      // Determine active key (Groq Only)
      const currentKey = groqApiKey;
      if (!currentKey) {
        Swal.fire('Error', 'Groq API Key missing. Please set it in AI Settings.', 'error');
        return;
      }

      const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      const response = await axios.post(
        apiUrl,
        {
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are a travel planner. Respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`
          }
        }
      );

      const responseText = response.data.choices[0].message.content;
      const data = JSON.parse(responseText);

      setRecommendedRoutes(data.routes || []);

    } catch (error) {
      console.error("AI Recommendation Error", error);
      Swal.fire('Error', 'Failed to generate recommendations.', 'error');
    } finally {
      setIsRecommending(false);
    }
  };

  const applyRecommendedRoute = async (routeStops) => {
    if (!routeStops || routeStops.length === 0) return;

    const result = await Swal.fire({
      title: 'Apply this route?',
      text: 'This will replace your current trip points. We will try to find the best matches for these locations.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Apply Route',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setIsRecommending(true);
    Swal.fire({
      title: 'Building Itinerary',
      html: 'Geocoding locations...<br/><span id="geocode-progress">Starting...</span>',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const newDays = [];
      const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;

      for (let i = 0; i < routeStops.length; i++) {
        const stopName = routeStops[i];

        // Update loading text
        const progressEl = document.getElementById('geocode-progress');
        if (progressEl) progressEl.innerText = `Finding location: ${stopName} (${i + 1}/${routeStops.length})`;

        try {
          // Use Nominatim (OSM) which doesn't require an API Key (more robust for this demo)
          // Add detailed address details
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stopName)}&format=json&addressdetails=1&limit=1`,
            {
              headers: {
                'User-Agent': 'StayHub-Planning-App/1.0'
              }
            }
          );
          const data = await response.json();

          if (data && data.length > 0) {
            const result = data[0];
            newDays.push({
              id: Date.now() + i,
              location: {
                name: stopName, // Use the name from the itinerary for consistency
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                city: result.address?.city || result.address?.town || result.address?.village || stopName,
                country: result.address?.country || ''
              },
              date: format(new Date(), 'yyyy-MM-dd'),
              pointsOfInterest: [],
              timeAtStop: 120
            });
          } else {
            // Fallback to manual object/warning
            console.warn(`Could not geocode: ${stopName}`);
            // Add it anyway with null coords so user can see/fix it? 
            // Better to skip and warn.
          }
        } catch (e) {
          console.error(`Geocode failed for ${stopName}`, e);
        }

        // Respect Nominatim Usage Policy (1 request per second)
        await new Promise(r => setTimeout(r, 1200));
      }

      if (newDays.length > 0) {
        setTripDays(newDays);
        setPointsOfInterest([]); // Clear old POIs
        setRecommendedRoutes([]); // Close the recommendation panel? Or keep it open.

        Swal.fire({
          title: 'Route Applied!',
          text: `Successfully added ${newDays.length} locations. Click "Generate Plan" to calculate the route details.`,
          icon: 'success'
        });
      } else {
        Swal.fire('Error', 'Could not find coordinates for these locations.', 'error');
      }

    } catch (error) {
      console.error("Apply Route Error", error);
      Swal.fire('Error', 'Failed to apply route. Please try adding locations manually.', 'error');
    } finally {
      setIsRecommending(false);
    }
  };

  // Find points of interest using OpenAI or Groq
  const findPointsOfInterestWithAI = async (routeCoordinates) => {
    return new Promise(async (resolve, reject) => {
      if (tripDays.length < 2) {
        console.warn('Cannot find POIs: need at least two destinations');
        setIsGeneratingPlan(false);
        reject(new Error('Not enough destinations'));
        return;
      }

      // Check if we have route coordinates
      if (!routeCoordinates || routeCoordinates.length === 0) {
        console.warn('No route coordinates available for AI POI search');
        setIsGeneratingPlan(false);
        reject(new Error('No route coordinates'));
        return;
      }

      // Determine active key (Groq Only)
      const currentKey = groqApiKey;

      // Check if we have the API key
      if (!currentKey) {
        const { value: key } = await Swal.fire({
          title: 'Groq API Key Required',
          input: 'password',
          inputLabel: 'Enter your Groq API Key',
          inputPlaceholder: 'gsk_...',
          html: '<p class="text-xs text-gray-500">Get a free key from console.groq.com</p>',
          showCancelButton: true,
          confirmButtonText: 'Save & Continue',
          inputValidator: (value) => {
            if (!value) {
              return 'You need to write something!'
            }
          }
        });

        if (key) {
          setGroqApiKey(key);
          localStorage.setItem('groq_api_key', key);
          // Retry
          setTimeout(() => findPointsOfInterestWithAI(routeCoordinates).then(resolve).catch(reject), 100);
          return;
        } else {
          // Fall back to traditional search
          findPointsOfInterestTraditional(routeCoordinates).then(resolve).catch(reject);
          return;
        }
      }

      setIsProcessingAiPoi(true);

      // Set a timeout for the AI POI generation
      const poiTimeout = setTimeout(() => {
        console.warn('AI POI generation timeout');
        setIsProcessingAiPoi(false);
        reject(new Error('AI POI generation timeout'));
      }, 30000); // 30 second timeout

      try {
        // Get the locations from trip days
        const locations = tripDays.map((loc) => ({
          name: loc.location.name,
          lat: loc.location.lat,
          lng: loc.location.lng,
        }));

        // Collect all selected filters from the expandable sections
        const filtersByCategory = {};

        // Process all category filters
        Object.entries(selectedCategories).forEach(([category, values]) => {
          if (values.length > 0) {
            filtersByCategory[category] = values.map((v) => {
              const [key, val] = v.split('=');
              return val; // Just get the value part (e.g., 'museum' from 'tourism=museum')
            });
          }
        });

        // Create an interests string from the interests state
        const selectedInterests = Object.entries(interests)
          .filter(([_, isSelected]) => isSelected)
          .map(([interest]) => interest)
          .join(', ');

        // Get filter interests
        const filterInterests = Object.values(filtersByCategory)
          .flat()
          .join(', ');

        // Calculate approximate route distance to determine number of POIs
        let totalDistance = 0;
        for (let i = 0; i < locations.length - 1; i++) {
          totalDistance += calculateDistance(
            locations[i].lat, locations[i].lng,
            locations[i + 1].lat, locations[i + 1].lng
          );
        }

        // More POIs for longer routes: 15 for short routes, up to 40 for very long routes
        const numPois = Math.min(40, Math.max(15, Math.floor(totalDistance / 20) + 10));
        console.log(`Route distance: ${totalDistance.toFixed(0)}km, requesting ${numPois} POIs`);

        const prompt = `
          I'm planning a ${tripDuration}-day trip in Romania with the following destinations: 
          ${locations
            .map((loc, i) => `${i + 1}. ${loc.name} (${loc.lat}, ${loc.lng})`)
            .join('\n')}
          
          This is approximately a ${totalDistance.toFixed(0)} km route.
          I'm traveling by ${transportMode}.
          ${scenicRoute ? 'I strongly prefer taking a scenic route over the fastest one.' : ''}
          ${avoidOptions.highways ? 'I want to avoid highways.' : ''}
          ${avoidOptions.tolls ? 'I want to avoid tolls.' : ''}
          ${avoidOptions.unpaved ? 'I want to avoid unpaved roads.' : ''}
          
          ${selectedInterests ? `My interests are: ${selectedInterests}` : ''}
          ${filterInterests ? `Additional interests: ${filterInterests}` : ''}
          ${selectedInterest ? `My main interest is: ${selectedInterest}` : ''}
          ${Object.entries(tripStyle)
            .filter(([_, isSelected]) => isSelected)
            .map(([style]) => style)
            .join(', ') ? `My trip style is: ${Object.entries(tripStyle)
              .filter(([_, isSelected]) => isSelected)
              .map(([style]) => style)
              .join(', ')}` : ''}
          
          Please suggest ${numPois} interesting points of interest along this route. Include:
          - Famous landmarks and UNESCO sites
          - Scenic mountain passes and roads (like Transfăgărășan, Transalpina if near the route)
          - Natural wonders (Bâlea Lake, Vidraru Dam, waterfalls, caves, gorges)
          - Historic fortresses and castles (Peleș, Bran, Corvin, Râșnov if near route)
          - Monasteries and churches with historical significance
          - Beautiful viewpoints and photo spots
          - Local attractions that tourists often miss
          
          IMPORTANT: 
          - Distribute POIs evenly along the ENTIRE route, not just near the start
          - Only include places within ${poiDistance} km of the actual route
          - Include famous attractions even if they require a small detour
          
          For a ${tripDuration}-day trip, also suggest ${tripDuration - 1} recommended overnight stops where I should look for accommodation.
          These should be at roughly equal intervals along my route, in towns or cities with good lodging options.
          
          For each point of interest, provide:
          1. Name
          2. Type (castle, lake, mountain_pass, dam, monastery, viewpoint, museum, historic_site, natural_wonder, etc.)
          3. Precise latitude and longitude
          4. A brief description (1-2 sentences)
          5. Locality (city or town name)
          6. isOvernightStop: true/false - set to true ONLY for the ${tripDuration - 1} recommended overnight accommodation stops
          
          Format your response as a JSON object with a "pois" array:
          {"pois": [{"name": "...", "type": "...", "lat": 00.000000, "lng": 00.000000, "description": "...", "locality": "...", "isOvernightStop": false}]}
          
          Make sure all points are real places that actually exist, with accurate coordinates. RETURN ONLY JSON.
        `;

        console.log(`Sending request to ${aiProvider}...`);

        const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        const model = 'llama-3.3-70b-versatile'; // Use correct Groq model

        // Call AI API
        const response = await axios.post(
          apiUrl,
          {
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a travel expert for Romania that provides points of interest along routes. Always respond with valid JSON only, no markdown formatting.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 8000, // Increased for more POIs
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentKey}`,
              // OpenAI specific header, Groq might ignore or accept it
              ...(aiProvider === 'openai' ? { 'OpenAI-Beta': 'assistants=v1' } : {})
            },
            timeout: 25000 // 25 second timeout for the API call
          }
        );

        // Clear the timeout since we got a response
        clearTimeout(poiTimeout);

        // Parse the response
        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
          console.error(`Unexpected ${aiProvider} API response format:`, response.data);
          throw new Error('Unexpected response format from AI API');
        }

        const responseText = response.data.choices[0].message.content;
        console.log(`Received AI response with ${responseText.length} characters`);

        // Extract JSON from the response
        let poisFromAi = [];

        try {
          // Parse the JSON response
          const parsedResponse = JSON.parse(responseText);
          poisFromAi = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse.pois || []);
          console.log('Successfully parsed JSON response');
        } catch (jsonError) {
          console.error('JSON parsing failed:', jsonError);
          // Try heuristic fix if JSON is wrapped in ```json ... ```
          const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            try {
              poisFromAi = JSON.parse(jsonMatch[1]);
            } catch (e) {
              // Try identifying array brackets directly
              const firstBracket = responseText.indexOf('[');
              const lastBracket = responseText.lastIndexOf(']');
              if (firstBracket !== -1 && lastBracket !== -1) {
                try {
                  poisFromAi = JSON.parse(responseText.substring(firstBracket, lastBracket + 1));
                } catch (err) {
                  reject(new Error(`Failed to parse AI response: ${jsonError.message}`));
                  return;
                }
              } else {
                reject(new Error(`Failed to parse AI response: ${jsonError.message}`));
                return;
              }
            }
          } else {
            // Try loose JSON extraction (finding outer brackets)
            const firstBracket = responseText.indexOf('[');
            const lastBracket = responseText.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
              try {
                poisFromAi = JSON.parse(responseText.substring(firstBracket, lastBracket + 1));
              } catch (e) {
                reject(new Error(`Failed to parse AI response: ${jsonError.message}`));
                return;
              }
            } else {
              reject(new Error(`Failed to parse AI response: ${jsonError.message}`));
              return;
            }
          }
        }

        // Filter undefined or Unnamed
        if (Array.isArray(poisFromAi)) {
          poisFromAi = poisFromAi.filter(p => p.name && p.name !== 'Unnamed' && !p.name.includes('(Unnamed)') && p.type);
        }

        // Process and add IDs to POIs
        let processedPois = poisFromAi.map((poi) => {
          // Ensure coordinates are numbers
          const lat = typeof poi.lat === 'number' ? poi.lat : parseFloat(poi.lat);
          const lng = typeof poi.lng === 'number' ? poi.lng : parseFloat(poi.lng);

          // Skip POIs with invalid coordinates
          if (isNaN(lat) || isNaN(lng)) {
            console.warn('Skipping POI with invalid coordinates:', poi);
            return null;
          }

          return {
            ...poi,
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isAiGenerated: true,
            isOvernightStop: poi.isOvernightStop || false, // Mark overnight stops
            selected: false,
            popularity: 0.8,
            locality: poi.locality || 'Unknown',
            // Ensure lat and lng are properly set as numbers
            lat: lat,
            lng: lng,
            location: {
              name: poi.name,
              lat: lat,
              lng: lng,
              city: poi.locality,
              country: '',
            },
            type: poi.isOvernightStop ? 'accommodation' : 'poi',
          };
        }).filter(poi => poi !== null); // Filter out null entries (invalid coordinates)

        // Filter POIs by distance to route
        const beforeCount = processedPois.length;
        processedPois = processedPois.filter(poi => {
          let minDistToRoute = Infinity;

          // Check distance to route - sample more points for better accuracy
          if (routeCoordinates && routeCoordinates.length > 0) {
            // Check every 50 points (more samples for accuracy)
            const step = Math.max(1, Math.floor(routeCoordinates.length / 100));
            for (let i = 0; i < routeCoordinates.length; i += step) {
              const routePoint = routeCoordinates[i];
              const dist = calculateDistance(poi.lat, poi.lng, routePoint[0], routePoint[1]);
              minDistToRoute = Math.min(minDistToRoute, dist);
              if (dist <= poiDistance) {
                return true;
              }
            }
            // Also check the very last point
            const lastPoint = routeCoordinates[routeCoordinates.length - 1];
            const distToLast = calculateDistance(poi.lat, poi.lng, lastPoint[0], lastPoint[1]);
            minDistToRoute = Math.min(minDistToRoute, distToLast);
            if (distToLast <= poiDistance) {
              return true;
            }
          }

          // Check distance to trip destinations (more reliable)
          for (const day of tripDays) {
            if (day.location && day.location.lat && day.location.lng) {
              const dist = calculateDistance(
                poi.lat, poi.lng,
                parseFloat(day.location.lat),
                parseFloat(day.location.lng)
              );
              minDistToRoute = Math.min(minDistToRoute, dist);
              if (dist <= poiDistance) {
                return true;
              }
            }
          }

          console.log(`Filtering out POI "${poi.name}" - min distance ${minDistToRoute.toFixed(1)}km > ${poiDistance}km limit`);
          return false;
        });

        console.log(`Kept ${processedPois.length} POIs within ${poiDistance}km, filtered out ${beforeCount - processedPois.length}`);

        // Reverse Geocode Missing Locations (Sequential to be safe)
        const OPENCAGE_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
        if (OPENCAGE_KEY && processedPois.length > 0) {
          console.log('Verifying locations with OpenCage...');
          for (let i = 0; i < processedPois.length; i++) {
            const poi = processedPois[i];
            if (!poi.locality || poi.locality === 'Unknown' || poi.locality === 'Unknown location' || poi.locality === 'Location not available') {
              try {
                // Rate limit basic handling: wait small delay
                await new Promise(r => setTimeout(r, 200));
                const geoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${poi.lat}+${poi.lng}&key=${OPENCAGE_KEY}`;
                const geoRes = await axios.get(geoUrl);
                if (geoRes.data.results && geoRes.data.results.length > 0) {
                  const components = geoRes.data.results[0].components;
                  // Prioritize city/town, fallback to county/state
                  const newLocality = components.city || components.town || components.village || components.municipality || components.county || components.state || 'Unknown';

                  processedPois[i].locality = newLocality;
                  processedPois[i].location.city = newLocality;
                  if (components.country) processedPois[i].location.country = components.country;
                  // console.log(`Geocoded ${poi.name} to ${newLocality}`);
                }
              } catch (err) {
                console.warn('Geocoding fail:', err.message);
              }
            }
          }
        }

        // Check if we have any valid POIs
        if (processedPois.length === 0) {
          console.warn('No valid POIs found in AI response');
          reject(new Error('No valid POIs found in AI response'));
          return;
        }

        // Set the POIs to state
        setPointsOfInterest(prevPois => {
          // Combine previous POIs with new ones, avoiding duplicates
          const combinedPois = [...prevPois];
          processedPois.forEach(newPoi => {
            // Check if this POI already exists (by name and coordinates)
            const exists = combinedPois.some(
              existingPoi =>
                existingPoi.name === newPoi.name &&
                Math.abs(existingPoi.lat - newPoi.lat) < 0.0001 &&
                Math.abs(existingPoi.lng - newPoi.lng) < 0.0001
            );
            if (!exists) {
              combinedPois.push(newPoi);
            }
          });
          return combinedPois;
        });

        // Insert POIs between trip days instead of adding them as separate days
        const actualDays = tripDays.filter((day) => day.type !== 'poi');

        // Sort all accumulated POIs by their proximity to the route
        // Use the updated pointsOfInterest state which now includes all POIs
        const sortedPois = [...pointsOfInterest];

        // Create a new array with days and POIs interspersed
        const newTripDays = [];
        if (actualDays.length > 0) {
          newTripDays.push(actualDays[0]);
        }

        for (let i = 1; i < actualDays.length; i++) {
          const poisToAdd = sortedPois.splice(0, Math.min(2, sortedPois.length));
          newTripDays.push(...poisToAdd);
          newTripDays.push(actualDays[i]);
        }

        if (sortedPois.length > 0) {
          newTripDays.push(...sortedPois);
        }

        setTripDays(newTripDays);

        Swal.fire({
          title: 'AI Points of Interest',
          text: `Added ${processedPois.length} points of interest to your trip using ${aiProvider === 'groq' ? 'Groq' : 'OpenAI'}`,
          icon: 'success',
        });

        resolve(processedPois);
      } catch (aiError) {
        console.error(`Error connecting to ${aiProvider}:`, aiError);
        clearTimeout(poiTimeout);

        // Handle specific errors
        if (aiError.response && aiError.response.status === 429) {
          Swal.fire({
            title: 'Rate Limit Exceeded',
            text: `The ${aiProvider} API rate limit was reached. Using fallback POIs instead.`,
            icon: 'warning'
          });

          try {
            // Use hardcoded fallback - don't call Overpass which may also be rate limited
            const fallbackPois = await findPointsOfInterestFallback(routeCoordinates);
            resolve(fallbackPois);
            return;
          } catch (e) {
            console.warn('Fallback also failed:', e);
          }
        }

        reject(new Error(`Failed to connect to ${aiProvider} API`));
      } finally {
        setIsProcessingAiPoi(false);
      }
    });
  };



  // Find all points of interest based on selected filters using traditional method
  const findPointsOfInterestTraditional = async (routeCoordinates) => {
    return new Promise(async (resolve, reject) => {
      if (tripDays.length < 2 || !routeCoordinates.length) {
        console.warn('Cannot find POIs: need route coordinates and at least two destinations');
        reject(new Error('Missing route coordinates or destinations'));
        return;
      }

      // Set a timeout for the traditional POI search
      const traditionalSearchTimeout = setTimeout(() => {
        console.warn('Traditional POI search timeout');
        reject(new Error('Traditional POI search timeout'));
      }, 30000); // 30 second timeout

      try {
        // Get the bounding box from the first and last destinations
        const firstDay = tripDays[0];
        const lastDay = tripDays[tripDays.length - 1];

        let minLat = Math.min(firstDay.location.lat, lastDay.location.lat) - 0.5;
        let maxLat = Math.max(firstDay.location.lat, lastDay.location.lat) + 0.5;
        let minLng = Math.min(firstDay.location.lng, lastDay.location.lng) - 0.5;
        let maxLng = Math.max(firstDay.location.lng, lastDay.location.lng) + 0.5;

        // Sample more points along the route to catch smaller localities
        const routePoints = sampleRoutePoints(routeCoordinates, 10); // Get 10 points along the route

        // Find all localities along the route (cities, towns, villages, suburbs)
        const localityPromises = routePoints.map(async (point) => {
          const localityQuery = `
            [out:json][bbox:${minLat},${minLng},${maxLat},${maxLng}];
            (
              node[place~"city|town|village|suburb|hamlet"](around:${poiDistance * 1000},${point[0]},${point[1]});
              way[place~"city|town|village|suburb|hamlet"](around:${poiDistance * 1000},${point[0]},${point[1]});
              relation[place~"city|town|village|suburb|hamlet"](around:${poiDistance * 1000},${point[0]},${point[1]});
            );
            out body center;
          `;

          try {
            const response = await axios.post('https://overpass-api.de/api/interpreter', localityQuery, { timeout: 20000 });
            return response.data.elements
              .filter((element) => element.tags?.name)
              .map((element) => ({
                ...element,
                lat: element.lat || element.center?.lat,
                lon: element.lon || element.center?.lon,
                distanceToRoute: calculateDistance(
                  point[0],
                  point[1],
                  element.lat || element.center?.lat,
                  element.lon || element.center?.lon
                ),
              }))
              .filter((element) => element.lat && element.lon) // Ensure we have valid coordinates
              .sort((a, b) => a.distanceToRoute - b.distanceToRoute)
              .slice(0, 3); // Take 3 closest localities per point
          } catch (error) {
            console.warn(`Failed to fetch localities near point ${point[0]},${point[1]}:`, error.message);
            return [];
          }
        });

        const localities = (await Promise.all(localityPromises))
          .flat()
          .filter((locality, index, self) =>
            // Remove duplicates based on name
            index === self.findIndex((l) => l.tags.name === locality.tags.name)
          )
          .slice(0, 3); // Limit to 3 localities to avoid too many API calls

        console.log(`Found ${localities.length} localities to search for POIs`);

        // If no localities found, reject with an error
        if (localities.length === 0) {
          clearTimeout(traditionalSearchTimeout);
          reject(new Error('No localities found along the route'));
          return;
        }

        // Build category queries
        const categoryQueries = [];
        Object.entries(selectedCategories).forEach(([category, values]) => {
          values.forEach((value) => {
            const [key, val] = value.split('=');
            categoryQueries.push(`node["${key}"="${val}"];`);
          });
        });

        if (categoryQueries.length === 0) {
          // Default tourist attractions if no filters selected
          categoryQueries.push(
            'node["tourism"~"attraction|museum|viewpoint|gallery|artwork"];',
            'node["historic"~"monument|memorial|ruins|archaeological_site|castle"];',
            'node["natural"~"beach|cave_entrance|peak|volcano|waterfall"];',
            'node["leisure"~"park|garden|nature_reserve"];',
            'node["amenity"~"theatre|cinema|arts_centre"];'
          );
        }

        // Find POIs near each locality - SEQUENTIAL to avoid rate limiting
        const allPois = [];
        for (const locality of localities) {
          const poiQuery = `
            [out:json];
            (
              ${categoryQueries.map((q) =>
            q.replace(';', `(around:${poiDistance * 1000},${locality.lat},${locality.lon});`)
          ).join('\n              ')}
            );
            out body;
            >;
            out count tags;
          `;

          try {
            console.log(`Searching for POIs near ${locality.tags.name}...`);
            const data = await makeOverpassRequest(poiQuery);
            const pois = data.elements
              .filter((element) => element.tags?.name)
              .map((element) => ({
                id: `osm-${element.id}`,
                name: element.tags.name,
                lat: element.lat,
                lng: element.lon,
                type:
                  element.tags.tourism ||
                  element.tags.historic ||
                  element.tags.natural ||
                  element.tags.leisure ||
                  element.tags.amenity ||
                  'attraction',
                locality: locality.tags.name,
                localityType: locality.tags.place,
                distanceToRoute: locality.distanceToRoute,
                selected: false,
                popularity: calculatePopularity(element.tags),
                description: element.tags.description || `A ${element.tags.tourism || element.tags.historic || element.tags.natural || element.tags.leisure || element.tags.amenity || 'attraction'} in ${locality.tags.name}`,
                location: {
                  name: element.tags.name,
                  lat: element.lat,
                  lng: element.lon,
                  city: locality.tags.name,
                  country: '',
                },
              }));

            allPois.push(...pois);
            console.log(`Found ${pois.length} POIs near ${locality.tags.name}`);

            // If we have enough POIs, stop early
            if (allPois.length >= 20) {
              console.log('Found enough POIs, stopping search');
              break;
            }
          } catch (error) {
            console.warn(`Failed to fetch POIs near ${locality.tags.name}:`, error.message);
            // If rate limited, stop trying other localities
            if (error.message === 'OVERPASS_RATE_LIMITED') {
              console.warn('Rate limited - stopping POI search');
              break;
            }
          }
        }

        // Remove duplicates based on ID
        const uniquePois = allPois.filter((poi, index, self) =>
          index === self.findIndex((p) => p.id === poi.id)
        );

        // If no POIs found, reject with an error
        if (uniquePois.length === 0) {
          clearTimeout(traditionalSearchTimeout);
          reject(new Error('No points of interest found along the route'));
          return;
        }

        // Group POIs by locality and get top 10 for each
        const poisByLocality = uniquePois.reduce((acc, poi) => {
          if (!acc[poi.locality]) {
            acc[poi.locality] = [];
          }
          acc[poi.locality].push(poi);
          return acc;
        }, {});

        // Sort each locality's POIs by popularity and take top 10
        Object.keys(poisByLocality).forEach((locality) => {
          poisByLocality[locality].sort((a, b) => b.popularity - a.popularity);
          poisByLocality[locality] = poisByLocality[locality].slice(0, 10);
        });

        setPointsOfInterest(prevPois => {
          // Combine previous POIs with new ones, avoiding duplicates
          const combinedPois = [...prevPois];
          uniquePois.forEach(newPoi => {
            // Check if this POI already exists (by name and coordinates)
            const exists = combinedPois.some(
              existingPoi =>
                existingPoi.name === newPoi.name &&
                Math.abs(existingPoi.lat - newPoi.lat) < 0.0001 &&
                Math.abs(existingPoi.lng - newPoi.lng) < 0.0001
            );
            if (!exists) {
              combinedPois.push(newPoi);
            }
          });
          return combinedPois;
        });
        setPoisByLocality(poisByLocality);

        // Show success message
        Swal.fire({
          title: 'Points of Interest Found',
          text: `Found ${uniquePois.length} points of interest along your route`,
          icon: 'success',
        });

        // Clear the timeout and resolve with the POIs
        clearTimeout(traditionalSearchTimeout);
        resolve(uniquePois);
      } catch (error) {
        console.error('Error finding route POIs:', error);

        // Clear the timeout and reject with the error
        clearTimeout(traditionalSearchTimeout);

        Swal.fire({
          title: 'Error',
          text: 'Failed to find points of interest along the route',
          icon: 'error',
        });

        reject(error);
      }
    });
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
    const segmentSize = route.length / count;

    // Add evenly distributed points along the route
    for (let i = 1; i < count - 1; i++) {
      const index = Math.floor(i * segmentSize);
      if (index > 0 && index < route.length - 1 && !points.some((p) => p[0] === route[index][0] && p[1] === route[index][1])) {
        points.push(route[index]);
      }
    }

    // Always include a point near the end (but not the exact end)
    if (route.length > 10) {
      const endIndex = Math.min(route.length - 2, Math.floor(route.length * 0.9));
      if (!points.some((p) => p[0] === route[endIndex][0] && p[1] === route[endIndex][1])) {
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
            guests: 2, // Default to 2 guests
          },
        });

        if (response.data.status === 'success') {
          // Process hotels
          const hotels = response.data.data.map((hotel) => ({
            ...hotel,
            dayIndex: index,
            distance: calculateDistance(
              day.location.lat,
              day.location.lng,
              hotel.latitude,
              hotel.longitude
            ),
          }));

          return hotels;
        }

        return [];
      });

      // Wait for all hotel searches to complete
      const allHotels = await Promise.all(hotelsPromises);

      // Flatten the array and sort by distance within each day
      const flattenedHotels = allHotels
        .flat()
        .sort((a, b) => {
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

  // Calculate route to a POI
  const calculatePOIRoute = async (startPoint, poi) => {
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/${transportMode}/${startPoint[0]},${startPoint[1]};${poi.lat},${poi.lng}?overview=full&geometries=geojson`
      );

      if (response.data.routes && response.data.routes[0]) {
        return response.data.routes[0].geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]);
      }
      return null;
    } catch (error) {
      console.error('Error calculating POI route:', error);
      return null;
    }
  };



  // Optimize Trip Order (TSP)
  const optimizeTripOrder = () => {
    if (tripDays.length < 3) {
      Swal.fire('Info', 'Add more destinations to optimize the order.', 'info');
      return;
    }

    const start = tripDays[0];
    const end = tripDays[tripDays.length - 1];

    // If only 3 points (Start, Middle, End), nothing to optimize unless End is flexible.
    // Assuming Start and End are fixed anchors.
    if (tripDays.length === 3) {
      Swal.fire('Optimized', 'Route is already minimal.', 'info');
      return;
    }

    const middle = tripDays.slice(1, -1);
    let bestOrder = middle;
    let minDistance = Infinity;

    // Helper to calc total path distance
    const getPathDist = (path) => {
      let d = 0;
      for (let i = 0; i < path.length - 1; i++) {
        // Ensure numbers
        const lat1 = typeof path[i].location.lat === 'number' ? path[i].location.lat : parseFloat(path[i].location.lat);
        const lng1 = typeof path[i].location.lng === 'number' ? path[i].location.lng : parseFloat(path[i].location.lng);
        const lat2 = typeof path[i + 1].location.lat === 'number' ? path[i + 1].location.lat : parseFloat(path[i + 1].location.lat);
        const lng2 = typeof path[i + 1].location.lng === 'number' ? path[i + 1].location.lng : parseFloat(path[i + 1].location.lng);
        d += calculateDistance(lat1, lng1, lat2, lng2);
      }
      return d;
    };

    // For small number of stops (<= 5 middle points), use Brute Force Permutations
    if (middle.length <= 5) {
      const perms = (arr) => {
        if (arr.length <= 1) return [arr];
        const output = [];
        for (let i = 0; i < arr.length; i++) {
          const current = arr[i];
          const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
          const subPerms = perms(remaining);
          subPerms.forEach(p => output.push([current, ...p]));
        }
        return output;
      };

      const allPermutations = perms(middle);

      allPermutations.forEach(perm => {
        const path = [start, ...perm, end];
        const d = getPathDist(path);
        if (d < minDistance) {
          minDistance = d;
          bestOrder = perm;
        }
      });
    } else {
      // Nearest Neighbor Greedy for larger sets
      let current = start;
      const remaining = [...middle];
      const result = [];

      while (remaining.length > 0) {
        let nearestIdx = -1;
        let minD = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const d = calculateDistance(
            current.location.lat, current.location.lng,
            remaining[i].location.lat, remaining[i].location.lng
          );
          if (d < minD) { minD = d; nearestIdx = i; }
        }
        const next = remaining.splice(nearestIdx, 1)[0];
        result.push(next);
        current = next;
      }
      bestOrder = result;
    }

    setTripDays([start, ...bestOrder, end]);
    Swal.fire({
      title: 'Route Optimized',
      text: 'Stops have been reordered for the shortest driving distance.',
      icon: 'success',
      timer: 1500
    });
  };

  // Generate a trip plan with route and points of interest
  const generatePlan = async () => {
    // Validate that we have at least two destinations
    if (tripDays.length < 2) {
      Swal.fire({
        title: 'Not Enough Destinations',
        text: 'Please add at least two destinations to generate a trip plan.',
        icon: 'warning',
      });
      return;
    }

    // Show loading state
    setIsGeneratingPlan(true);

    // Set a timeout for the entire plan generation process
    const planGenerationTimeout = setTimeout(() => {
      console.warn('Plan generation timeout');
      setIsGeneratingPlan(false);
      Swal.fire({
        title: 'Timeout',
        text: 'Trip plan generation took too long. Please try again or use fewer destinations.',
        icon: 'warning',
      });
    }, 60000); // 60 second timeout

    try {
      // Validate coordinates for each destination
      for (const day of tripDays) {
        const lat = typeof day.location.lat === 'number' ? day.location.lat : parseFloat(day.location.lat);
        const lng = typeof day.location.lng === 'number' ? day.location.lng : parseFloat(day.location.lng);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error(`Invalid coordinates for destination: ${day.location.name}`);
        }
      }

      // Format waypoints for OSRM API
      const waypoints = tripDays
        .filter(day => day.type !== 'poi') // Only include actual destinations, not POIs
        .map(day => {
          // Ensure coordinates are numbers
          const lat = typeof day.location.lat === 'number' ? day.location.lat : parseFloat(day.location.lat);
          const lng = typeof day.location.lng === 'number' ? day.location.lng : parseFloat(day.location.lng);
          return `${lng},${lat}`; // OSRM expects lng,lat format
        })
        .join(';');

      // Fetch route from OSRM
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/${transportMode}/${waypoints}?overview=full&geometries=geojson`
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];

        // Convert coordinates from [lng, lat] to [lat, lng] for Leaflet
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

        // Store route coordinates for later use
        setRouteCoordinates(coordinates);

        // Calculate route details
        const distance = route.distance / 1000; // Convert to km
        const duration = route.duration / 60; // Convert to minutes

        setRouteDetails({
          distance,
          duration,
          steps: route.legs || [],
        });

        // Find points of interest along the route
        try {
          let currentRouteCoordinates = coordinates;

          // Clear existing POIs only at the beginning of a new plan generation
          setPointsOfInterest([]);

          if (isUsingAiForPoi) {
            // Use AI to find points of interest
            try {
              const aiPois = await findPointsOfInterestWithAI(currentRouteCoordinates);
              // AI search succeeded - don't call traditional search
              console.log('AI POI search completed successfully');
            } catch (aiError) {
              console.error('AI POI search failed:', aiError);
              // Only try fallback if AI completely fails
              console.log('AI search failed, trying fallback POIs...');
              await findPointsOfInterestFallback(currentRouteCoordinates);
            }
          } else {
            // Use traditional search with Overpass API
            try {
              await findPointsOfInterestWithOverpass(currentRouteCoordinates);
            } catch (overpassError) {
              console.error('Overpass API failed:', overpassError);
              // Only use fallback if Overpass completely fails
              console.log('Overpass failed, using hardcoded fallback POIs...');
              await findPointsOfInterestFallback(currentRouteCoordinates);
            }
          }

          // Also fetch properties from our booking app
          try {
            await fetchBookingAppProperties(currentRouteCoordinates);
          } catch (propError) {
            console.log('Could not fetch booking app properties:', propError);
          }
        } catch (poiError) {
          console.error('Error finding POIs:', poiError);
          // Even if POI finding fails, we still have a route
          Swal.fire({
            title: 'Points of Interest Error',
            text: 'Could not find points of interest along the route. The route has been calculated successfully.',
            icon: 'warning',
          });
        } finally {
          // Always reset these states
          clearTimeout(planGenerationTimeout);
          setIsGeneratingPlan(false);
          setIsProcessingAiPoi(false);
        }
      } else {
        console.warn('No driving route found, falling back to direct path');
        // Fallback: Create straight lines between points
        const directPath = tripDays
          .filter(day => day.type !== 'poi')
          .map(day => {
            const lat = typeof day.location.lat === 'number' ? day.location.lat : parseFloat(day.location.lat);
            const lng = typeof day.location.lng === 'number' ? day.location.lng : parseFloat(day.location.lng);
            return [lat, lng];
          });

        setRouteCoordinates(directPath);
        setRouteDetails({
          distance: 0, // Unknown
          duration: 0,
          steps: []
        });

        Swal.fire({
          title: 'Route Not Drivable',
          text: 'Some parts of your trip are not accessible by car (e.g., requires ferry). Showing direct path instead.',
          icon: 'info',
          timer: 4000
        });

        // Still try to find POIs using the direct path
        try {
          // Use traditional search for direct path
          await findPointsOfInterestTraditional(directPath);
        } catch (err) {
          console.error("Fallback POI search failed", err);
        }
      }
    } catch (error) {
      console.error('Error in generatePlan:', error);
      Swal.fire({
        title: 'Planning Error',
        text: 'An error occurred while generating the plan.',
        icon: 'error',
      });
      // Fallback on crash too
      const directPath = tripDays
        .filter(day => day.type !== 'poi')
        .map(day => [
          typeof day.location.lat === 'number' ? day.location.lat : parseFloat(day.location.lat),
          typeof day.location.lng === 'number' ? day.location.lng : parseFloat(day.location.lng)
        ]);
      setRouteCoordinates(directPath);
    } finally {
      clearTimeout(planGenerationTimeout);
      setIsGeneratingPlan(false);
      setIsProcessingAiPoi(false);
    }


    // After all POI searches are complete, update trip days with all accumulated POIs
    if (pointsOfInterest.length > 0) {
      // Get actual days (non-POI days)
      const actualDays = tripDays.filter((day) => day.type !== 'poi');

      // Create a new array with days and POIs interspersed
      const newTripDays = [];
      if (actualDays.length > 0) {
        newTripDays.push(actualDays[0]);
      }

      // Make a copy of all POIs to distribute
      const poisToDistribute = [...pointsOfInterest];

      // Sort POIs by their proximity to the route or other criteria
      // This is a simplified sort - you may want to use a more sophisticated algorithm
      poisToDistribute.sort((a, b) => {
        // If they have different localities, sort by locality
        if (a.locality !== b.locality) {
          return a.locality.localeCompare(b.locality);
        }
        // Otherwise sort by popularity if available
        return (b.popularity || 0.5) - (a.popularity || 0.5);
      });

      // Distribute POIs between destinations
      for (let i = 1; i < actualDays.length; i++) {
        // Calculate how many POIs to add between each pair of destinations
        // More POIs for longer trips, fewer for shorter trips
        const poisPerSegment = Math.min(
          3, // Maximum 3 POIs per segment
          Math.ceil(poisToDistribute.length / Math.max(1, actualDays.length - 1))
        );

        const poisToAdd = poisToDistribute.splice(0, poisPerSegment);
        newTripDays.push(...poisToAdd);
        newTripDays.push(actualDays[i]);
      }

      // Add any remaining POIs at the end
      if (poisToDistribute.length > 0) {
        newTripDays.push(...poisToDistribute);
      }

      // Update trip days
      setTripDays(newTripDays);

      // Show success message
      Swal.fire({
        title: 'Points of Interest',
        text: `Added ${pointsOfInterest.length} points of interest to your trip`,
        icon: 'success',
      });
    }
  };

  // New function to find POIs using Overpass API with a GET request
  const findPointsOfInterestWithOverpass = async (routeCoordinates) => {
    try {
      console.log("Finding POIs with Overpass API");

      // Get a simplified bounding box for the query
      const bounds = getSimplifiedBounds(routeCoordinates, poiDistance);
      console.log("Using bounds with POI distance:", poiDistance, "km");

      // Create a query that respects the POI distance parameter
      // We'll use around to find POIs near the route points
      let query = '[out:json];(';

      // Sample points along the route to search around
      // For longer routes, we don't want to query every point
      const sampleSize = Math.min(routeCoordinates.length, 10);
      const step = Math.max(1, Math.floor(routeCoordinates.length / sampleSize));

      for (let i = 0; i < routeCoordinates.length; i += step) {
        const point = routeCoordinates[i];
        // Add queries for different POI types around this point
        // Convert poiDistance from km to meters
        const radius = poiDistance * 1000;
        query += `
          node["tourism"="attraction"]["wikidata"](around:${radius},${point[0]},${point[1]});
          node["tourism"="museum"]["wikidata"](around:${radius},${point[0]},${point[1]});
          node["historic"="castle"]["wikidata"](around:${radius},${point[0]},${point[1]});
          node["historic"="monument"]["wikidata"](around:${radius},${point[0]},${point[1]});
        `;
      }

      // Close the query
      query += ');out body;';

      // URL encode the query
      const encodedQuery = encodeURIComponent(query);

      // Use a GET request with the query as a parameter
      const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;
      console.log("Request URL:", url.substring(0, 100) + "...");

      // Send the request
      const response = await axios.get(url, { timeout: 30000 });

      // Process the POI data
      const elements = response.data.elements || [];
      console.log(`Found ${elements.length} POIs from Overpass API`);

      // Only take a reasonable number of POIs to avoid overwhelming the browser
      // Since we are filtering by Wikidata (famous places), we can allow more results as they are higher quality
      const limitedElements = elements.slice(0, 100);

      // Transform the POIs to our format
      const newPois = limitedElements
        .map(element => transformOverpassElementToPoi(element))
        .filter(poi => poi !== null)
        .map(poi => {
          // Fix "Unknown location" by referencing nearest trip destination
          if (!poi.locality || poi.locality === 'Unknown location' || poi.locality === 'Unknown') {
            let closest = null;
            let minDist = Infinity;
            tripDays.forEach(day => {
              // Ensure coords are valid numbers
              const dLat = typeof day.location.lat === 'number' ? day.location.lat : parseFloat(day.location.lat);
              const dLng = typeof day.location.lng === 'number' ? day.location.lng : parseFloat(day.location.lng);
              if (!isNaN(dLat) && !isNaN(dLng)) {
                const d = calculateDistance(poi.lat, poi.lng, dLat, dLng);
                if (d < minDist) { minDist = d; closest = day.location.name; }
              }
            });

            // If within 50km of a known stop, use that context
            if (minDist < 50 && closest) {
              return { ...poi, locality: `Near ${closest}` };
            }
          }
          return poi;
        });

      console.log(`Successfully processed ${newPois.length} POIs`);

      // Add the new POIs to the existing ones
      if (newPois.length > 0) {
        setPointsOfInterest(prevPois => [...prevPois, ...newPois]);
      } else {
        console.log('No POIs found from Overpass API');
      }
      return newPois;
    } catch (error) {
      console.error('Error with Overpass API:', error);
      // Re-throw the error - let the caller handle fallback
      throw error;
    }
  };

  // Fallback method to find POIs
  const findPointsOfInterestFallback = async (routeCoordinates) => {
    try {
      console.log("Using fallback method to find POIs");

      // Create some hardcoded POIs for Romania
      const hardcodedPois = [
        {
          id: 'fallback-1',
          name: 'Palace of Parliament',
          type: 'attraction',
          lat: 44.4275,
          lng: 26.0875,
          locality: 'Bucharest',
          description: 'The world\'s second-largest administrative building',
          selected: false
        },
        {
          id: 'fallback-2',
          name: 'Bran Castle',
          type: 'castle',
          lat: 45.5149,
          lng: 25.3672,
          locality: 'Bran',
          description: 'Often associated with Dracula',
          selected: false
        },
        {
          id: 'fallback-3',
          name: 'Peleș Castle',
          type: 'castle',
          lat: 45.3600,
          lng: 25.5426,
          locality: 'Sinaia',
          description: 'A Neo-Renaissance castle in the Carpathian Mountains',
          selected: false
        },
        {
          id: 'fallback-4',
          name: 'Transfăgărășan Highway',
          type: 'attraction',
          lat: 45.6034,
          lng: 24.6173,
          locality: 'Carpathian Mountains',
          description: 'One of the most spectacular roads in the world',
          selected: false
        },
        {
          id: 'fallback-5',
          name: 'Sibiu Old Town',
          type: 'historic',
          lat: 45.7983,
          lng: 24.1480,
          locality: 'Sibiu',
          description: 'Well-preserved medieval town center',
          selected: false
        },
        {
          id: 'fallback-6',
          name: 'Sighișoara Citadel',
          type: 'historic',
          lat: 46.2197,
          lng: 24.7920,
          locality: 'Sighișoara',
          description: 'Medieval citadel, birthplace of Vlad Dracula',
          selected: false
        },
        {
          id: 'fallback-7',
          name: 'Constanța Casino',
          type: 'historic',
          lat: 44.1765,
          lng: 28.6530,
          locality: 'Constanța',
          description: 'Art Nouveau casino on the Black Sea coast',
          selected: false
        }
      ];

      // Filter POIs that are within poiDistance of the route
      const filteredPois = hardcodedPois.filter(poi => {
        // Check if POI is within distance of any point on the route
        if (routeCoordinates && routeCoordinates.length > 0) {
          // Sample more points for accuracy
          const step = Math.max(1, Math.floor(routeCoordinates.length / 100));
          for (let i = 0; i < routeCoordinates.length; i += step) {
            const routePoint = routeCoordinates[i];
            const dist = calculateDistance(poi.lat, poi.lng, routePoint[0], routePoint[1]);
            if (dist <= poiDistance) {
              console.log(`Fallback POI "${poi.name}" is ${dist.toFixed(1)}km from route - INCLUDING`);
              return true;
            }
          }
        }

        // Also check against trip day locations
        for (const day of tripDays) {
          if (day.location && day.location.lat && day.location.lng) {
            const dist = calculateDistance(
              poi.lat, poi.lng,
              parseFloat(day.location.lat),
              parseFloat(day.location.lng)
            );
            if (dist <= poiDistance) {
              console.log(`Fallback POI "${poi.name}" is ${dist.toFixed(1)}km from ${day.location.name} - INCLUDING`);
              return true;
            }
          }
        }

        return false;
      });

      console.log(`Filtered ${filteredPois.length} POIs within ${poiDistance}km of route (from ${hardcodedPois.length} total)`);

      // Only add POIs that passed the filter
      if (filteredPois.length > 0) {
        setPointsOfInterest(prevPois => [...prevPois, ...filteredPois]);
      } else {
        console.log('No fallback POIs within distance of route');
      }

      return filteredPois;
    } catch (error) {
      console.error('Error with fallback POI method:', error);
      throw new Error('All POI search methods failed');
    }
  };

  // Helper function to get simplified bounds for Overpass query
  // Now takes poiDistance as a parameter
  const getSimplifiedBounds = (coords, distance) => {
    if (coords && coords.length > 0) {
      // Calculate bounds from route
      const lats = coords.map(coord => coord[0]);
      const lngs = coords.map(coord => coord[1]);

      // Add the POI distance to the bounds (convert km to approximate degrees)
      // 1 degree is roughly 111 km, so we divide by 111 to get degrees
      const bufferDegrees = distance / 111;

      const minLat = Math.min(...lats) - bufferDegrees;
      const maxLat = Math.max(...lats) + bufferDegrees;
      const minLng = Math.min(...lngs) - bufferDegrees;
      const maxLng = Math.max(...lngs) + bufferDegrees;

      return `${minLat},${minLng},${maxLat},${maxLng}`;
    } else if (tripDays.length > 0) {
      // Use the first destination with a radius based on poiDistance
      const center = tripDays[0].location;
      const lat = parseFloat(center.lat);
      const lng = parseFloat(center.lng);

      // Convert distance to approximate degrees
      const bufferDegrees = distance / 111;

      return `${lat - bufferDegrees},${lng - bufferDegrees},${lat + bufferDegrees},${lng + bufferDegrees}`;
    }

    // Default to a small area in Romania
    return '45.0,25.0,45.5,25.5';
  };

  // Helper function to transform an Overpass element to our POI format
  const transformOverpassElementToPoi = (element) => {
    try {
      const tags = element.tags || {};

      // Determine the POI type
      let type = 'Unknown';
      if (tags.tourism) type = tags.tourism;
      else if (tags.historic) type = tags.historic;
      else if (tags.natural) type = tags.natural;
      else if (tags.leisure) type = tags.leisure;

      // Get the name
      const name = tags.name || tags['name:en'] || `${type} (Unnamed)`;

      // Get the location - handle different coordinate formats
      let lat, lng;

      if (typeof element.lat === 'number' && typeof element.lon === 'number') {
        // Node element
        lat = element.lat;
        lng = element.lon;
      } else if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
        // Way or relation with center
        lat = element.center.lat;
        lng = element.center.lon;
      } else {
        // No valid coordinates
        console.warn(`Skipping POI with invalid coordinates: '${name}'`);
        return null;
      }

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`Skipping POI with out-of-range coordinates: '${name}' (${lat}, ${lng})`);
        return null;
      }

      // Create a locality string from address components
      let locality = '';
      if (tags.address) {
        const address = tags.address;
        const parts = [];
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);

        if (address.county) parts.push(address.county);
        if (address.state) parts.push(address.state);

        locality = parts.join(', ');
      } else if (tags.city || tags.town || tags.village) {
        locality = tags.city || tags.town || tags.village;
      } else {
        locality = 'Unknown location';
      }

      return {
        id: `${element.type}-${element.id}`,
        name,
        type,
        lat,
        lng,
        locality,
        description: tags.description || '',
        selected: false, // Default to not selected
        tags // Keep the original tags for reference
      };
    } catch (error) {
      console.error(`Error processing POI: ${error.message}`, element);
      return null;
    }
  };

  // Generate a PDF with trip details and a map snapshot
  const generatePDF = async () => {
    try {
      // Show loading message
      Swal.fire({
        title: 'Creating PDF',
        text: 'Capturing map and generating your trip layout...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Function to remove diacritics
      const removeDiacritics = (text) => {
        if (!text) return '';
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/ș|ş/g, 's')
          .replace(/ț|ţ/g, 't')
          .replace(/ă/g, 'a')
          .replace(/â/g, 'a')
          .replace(/î/g, 'i');
      };

      // Get all selected POIs
      let selectedPOIs = pointsOfInterest.filter(poi => poi.selected);

      // Intelligent Route Sorting: Order POIs by their position along the route path
      if (routeCoordinates && routeCoordinates.length > 0) {
        // Helper to find the index of the closest point on the route
        const getRouteIndex = (lat, lng) => {
          let minDistance = Infinity;
          let closestIndex = -1;
          // Sampling for performance (check every ~1km roughly if route is huge)
          const step = Math.max(1, Math.floor(routeCoordinates.length / 500));

          for (let i = 0; i < routeCoordinates.length; i += step) {
            // routeCoordinates are [lat, lng]
            const rLat = routeCoordinates[i][0];
            const rLng = routeCoordinates[i][1];
            const distSq = (lat - rLat) ** 2 + (lng - rLng) ** 2;

            if (distSq < minDistance) {
              minDistance = distSq;
              closestIndex = i;
            }
          }
          return closestIndex;
        };

        // Map POIs to their route index and sort
        const poisWithIndices = selectedPOIs.map(poi => ({
          ...poi,
          _routeIndex: getRouteIndex(poi.lat, poi.lng)
        }));

        poisWithIndices.sort((a, b) => a._routeIndex - b._routeIndex);
        selectedPOIs = poisWithIndices;
      }

      // Instead of modifying the state which affects the rendered map,
      // we'll create a temporary map for the PDF capture
      const mapElement = document.querySelector('.leaflet-container');

      if (!mapElement) {
        console.error('Map element not found');
        Swal.fire('Error', 'Could not capture the map. Please try again.', 'error');
        return;
      }

      // Store original map state
      const mapInstance = mapRef.current;
      if (!mapInstance) {
        console.error('Map instance not found');
        Swal.fire('Error', 'Could not capture the map. Please try again.', 'error');
        return;
      }

      // Create bounds that include the route and selected POIs
      const bounds = L.latLngBounds();

      // Add route points to bounds
      if (routeCoordinates && routeCoordinates.length > 0) {
        routeCoordinates.forEach(coord => {
          bounds.extend([coord[0], coord[1]]);
        });
      }

      // Add selected POIs to bounds
      selectedPOIs.forEach(poi => {
        bounds.extend([poi.lat, poi.lng]);
      });

      // Add trip days to bounds
      tripDays.forEach(day => {
        if (day?.location) {
          bounds.extend([day.location.lat, day.location.lng]);
        }
      });

      // Fit the map to these bounds with padding
      mapInstance.fitBounds(bounds, { padding: [50, 50] });

      // Wait for the map to finish rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Hide non-selected POI markers before capture
      const poiMarkers = document.querySelectorAll('.leaflet-marker-icon');
      const hiddenMarkers = [];

      poiMarkers.forEach(marker => {
        // Skip route markers (start/end)
        if (marker.src && marker.src.includes('marker-icon-2x-green.png')) {
          // This is likely a selected POI or route marker, keep it visible
          return;
        }

        // Check if this is a non-selected POI marker (red markers)
        if (marker.src && marker.src.includes('marker-icon-2x-red.png')) {
          hiddenMarkers.push(marker);
          marker.style.display = 'none';
        }
      });

      // Capture the map as canvas
      const mapCanvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        scale: 1
      });

      // Restore hidden markers
      hiddenMarkers.forEach(marker => {
        marker.style.display = '';
      });

      // Create new PDF document
      const doc = new jsPDF();

      // Add title and header
      doc.setFontSize(22);
      doc.setTextColor(0, 51, 102);
      doc.text(removeDiacritics('Trip Itinerary'), 105, 15, { align: 'center' });

      // Add date and basic info
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

      // Add map image
      const imgWidth = 180;
      const imgHeight = (mapCanvas.height * imgWidth) / mapCanvas.width;
      doc.addImage(mapCanvas.toDataURL('image/jpeg', 0.8), 'JPEG', 15, 25, imgWidth, imgHeight);

      // Add trip summary section
      let yPosition = 25 + imgHeight + 10; // Start after the map

      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102);
      doc.text('Trip Summary', 14, yPosition);
      yPosition += 2;

      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      let totalDistance = 0;
      let totalDuration = 0;
      let startPoint = null;
      let endPoint = null;

      if (tripDays.length > 0) {
        startPoint = tripDays[0];
        doc.text(`Start Point: ${removeDiacritics(tripDays[0]?.location?.name || 'Custom Location')}`, 14, yPosition);
        yPosition += 7;

        if (tripDays.length > 1) {
          endPoint = tripDays[tripDays.length - 1];
          doc.text(`Destination: ${removeDiacritics(tripDays[tripDays.length - 1]?.location?.name || 'Custom Location')}`, 14, yPosition);
          yPosition += 7;

          // Calculate estimated driving time if we have route details
          if (routeDetails && routeDetails.distance && routeDetails.duration) {
            totalDistance = routeDetails.distance;
            totalDuration = routeDetails.duration;
            doc.text(`Total Distance: ${totalDistance.toFixed(1)} km`, 14, yPosition);
            yPosition += 7;
            doc.text(`Estimated Total Driving Time: ${Math.floor(totalDuration / 60)}h ${Math.round(totalDuration % 60)}m`, 14, yPosition);
            yPosition += 7;
            doc.text(`Points of Interest: ${selectedPOIs.length}`, 14, yPosition);
            yPosition += 7;

            // Add transportation mode
            doc.text(`Transportation Mode: ${transportMode.charAt(0).toUpperCase() + transportMode.slice(1)}`, 14, yPosition);
            yPosition += 15;
          }
        }
      }

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Add selected points of interest with coordinates and driving instructions
      if (selectedPOIs.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text(removeDiacritics('Detailed Itinerary'), 14, yPosition);
        yPosition += 2;

        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(14, yPosition, 196, yPosition);
        yPosition += 8;

        let prevPoint = startPoint ? {
          lat: startPoint.location?.lat,
          lng: startPoint.location?.lng,
          name: startPoint.location?.name
        } : null;

        // Add start point as first item in itinerary
        if (prevPoint) {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'bold');
          doc.text(`Start: ${removeDiacritics(prevPoint.name || 'Starting Point')}`, 14, yPosition);
          doc.setFont(undefined, 'normal');
          yPosition += 6;

          doc.setFontSize(10);
          doc.text(`Coordinates: ${prevPoint.lat.toFixed(6)}, ${prevPoint.lng.toFixed(6)}`, 20, yPosition);
          yPosition += 9;
        }

        // Add each POI
        selectedPOIs.forEach((poi, index) => {
          // Calculate distance and time from previous point
          let segmentInfo = '';
          if (prevPoint) {
            // Rough distance calculation using Haversine formula
            const distance = calculateDistance(prevPoint.lat, prevPoint.lng, poi.lat, poi.lng);
            // Rough time estimation (assuming 60 km/h average speed)
            const timeMinutes = Math.round(distance * 60 / 60);

            if (index === 0) {
              segmentInfo = `Driving from Start: ~${distance.toFixed(1)} km (approx. ${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m)`;
            } else {
              segmentInfo = `Driving from previous: ~${distance.toFixed(1)} km (approx. ${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m)`;
            }
          }

          prevPoint = poi;

          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          // Add POI number and name
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'bold');
          doc.text(`Stop ${index + 1}: ${removeDiacritics(poi.name || 'Unnamed Location')}`, 14, yPosition);
          doc.setFont(undefined, 'normal');
          yPosition += 6;

          // Add POI details
          doc.setFontSize(10);
          doc.text(`Type: ${removeDiacritics(poi.type || 'N/A')}`, 20, yPosition);
          yPosition += 6;
          doc.text(`Coordinates: ${poi.lat.toFixed(6)}, ${poi.lng.toFixed(6)}`, 20, yPosition);
          yPosition += 6;
          doc.text(`Location: ${removeDiacritics(poi.locality || 'Location not available')}`, 20, yPosition);
          yPosition += 6;

          // Add driving info
          if (segmentInfo) {
            doc.setTextColor(0, 102, 204);
            doc.text(segmentInfo, 20, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 6;
          }

          // Add description if available
          if (poi.description) {
            const description = removeDiacritics(poi.description);
            doc.text('Description:', 20, yPosition);
            yPosition += 6;

            // Handle multi-line descriptions
            const splitDescription = doc.splitTextToSize(description, 170);
            doc.text(splitDescription, 30, yPosition);

            // Adjust position based on description length
            yPosition += splitDescription.length * 5;
          }

          yPosition += 6;

          // Add recommended visit duration if available
          if (poi.visitDuration) {
            doc.text(`Recommended visit: ${poi.visitDuration} minutes`, 20, yPosition);
            yPosition += 6;
          }

          // Add separator line between POIs
          if (index < selectedPOIs.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(14, yPosition, 196, yPosition);
            yPosition += 8;
          }
        });

        // Add final destination after all POIs
        if (endPoint && endPoint !== startPoint) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          // Calculate distance and time from last POI to destination
          let finalSegmentInfo = '';
          if (prevPoint) {
            const distance = calculateDistance(
              prevPoint.lat,
              prevPoint.lng,
              endPoint.location.lat,
              endPoint.location.lng
            );
            const timeMinutes = Math.round(distance * 60 / 60);
            finalSegmentInfo = `Final drive to destination: ~${distance.toFixed(1)} km (approx. ${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m)`;
          }

          // Add separator line
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.2);
          doc.line(14, yPosition, 196, yPosition);
          yPosition += 8;

          // Add destination details
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`Destination: ${removeDiacritics(endPoint.location.name || 'Final Destination')}`, 14, yPosition);
          doc.setFont(undefined, 'normal');
          yPosition += 6;

          doc.setFontSize(10);
          doc.text(`Coordinates: ${endPoint.location.lat.toFixed(6)}, ${endPoint.location.lng.toFixed(6)}`, 20, yPosition);
          yPosition += 6;

          if (finalSegmentInfo) {
            doc.setTextColor(0, 102, 204);
            doc.text(finalSegmentInfo, 20, yPosition);
            doc.setTextColor(0, 0, 0);
          }
        }

        // Add practical information page
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(0, 51, 102);
        doc.text('Practical Information', 105, 15, { align: 'center' });

        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.5);
        doc.line(14, 17, 196, 17);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        // Travel tips section
        doc.setFont(undefined, 'bold');
        doc.text('Travel Tips:', 14, 30);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('• Check opening hours and admission fees before visiting attractions', 20, 38);
        doc.text('• Consider local weather conditions and dress appropriately', 20, 46);
        doc.text('• Keep emergency contacts and important documents accessible', 20, 54);
        doc.text('• Download offline maps for areas with limited connectivity', 20, 62);
        doc.text('• Respect local customs and traditions', 20, 70);

        // Driving tips section
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Driving Information:', 14, 85);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('• Driving times are estimates and may vary based on traffic and road conditions', 20, 93);
        doc.text('• Take regular breaks during long drives (recommended every 2 hours)', 20, 101);
        doc.text('• Keep a safe distance from other vehicles', 20, 109);
        doc.text('• Have emergency numbers and roadside assistance contacts available', 20, 117);
        doc.text('• Check fuel levels regularly and know where gas stations are located', 20, 125);

        // Local information section
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Local Information:', 14, 140);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('• Emergency number: 112', 20, 148);
        doc.text('• Local currency: Romanian Leu (RON)', 20, 156);
        doc.text('• Languages: Romanian (official), English and German widely spoken in tourist areas', 20, 164);
        doc.text('• Time zone: Eastern European Time (EET/EEST)', 20, 172);
        doc.text('• Electricity: 230V, Type F plugs (European standard)', 20, 180);
      } else {
        doc.setFontSize(12);
        doc.text('No points of interest selected.', 14, 70);

        // Add notes section
        doc.setFontSize(14);
        doc.text('Trip Notes', 14, 85);
        doc.setFontSize(12);
        doc.text('• Remember to check opening hours before visiting.', 14, 95);
        doc.text('• Consider weather conditions for your trip.', 14, 105);
      }

      // Close the loading dialog
      Swal.close();

      // Save the PDF
      doc.save('romania-trip-itinerary.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire('Error', 'Could not generate the PDF. Please try again.', 'error');
    }
  };

  // Helper function to check if a POI is in the selected categories
  const isPoiInSelectedCategories = (element) => {
    // Include all POIs by default
    const tags = element.tags || {};

    // Basic filtering - only include elements with meaningful tags
    return !!(tags.tourism || tags.historic || tags.natural || tags.leisure);
  };

  // Add this function to handle adding POIs to the trip
  const handleAddPoiToTrip = (poi) => {
    // Create a new trip day entry for this POI
    const newPoiDay = {
      id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: null, // No specific date for POIs
      location: {
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        address: poi.locality || 'Unknown location'
      },
      notes: poi.description || `Visit this ${poi.type}`,
      type: 'poi', // Mark as POI type
      poiDetails: poi // Store the original POI data
    };

    // Add to trip days
    setTripDays(prevDays => [...prevDays, newPoiDay]);

    // Mark this POI as added to trip
    setPointsOfInterest(prevPois =>
      prevPois.map(p =>
        p.id === poi.id ? { ...p, addedToTrip: true } : p
      )
    );

    // Show success message
    Swal.fire({
      title: 'Added to Trip',
      text: `${poi.name} has been added to your trip`,
      icon: 'success',
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  // Add this state for POI filters
  const [poiFilters, setPoiFilters] = useState({
    'Tourism & Attractions': false,
    'Natural Attractions': false,
    'Cultural & Historical Sites': false,
    'Recreational & Leisure': false,
    'Entertainment & Nightlife': false,
    'Sports & Outdoor Activities': false
  });

  // Add this function to categorize POIs
  const categorizePOI = (poiType) => {
    const typeMap = {
      // Tourism & Attractions
      'attraction': 'Tourism & Attractions',
      'museum': 'Tourism & Attractions',
      'gallery': 'Tourism & Attractions',
      'viewpoint': 'Tourism & Attractions',
      'artwork': 'Tourism & Attractions',

      // Natural Attractions
      'beach': 'Natural Attractions',
      'peak': 'Natural Attractions',
      'waterfall': 'Natural Attractions',
      'lake': 'Natural Attractions',
      'river': 'Natural Attractions',
      'cave': 'Natural Attractions',
      'forest': 'Natural Attractions',
      'nature_reserve': 'Natural Attractions',

      // Cultural & Historical Sites
      'castle': 'Cultural & Historical Sites',
      'monument': 'Cultural & Historical Sites',
      'ruins': 'Cultural & Historical Sites',
      'archaeological_site': 'Cultural & Historical Sites',
      'historic': 'Cultural & Historical Sites',
      'memorial': 'Cultural & Historical Sites',
      'church': 'Cultural & Historical Sites',
      'cathedral': 'Cultural & Historical Sites',
      'monastery': 'Cultural & Historical Sites',

      // Recreational & Leisure
      'park': 'Recreational & Leisure',
      'garden': 'Recreational & Leisure',
      'zoo': 'Recreational & Leisure',
      'aquarium': 'Recreational & Leisure',
      'theme_park': 'Recreational & Leisure',
      'spa': 'Recreational & Leisure',

      // Entertainment & Nightlife
      'theatre': 'Entertainment & Nightlife',
      'cinema': 'Entertainment & Nightlife',
      'casino': 'Entertainment & Nightlife',
      'nightclub': 'Entertainment & Nightlife',
      'bar': 'Entertainment & Nightlife',
      'restaurant': 'Entertainment & Nightlife',

      // Sports & Outdoor Activities
      'stadium': 'Sports & Outdoor Activities',
      'sports_centre': 'Sports & Outdoor Activities',
      'golf_course': 'Sports & Outdoor Activities',
      'water_park': 'Sports & Outdoor Activities',
      'swimming_pool': 'Sports & Outdoor Activities',
      'hiking': 'Sports & Outdoor Activities',
      'climbing': 'Sports & Outdoor Activities'
    };

    return typeMap[poiType] || 'Tourism & Attractions'; // Default category
  };

  // Add this function to filter POIs based on selected filters
  const getFilteredPOIs = useCallback(() => {
    // If no filters are selected, show all POIs
    const anyFilterSelected = Object.values(poiFilters).some(value => value);

    if (!anyFilterSelected) {
      return pointsOfInterest.filter(poi => poi.name && poi.name !== 'Unnamed');
    }

    // Otherwise, filter based on selected categories
    return pointsOfInterest.filter(poi => {
      // Skip unnamed POIs
      if (!poi.name || poi.name === 'Unnamed') return false;

      // Get the category for this POI
      const category = categorizePOI(poi.type);

      // Include if its category is selected
      return poiFilters[category];
    });
  }, [pointsOfInterest, poiFilters]);

  // Add this function to toggle POI selection
  const togglePOISelection = (poiId) => {
    setPointsOfInterest(prevPois =>
      prevPois.map(poi =>
        poi.id === poiId
          ? { ...poi, selected: !poi.selected }
          : poi
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section - Welcoming Tourist Guide */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3 shadow-lg">
              <MapPinIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plan Your Adventure</h1>
              <p className="text-gray-500">Discover amazing places along your route</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`flex items-center gap-2 ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>1</div>
              <span className="text-sm font-medium hidden sm:inline">Add Stops</span>
            </div>
            <div className={`flex-1 h-1 rounded ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${routeCoordinates.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${routeCoordinates.length > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>2</div>
              <span className="text-sm font-medium hidden sm:inline">Find Attractions</span>
            </div>
            <div className={`flex-1 h-1 rounded ${pointsOfInterest.filter(p => p.selected).length > 0 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${pointsOfInterest.filter(p => p.selected).length > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${pointsOfInterest.filter(p => p.selected).length > 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}>3</div>
              <span className="text-sm font-medium hidden sm:inline">Pick Favorites</span>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-auto">
          {/* Left Panel: Sidebar - Clean Tourist-Friendly Design */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4 h-auto pr-2">

            {/* Step 1: Add Your Destinations */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow">1</span>
                  <div>
                    <h2 className="text-white font-bold text-lg">Add Your Stops</h2>
                    <p className="text-blue-100 text-xs">Where do you want to go?</p>
                  </div>
                </div>
              </div>

              <div className="p-5 min-h-[130px]">
                {/* Search Input */}
                <div className="relative mb-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search city, landmark, or address..."
                      className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    />
                    {isSearching && (
                      <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-64 overflow-auto" style={{ zIndex: 9999 }}>
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(result)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-50 last:border-0 flex items-center gap-3"
                        >
                          <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700">{result.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination List */}
                {tripDays.filter(d => d.type !== 'poi' && d.location).length > 0 && (
                  <div className="space-y-2">
                    {tripDays.filter(d => d.type !== 'poi' && d.location).map((day, index) => (
                      <div
                        key={day.id || index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group"
                      >
                        <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">{day.location?.name || 'Unknown Location'}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {day.location?.city || day.location?.country || 'Added location'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openInGoogleMaps(day)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="View in Maps"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveDay(day.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Remove"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Route Visualization Line */}
                    {tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-2 px-3">
                        <div className="flex-1 border-t border-dashed border-gray-300"></div>
                        <span>Route</span>
                        <div className="flex-1 border-t border-dashed border-gray-300"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 && (
                  <div className="mt-4 space-y-2">
                    {tripDays.filter(d => d.type !== 'poi' && d.location).length > 2 && (
                      <button
                        onClick={optimizeTripOrder}
                        className="w-full px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-100 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Optimize Route Order
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Generate Your Plan */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className={`px-5 py-4 ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 ? 'bg-white text-green-600' : 'bg-gray-300 text-gray-500'}`}>2</span>
                  <div>
                    <h2 className={`font-bold text-lg ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 ? 'text-white' : 'text-gray-500'}`}>Find Attractions</h2>
                    <p className={`text-xs ${tripDays.filter(d => d.type !== 'poi' && d.location).length >= 2 ? 'text-green-100' : 'text-gray-400'}`}>Get route recommendations or discover places</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Route Recommendation Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-800">AI Route Suggestions</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Get AI-powered itinerary recommendations based on your starting point</p>

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Routes:</span>
                      <select
                        value={numRoutesToRecommend}
                        onChange={(e) => setNumRoutesToRecommend(parseInt(e.target.value))}
                        className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={returnToStart}
                        onChange={(e) => setReturnToStart(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-gray-600">Return to start</span>
                    </label>
                  </div>

                  <button
                    onClick={recommendRoutes}
                    disabled={isRecommending || tripDays.filter(d => d.type !== 'poi' && d.location).length < 1}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {isRecommending ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-4 w-4" />
                        Generating routes...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        Recommend {numRoutesToRecommend} Route{numRoutesToRecommend > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>

                {/* Recommended Routes Display */}
                {recommendedRoutes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Click a route to apply:</p>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {recommendedRoutes.map((route, idx) => (
                        <div
                          key={idx}
                          onClick={() => applyRecommendedRoute(route.stops)}
                          className="bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer p-3 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-800">{route.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{route.stops.length} stops • {route.stops.join(' → ')}</p>
                            </div>
                            <span className="text-indigo-600 text-xs font-medium">Apply</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span>or discover attractions on your route</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Discover Attractions Button */}
                <button
                  onClick={generatePlan}
                  disabled={tripDays.filter(d => d.type !== 'poi' && d.location).length < 2 || isGeneratingPlan}
                  className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:shadow-none transition-all"
                >
                  {isGeneratingPlan ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Finding attractions...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Discover Attractions
                    </>
                  )}
                </button>

                {tripDays.filter(d => d.type !== 'poi' && d.location).length < 2 && (
                  <p className="text-center text-xs text-gray-400">
                    Add at least 2 destinations to discover attractions
                  </p>
                )}
              </div>
            </div>

            {/* Filters (Expanded by default) */}
            <details className="bg-white rounded-xl shadow-lg overflow-hidden group" open>
              <summary className="px-5 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-700">Filters</span>
                </div>
                <span className="text-xs text-gray-400 group-open:hidden">Click to expand</span>
              </summary>

              <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                {/* Trip Duration */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trip Duration</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={tripDuration}
                      onChange={(e) => setTripDuration(parseInt(e.target.value) || 1)}
                      className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'culture', label: '🎭 Culture', icon: '🎭' },
                      { key: 'nature', label: '🌲 Nature', icon: '🌲' },
                      { key: 'history', label: '🏛️ History', icon: '🏛️' },
                      { key: 'adventure', label: '🏔️ Adventure', icon: '🏔️' },
                      { key: 'food', label: '🍽️ Food', icon: '🍽️' },
                      { key: 'art', label: '🎨 Art', icon: '🎨' },
                    ].map((interest) => (
                      <button
                        key={interest.key}
                        onClick={() => {
                          setInterests(prev => ({
                            ...prev,
                            [interest.key]: !prev[interest.key]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${interests[interest.key]
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {interest.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport Mode */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transport Mode</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['driving', 'walking', 'cycling'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => { setTransportMode(mode); if (mode === 'driving') setHasCar(true); }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${transportMode === mode
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {mode === 'driving' ? '🚗' : mode === 'walking' ? '🚶' : '🚴'} {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Radius */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search Radius</h3>
                  <div className="flex gap-2">
                    {[5, 10, 25, 50].map(dist => (
                      <button
                        key={dist}
                        onClick={() => setPoiDistance(dist)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${poiDistance === dist
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {dist} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Assistant Toggle */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">AI-Powered Suggestions</span>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors ${isUsingAiForPoi ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={isUsingAiForPoi}
                        onChange={() => setIsUsingAiForPoi(!isUsingAiForPoi)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${isUsingAiForPoi ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                    </div>
                  </label>
                </div>
              </div>
            </details>

          </div>

          {/* Center Panel: Map */}
          <div className="lg:col-span-8 xl:col-span-9 lg:h-[1000px] h-[300px]">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full relative">
              <div className="relative h-full">
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() => setIsMapClickMode(!isMapClickMode)}
                    className={`p-2 rounded-lg shadow-md ${isMapClickMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    title={isMapClickMode ? 'Cancel adding location' : 'Click on map to add location'}
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={findPOIsInMapBounds}
                    className="p-2 bg-white text-gray-700 rounded-lg shadow-md hover:bg-gray-50"
                    title="Find points of interest in current map view"
                    disabled={isSearching}
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </div>
                {isMapClickMode && (
                  <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md">
                    <p className="text-sm font-medium">Click anywhere on the map to add a location</p>
                  </div>
                )}

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 z-10 bg-white/95 p-3 rounded-lg shadow-md text-xs space-y-1.5">
                  <p className="font-semibold text-gray-700 mb-2">Legend</p>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600">Your destinations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600">Attractions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600">Selected POIs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-gray-600">Accommodations</span>
                  </div>
                </div>

                <div className="map-container" style={{ height: "100%", width: "100%" }}>
                  <MapContainer
                    center={[45.9443, 25.0094]} // Center of Romania
                    zoom={7}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Map controller to fit bounds */}
                    {tripDays.length > 0 && (
                      <MapController
                        locations={tripDays.map(day => day.location)}
                      />
                    )}

                    {/* Map click handler */}
                    <MapEvents onClick={handleMapClick} />

                    {/* Display route */}
                    {routeCoordinates.length > 0 && (
                      <Polyline
                        positions={routeCoordinates}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.7}
                      />
                    )}

                    {/* Display POI routes */}
                    {poiRoutes.map((route, index) => (
                      <Polyline
                        key={`route-${route.poiId}-${index}`}
                        positions={route.coordinates}
                        color="#EF4444"
                        weight={3}
                        opacity={0.6}
                        dashArray="5, 10"
                      />
                    ))}

                    {/* Display Search Points */}
                    {sampledSearchPoints.map((point, index) => (
                      <CircleMarker
                        key={`search-point-${index}`}
                        center={[point[0], point[1]]}
                        radius={8}
                        fillColor="#3B82F6"
                        fillOpacity={0.6}
                        color="#2563EB"
                        weight={2}
                      >
                        <Popup>
                          <div className="text-sm">
                            Search Point {index + 1}
                            <p className="text-xs text-gray-500 mt-1">
                              Looking for attractions near this point
                            </p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* Display POIs - Safe Render */}
                    {pointsOfInterest && pointsOfInterest.map((poi) => {
                      if (!poi || !poi.lat || !poi.lng) return null;
                      // Use orange for overnight stops, green for selected, red for regular POIs
                      const markerColor = poi.isOvernightStop
                        ? '#f97316' // Orange for accommodation
                        : (poi.selected ? 'green' : 'red');
                      return (
                        <Marker
                          key={poi.id || Math.random()}
                          position={[poi.lat, poi.lng]}
                          icon={createCustomIcon(markerColor)}
                          className="poi-marker"
                          eventHandlers={{
                            click: () => togglePOISelection(poi.id)
                          }}
                        >
                          <Popup>
                            <div className="space-y-2">
                              <h3 className="font-medium flex items-center gap-2">
                                {poi.name || 'Unknown Place'}
                                {poi.isOvernightStop && (
                                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                                    🏨 Overnight Stop
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 capitalize">{poi.type}</p>
                              {poi.description && (
                                <p className="text-xs text-gray-500">{poi.description}</p>
                              )}
                              {poi.isOvernightStop && (
                                <p className="text-xs text-orange-600 font-medium">
                                  Recommended stop for the night
                                </p>
                              )}
                              <button
                                onClick={() => togglePOISelection(poi.id)}
                                className={`px-2 py-1 text-xs rounded ${poi.selected
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                              >
                                {poi.selected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Display Trip Days */}
                    {tripDays
                      .filter(day => day && day.location && day.location.lat && day.location.lng)
                      .map((day, index) => (
                        <Marker
                          key={day.id || index}
                          position={[day.location.lat, day.location.lng]}
                          icon={createCustomIcon('#3b82f6')}
                        >
                          <Popup>
                            <div className="space-y-2">
                              <h3 className="font-medium flex items-center">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                                  Day {index + 1}
                                </span>
                                {day.location?.name || 'Unknown Location'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {day.location?.city && day.location?.country
                                  ? `${day.location.city}, ${day.location.country}`
                                  : day.location?.country || 'Location details not available'}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}

                    {/* Display Booking App Properties (Orange Markers) */}
                    {bookingAppProperties && bookingAppProperties.map((property) => {
                      if (!property || !property.lat || !property.lng) return null;
                      return (
                        <Marker
                          key={property.id}
                          position={[property.lat, property.lng]}
                          icon={createCustomIcon('#f97316')} // Orange for accommodations
                        >
                          <Popup>
                            <div className="space-y-2 min-w-[200px]">
                              <h3 className="font-medium flex items-center gap-2">
                                🏨 {property.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                                  StayHub Property
                                </span>
                                {property.starRating && (
                                  <span className="text-yellow-500 text-sm">
                                    {'⭐'.repeat(Math.min(property.starRating, 5))}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 capitalize">{property.propertyType || 'Accommodation'}</p>
                              <p className="text-xs text-gray-500">{property.locality}</p>
                              {property.description && (
                                <p className="text-xs text-gray-500">{property.description}</p>
                              )}
                              <button
                                onClick={() => window.open(`/properties/${property.propertyId}`, '_blank')}
                                className="w-full px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                              >
                                View & Book
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

        </div >

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 hidden">
          {/* This section is now hidden as we moved it to the right panel */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* All Points of Interest */}


          {/* Route Points of Interest */}
          {routePOIs.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg col-span-1 lg:col-span-3">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                Tourist Attractions Along Your Route
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Points of interest within {poiDistance}km of your route ({routePOIs.length} found)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {routePOIs.map((poi) => (
                  <div
                    key={poi.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${selectedPOI === poi.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${poi.selected ? 'border-green-500' : ''}`}
                    onClick={() => handlePOIClick(poi)}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg line-clamp-2">{poi.name}</h3>
                        <div className="flex space-x-1 ml-2 flex-shrink-0">
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

                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {poi.type || 'Point of Interest'}
                        </span>
                        {poi.isPopular && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                        {poi.distanceToRoute && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {poi.distanceToRoute.toFixed(1)}km
                          </span>
                        )}
                        {poi.locality && (
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {poi.locality}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3 flex-grow line-clamp-3">
                        {poi.description || `A ${poi.type || 'point of interest'} in ${poi.locality || 'this area'}.`}
                      </p>

                      <div className="flex justify-between items-center mt-auto pt-2 border-t">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle selection of this POI
                            setRoutePOIs(
                              routePOIs.map((p) =>
                                p.id === poi.id ? { ...p, selected: !p.selected } : p
                              )
                            );
                          }}
                          className={`px-3 py-1 text-sm rounded-full ${poi.selected
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {poi.selected ? 'Selected' : 'Add to Trip'}
                        </button>

                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openInGoogleMaps(poi);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
                          View in Maps
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points of Interest */}

        </div>
      </div >


      {/* Screen-wide Results Section Below Map */}
      {
        pointsOfInterest.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold flex items-center text-gray-800">
                <MapPinIcon className="h-7 w-7 mr-3 text-blue-600" />
                Found Points of Interest ({pointsOfInterest.length})
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={recommendBestPOIs}
                  disabled={isRecommending}
                  className="flex items-center space-x-2 text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold transition-colors shadow-sm"
                >
                  {isRecommending ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                  <span>AI Top Picks</span>
                </button>

                <button
                  onClick={generatePDF}
                  className="flex items-center space-x-2 text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold transition-colors shadow-sm"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>PDF Plan</span>
                </button>

                <button
                  onClick={() => {
                    const allSelected = pointsOfInterest.every(p => p.selected);
                    setPointsOfInterest(pointsOfInterest.map(p => ({ ...p, selected: !allSelected })));
                  }}
                  className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                >
                  {pointsOfInterest.every(p => p.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pointsOfInterest.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => handlePOIClick(poi)}
                  className={`bg-white border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group ${poi.selected ? 'ring-2 ring-green-500 border-green-500 bg-green-50/10' : 'border-gray-200'
                    }`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={poi?.name}>{poi?.name || 'Unnamed'}</h3>
                      <span className={`flex-shrink-0 ml-2 px-2 py-1 text-xs rounded-full font-medium ${poi?.type === 'restaurant' ? 'bg-orange-100 text-orange-800' :
                        poi?.type === 'hotel' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                        {poi?.type || 'POI'}
                      </span>
                    </div>

                    {poi?.locality && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{poi.locality}</span>
                      </div>
                    )}

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5em]">
                      {poi?.description || `Discover ${poi?.name} in ${poi?.locality || 'this area'}.`}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openInGoogleMaps(poi);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1" />
                        Map
                      </a>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPointsOfInterest(
                            pointsOfInterest.map((p) =>
                              p.id === poi.id ? { ...p, selected: !p.selected } : p
                            )
                          );
                        }}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${poi.selected
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {poi.selected ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Add Select All button for POIs */}


      {/* Add this after the POI section */}
      {
        pointsOfInterest.filter(poi => poi.selected).length > 0 && (
          <div className="container mx-auto px-4 mt-6 mb-10 text-center">
            <button
              onClick={generatePDF}
              className="mx-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Trip Layout
            </button>

            {!isGeneratingPlan && (
              <button
                onClick={() => {
                  setIsGeneratingPlan(true);
                  generatePlan().then(() => {
                    // Hide the button after generating
                    setIsGeneratingPlan(false);
                  });
                }}
                className="mx-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Again
              </button>
            )}
          </div>
        )
      }
    </div >
  );
};

export default Planning;