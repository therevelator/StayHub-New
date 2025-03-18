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
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../../services/api';
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
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
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
  const [isUsingAiForPoi, setIsUsingAiForPoi] = useState(false);
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [isProcessingAiPoi, setIsProcessingAiPoi] = useState(false);
  // Use the API key from localStorage or environment variable, but don't hardcode it
  const [openAIApiKey, setOpenAIApiKey] = useState(localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY || '');

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

  // Overpass API endpoints with fallback
  const OVERPASS_ENDPOINTS = [
    'http://localhost:8080/api/interpreter', // Local Docker instance
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
  ];

  // Make request with fallback to different endpoints
  const makeOverpassRequest = async (query) => {
    let lastError;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await axios.post(endpoint, query, {
          timeout: 10000, // 10 second timeout
        });
        return response.data;
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error.message);
        lastError = error;
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
      const locations = tripDays.map((day) => ({
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
    
    // Ensure we have valid coordinates
    if (item.lat && item.lng) {
      // It's a POI with direct coordinates
      // Ensure coordinates are numbers
      const lat = typeof item.lat === 'number' ? item.lat : parseFloat(item.lat);
      const lng = typeof item.lng === 'number' ? item.lng : parseFloat(item.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      } else {
        // Fallback to name-based search if coordinates are invalid
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name || 'Unknown location')}`;
      }
    } else if (item.location && item.location.lat && item.location.lng) {
      // It's a location object
      // Ensure coordinates are numbers
      const lat = typeof item.location.lat === 'number' ? item.location.lat : parseFloat(item.location.lat);
      const lng = typeof item.location.lng === 'number' ? item.location.lng : parseFloat(item.location.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      } else {
        // Fallback to name-based search if coordinates are invalid
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location.name || 'Unknown location')}`;
      }
    } else {
      // Fallback to name-based search
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        item.name || item.location?.name || 'Unknown location'
      )}`;
    }
    window.open(url, '_blank');
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

  // Find points of interest using OpenAI
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

      // Check if we have an OpenAI API key
      if (!openAIApiKey) {
        console.warn('No OpenAI API key available');
        Swal.fire({
          title: 'OpenAI API Key Required',
          text: 'Please enter your OpenAI API key in the settings to use AI-generated points of interest.',
          icon: 'warning',
          input: 'password',
          inputPlaceholder: 'Enter your OpenAI API key',
          showCancelButton: true,
          confirmButtonText: 'Save',
          cancelButtonText: 'Cancel',
          preConfirm: (key) => {
            if (!key) {
              Swal.showValidationMessage('Please enter a valid API key');
              return false;
            }
            return key;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const key = result.value;
            setOpenAIApiKey(key);
            localStorage.setItem('openai_api_key', key);
            // Retry the function
            findPointsOfInterestWithAI(routeCoordinates).then(resolve).catch(reject);
          } else {
            // Fall back to traditional search
            findPointsOfInterestTraditional(routeCoordinates).then(resolve).catch(reject);
          }
        });
        return;
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
        const locations = tripDays.map((day) => ({
          name: day.location.name,
          lat: day.location.lat,
          lng: day.location.lng,
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

        // Create an interests string
        const interests = Object.values(filtersByCategory)
          .flat()
          .join(', ');

        const prompt = `
          I'm planning a trip with the following destinations: 
          ${locations
            .map((loc, i) => `${i + 1}. ${loc.name} (${loc.lat}, ${loc.lng})`)
            .join('\n')}
          
          I'm traveling by ${transportMode}.
          
          ${interests ? `I'm interested in: ${interests}` : ''}
          ${selectedInterest ? `My main interest is: ${selectedInterest}` : ''}
          ${Object.entries(tripStyle)
            .filter(([_, isSelected]) => isSelected)
            .map(([style]) => style)
            .join(', ') ? `My trip style is: ${Object.entries(tripStyle)
              .filter(([_, isSelected]) => isSelected)
              .map(([style]) => style)
              .join(', ')}` : ''}
          
          Please suggest 10-15 interesting points of interest along or near this route that match my interests.
          IMPORTANT: Only include places that are within ${poiDistance} km of the route I'll be traveling.
          
          For each point of interest, provide:
          1. Name
          2. Type (museum, park, historic site, etc.)
          3. Precise latitude and longitude
          4. A brief description (1-2 sentences)
          5. Locality (city or town name)
          
          Format your response as a JSON array with objects containing these fields:
          [{"name": "...", "type": "...", "lat": 00.000000, "lng": 00.000000, "description": "...", "locality": "..."}]
          
          Make sure all points are real places that actually exist, with accurate coordinates, and are within ${poiDistance} km of my route. RETURN ONLY JSON.
        `;

        console.log('Sending request to OpenAI with prompt:', prompt);

        try {
          // Call OpenAI API with a timeout
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: 'You are a travel expert that provides points of interest along routes. Always respond with valid JSON only.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 4000,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
              response_format: { type: 'json_object' }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIApiKey}`,
                'OpenAI-Beta': 'assistants=v1'
              },
              timeout: 25000 // 25 second timeout for the API call
            }
          );

          // Clear the timeout since we got a response
          clearTimeout(poiTimeout);

          // Parse the response
          if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
            console.error('Unexpected OpenAI API response format:', response.data);
            throw new Error('Unexpected response format from OpenAI API');
          }
          
          const responseText = response.data.choices[0].message.content;
          console.log('Received response from OpenAI:', responseText);

          // Extract JSON from the response
          let poisFromAi = [];

          try {
            // Parse the JSON response
            const parsedResponse = JSON.parse(responseText);
            poisFromAi = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse.pois || []);
            console.log('Successfully parsed JSON response');
          } catch (jsonError) {
            console.error('JSON parsing failed:', jsonError);
            reject(new Error(`Failed to parse OpenAI response: ${jsonError.message}`));
            return;
          }

          // Process and add IDs to POIs
          const processedPois = poisFromAi.map((poi) => {
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
              type: 'poi',
            };
          }).filter(poi => poi !== null); // Filter out null entries (invalid coordinates)

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
            text: `Added ${processedPois.length} points of interest to your trip`,
            icon: 'success',
          });

          resolve(processedPois);
        } catch (openaiError) {
          console.error('Error connecting to OpenAI:', openaiError);
          clearTimeout(poiTimeout);
          
          // Check if it's a rate limit error
          const isRateLimit = openaiError.response && openaiError.response.status === 429;
          
          if (isRateLimit) {
            console.log('OpenAI API rate limit reached, falling back to traditional search...');
            
            // Show a single notification about falling back
            Swal.fire({
              title: 'Using Traditional Search',
              text: 'OpenAI API rate limit reached. Using traditional search for points of interest instead.',
              icon: 'info',
              timer: 3000,
              timerProgressBar: true,
              showConfirmButton: false
            });
            
            // Directly use traditional search without trying the fallback prompt
            try {
              const traditionalPois = await findPointsOfInterestTraditional(routeCoordinates);
              resolve(traditionalPois);
              return;
            } catch (tradError) {
              console.error('Traditional search also failed:', tradError);
              reject(new Error('All POI search methods failed'));
              return;
            }
          }
          
          // If not a rate limit error, try the fallback prompt
          try {
            const fallbackPois = await tryFallbackPrompt(routeCoordinates);
            if (fallbackPois && fallbackPois.length > 0) {
              resolve(fallbackPois);
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            
            // If fallback failed due to rate limit, use traditional search
            if (fallbackError.message && fallbackError.message.includes('rate limit')) {
              console.log('Fallback hit rate limit, using traditional search...');
              
              try {
                const traditionalPois = await findPointsOfInterestTraditional(routeCoordinates);
                resolve(traditionalPois);
                return;
              } catch (tradError) {
                console.error('Traditional search also failed:', tradError);
                reject(new Error('All POI search methods failed'));
                return;
              }
            }
          }
          
          reject(new Error('Failed to connect to OpenAI API'));
        }
      } catch (error) {
        // Clear the timeout
        clearTimeout(poiTimeout);
        
        console.error('Error finding POIs with OpenAI:', error);
        reject(error);
      } finally {
        setIsProcessingAiPoi(false);
      }
    });
  };

  // Helper function to try a simplified prompt as fallback
  const tryFallbackPrompt = async (routeCoordinates) => {
    // Check if we have route coordinates
    if (!routeCoordinates || routeCoordinates.length === 0) {
      console.warn('No route coordinates available for fallback POI search');
      throw new Error('No route coordinates for fallback');
    }

    // Check if we have an OpenAI API key
    if (!openAIApiKey) {
      console.warn('No OpenAI API key available for fallback');
      throw new Error('No OpenAI API key for fallback');
    }

    console.log('Trying simplified prompt as fallback...');

    const simplifiedPrompt = `
      I need points of interest between ${tripDays[0].location.name} and ${tripDays[tripDays.length - 1].location.name}.
      Only include places that are within ${poiDistance} km of the route I'll be traveling.
      Please provide 10 interesting tourist attractions as a JSON array with these fields:
      [{"name": "...", "type": "...", "lat": 00.000000, "lng": 00.000000, "description": "...", "locality": "..."}]
      RETURN ONLY JSON.
    `;

    try {
      const fallbackResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert that provides points of interest along routes. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: simplifiedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v1'
          },
          timeout: 20000 // 20 second timeout for fallback
        }
      );

      const fallbackText = fallbackResponse.data.choices[0].message.content;
      let fallbackPois = [];

      try {
        const parsedResponse = JSON.parse(fallbackText);
        fallbackPois = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse.pois || []);
      } catch (parseError) {
        throw new Error('Could not parse fallback response');
      }

      if (Array.isArray(fallbackPois) && fallbackPois.length > 0) {
        const processedPois = fallbackPois.map((poi) => {
          // Ensure coordinates are numbers
          const lat = typeof poi.lat === 'number' ? poi.lat : parseFloat(poi.lat);
          const lng = typeof poi.lng === 'number' ? poi.lng : parseFloat(poi.lng);
          
          // Skip POIs with invalid coordinates
          if (isNaN(lat) || isNaN(lng)) {
            console.warn('Skipping fallback POI with invalid coordinates:', poi);
            return null;
          }
          
          return {
            ...poi,
            id: `ai-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isAiGenerated: true,
            selected: false,
            popularity: 0.7,
            locality: poi.locality || 'Unknown',
            // Ensure lat and lng are properly set as numbers
            lat: lat,
            lng: lng,
            location: {
              name: poi.name,
              lat: lat,
              lng: lng,
              city: poi.locality || 'Unknown',
              country: '',
            },
            type: 'poi',
          };
        }).filter(poi => poi !== null); // Filter out null entries (invalid coordinates)

        // Check if we have any valid POIs
        if (processedPois.length === 0) {
          throw new Error('No valid POIs found in fallback AI response');
        }

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
        const sortedPois = [...processedPois];
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
          title: 'AI Points of Interest (Fallback)',
          text: `Added ${processedPois.length} points of interest to your trip`,
          icon: 'info',
        });

        return processedPois;
      }
    } catch (error) {
      console.error('Fallback prompt error:', error);
      
      // Check if it's a rate limit error
      if (error.response && error.response.status === 429) {
        console.log('OpenAI API rate limit exceeded in fallback prompt');
        throw new Error('OpenAI API rate limit exceeded');
      }
      
      throw new Error(`Fallback failed: ${error.message}`);
    }
    
    throw new Error('Fallback did not return valid POIs');
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
              node[place~"city|town|village|suburb|hamlet"](around:10000,${point[0]},${point[1]});
              way[place~"city|town|village|suburb|hamlet"](around:10000,${point[0]},${point[1]});
              relation[place~"city|town|village|suburb|hamlet"](around:10000,${point[0]},${point[1]});
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
          );

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

        // Find POIs near each locality
        const poiPromises = localities.map(async (locality) => {
          const poiQuery = `
            [out:json];
            (
              ${categoryQueries.map((q) =>
                q.replace(';', `(around:5000,${locality.lat},${locality.lon});`)
              ).join('\n              ')}
            );
            out body;
            >;
            out count tags;
          `;

          try {
            const data = await makeOverpassRequest(poiQuery);
            return data.elements
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
          } catch (error) {
            console.warn(`Failed to fetch POIs near ${locality.tags.name}:`, error.message);
            return [];
          }
        });

        // Get all POIs and group by locality
        const allPois = (await Promise.all(poiPromises))
          .flat()
          .filter((poi, index, self) =>
            // Remove duplicates based on ID
            index === self.findIndex((p) => p.id === poi.id)
          );

        // If no POIs found, reject with an error
        if (allPois.length === 0) {
          clearTimeout(traditionalSearchTimeout);
          reject(new Error('No points of interest found along the route'));
          return;
        }

        // Group POIs by locality and get top 10 for each
        const poisByLocality = allPois.reduce((acc, poi) => {
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
          allPois.forEach(newPoi => {
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
          text: `Found ${allPois.length} points of interest along your route`,
          icon: 'success',
        });

        // Clear the timeout and resolve with the POIs
        clearTimeout(traditionalSearchTimeout);
        resolve(allPois);
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

  // Store the default API key in localStorage if not already there
  useEffect(() => {
    if (!localStorage.getItem('openai_api_key') && openAIApiKey) {
      localStorage.setItem('openai_api_key', openAIApiKey);
    }
  }, [openAIApiKey]);

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
              await findPointsOfInterestWithAI(currentRouteCoordinates);
              
              // If AI search was successful but returned few POIs, also try traditional search
              // to supplement the results
              const currentPois = pointsOfInterest;
              if (currentPois.length < 5) {
                console.log('AI search returned few POIs, supplementing with traditional search...');
                await findPointsOfInterestTraditional(currentRouteCoordinates);
              }
            } catch (aiError) {
              console.error('AI POI search failed:', aiError);
              
              // If AI search fails, automatically try traditional search without showing an error
              if (aiError.message && (aiError.message.includes('rate limit') || aiError.message.includes('All POI search methods failed'))) {
                console.log('AI search failed, trying traditional search as final fallback...');
                await findPointsOfInterestTraditional(currentRouteCoordinates);
              } else {
                // For other errors, rethrow to show the error message
                throw aiError;
              }
            }
          } else {
            // Use traditional search with multiple Overpass endpoints
            await findPointsOfInterestWithOverpass(currentRouteCoordinates);
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
        console.error('No routes found in the response');
        Swal.fire({
          title: 'Route Calculation Failed',
          text: 'Could not calculate a route between the destinations. Please try different locations or transport mode.',
          icon: 'error',
        });
        clearTimeout(planGenerationTimeout);
        setIsGeneratingPlan(false);
      }
    } catch (error) {
      console.error('Error in generatePlan:', error);
      Swal.fire({
        title: 'Error',
        text: 'An unexpected error occurred while generating the plan.',
        icon: 'error',
      });
      clearTimeout(planGenerationTimeout);
      setIsGeneratingPlan(false);
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
          node["tourism"="attraction"](around:${radius},${point[0]},${point[1]});
          node["tourism"="museum"](around:${radius},${point[0]},${point[1]});
          node["historic"="castle"](around:${radius},${point[0]},${point[1]});
          node["historic"="monument"](around:${radius},${point[0]},${point[1]});
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
      const limitedElements = elements.slice(0, 50);
      
      // Transform the POIs to our format
      const newPois = limitedElements
        .map(element => transformOverpassElementToPoi(element))
        .filter(poi => poi !== null);
      
      console.log(`Successfully processed ${newPois.length} POIs`);
      
      // Add the new POIs to the existing ones
      if (newPois.length > 0) {
        setPointsOfInterest(prevPois => [...prevPois, ...newPois]);
        return newPois;
      } else {
        // Try a fallback query if no POIs were found
        return await findPointsOfInterestFallback(routeCoordinates);
      }
    } catch (error) {
      console.error('Error with Overpass API:', error);
      
      // Try a fallback method
      return await findPointsOfInterestFallback(routeCoordinates);
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
        }
      ];
      
      // Add the hardcoded POIs to the existing ones
      setPointsOfInterest(prevPois => [...prevPois, ...hardcodedPois]);
      
      console.log(`Added ${hardcodedPois.length} fallback POIs`);
      return hardcodedPois;
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
      
      return `${lat-bufferDegrees},${lng-bufferDegrees},${lat+bufferDegrees},${lng+bufferDegrees}`;
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
      const selectedPOIs = pointsOfInterest.filter(poi => poi.selected);
      
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
        bounds.extend([day.location.lat, day.location.lng]);
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
        doc.text(`Start Point: ${removeDiacritics(tripDays[0].location.name || 'Custom Location')}`, 14, yPosition);
        yPosition += 7;
        
        if (tripDays.length > 1) {
          endPoint = tripDays[tripDays.length-1];
          doc.text(`Destination: ${removeDiacritics(tripDays[tripDays.length-1].location.name || 'Custom Location')}`, 14, yPosition);
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
          lat: startPoint.location.lat,
          lng: startPoint.location.lng,
          name: startPoint.location.name
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
              segmentInfo = `Driving from Start: ~${distance.toFixed(1)} km (approx. ${Math.floor(timeMinutes/60)}h ${timeMinutes%60}m)`;
            } else {
              segmentInfo = `Driving from previous: ~${distance.toFixed(1)} km (approx. ${Math.floor(timeMinutes/60)}h ${timeMinutes%60}m)`;
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
            finalSegmentInfo = `Final drive to destination: ~${distance.toFixed(1)} km (approx. ${Math.floor(timeMinutes/60)}h ${timeMinutes%60}m)`;
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
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Trip Planning</h1>
          <p className="text-gray-600">
            Add destinations for each day of your trip, then get recommendations for points of interest and optimal routes.
          </p>
        </div>

        {/* Main Content - Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Panel: Search and Trip Days */}
          <div className="md:col-span-3 space-y-6">
            {/* Search Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-4">
              <div className="relative">
                <div className="flex flex-col gap-3">
                  <div className="relative flex-1">
                    <div className="flex items-center gap-2 p-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search for a location"
                        className="w-full outline-none text-gray-700"
                      />
                      {isSearching && (
                        <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
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
                </div>
              </div>
            </div>

            {/* Trip Days */}
            {tripDays.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h2 className="text-lg font-semibold mb-2">Trip Days</h2>
                <div className="space-y-3">
                  {tripDays.map((day) => (
                    <div key={day.id} className="border-b pb-3 mb-3 last:border-b-0 last:mb-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-3 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0">
                              Destination
                            </span>
                            <h3 className="font-medium truncate">{day.location.name}</h3>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {day.location.city && day.location.country
                                ? `${day.location.city}, ${day.location.country}`
                                : day.location.country || 'Location details not available'}
                            </p>
                            <button
                              onClick={() => openInGoogleMaps(day)}
                              className="text-blue-600 hover:text-blue-800 ml-2 flex-shrink-0"
                              title="View in Google Maps"
                            >
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDay(day.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0 p-1"
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
              </div>
            )}
          </div>

          {/* Center Panel: Map */}
          <div className="md:col-span-6 order-first md:order-none mb-6 md:mb-0">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative">
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
                <div className="map-container" style={{ height: "500px", width: "100%", marginBottom: "20px" }}>
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

                    {/* Display POIs */}
                    {pointsOfInterest.map((poi) => (
                      <Marker
                        key={poi.id}
                        position={[poi.lat, poi.lng]}
                        icon={createCustomIcon(poi.selected ? 'green' : 'red')}
                        className="poi-marker"
                        eventHandlers={{
                          click: () => togglePOISelection(poi.id)
                        }}
                      >
                        <Popup>
                          <div className="space-y-2">
                            <h3 className="font-medium">{poi.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{poi.type}</p>
                            {poi.description && (
                              <p className="text-xs text-gray-500">{poi.description}</p>
                            )}
                            <button
                              onClick={() => togglePOISelection(poi.id)}
                              className={`px-2 py-1 text-xs rounded ${
                                poi.selected
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {poi.selected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Display Trip Days */}
                    {tripDays.map((day, index) => (
                      <Marker
                        key={day.id}
                        position={[day.location.lat, day.location.lng]}
                        icon={createCustomIcon('#3b82f6')}
                      >
                        <Popup>
                          <div className="space-y-2">
                            <h3 className="font-medium flex items-center">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                                Day {index + 1}
                              </span>
                              {day.location.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {day.location.city && day.location.country
                                ? `${day.location.city}, ${day.location.country}`
                                : day.location.country || 'Location details not available'}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Filters and Options */}
          <div className="md:col-span-3 space-y-6">
            {/* Trip Preferences */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <h2 className="text-lg font-semibold mb-2">Trip Preferences</h2>

              {/* Interests */}
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

              {/* Trip Style */}
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
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Add at least two destinations to see tourist attractions along the route
                  </p>
                )}
                {tripDays.length >= 2 && (
                  <p className="text-xs text-blue-600 mt-1 ml-6">
                    Showing tourist attractions between destinations
                  </p>
                )}
              </div>

              {/* Generate Plan Button */}
              {tripDays.length >= 2 && (
                <div className="mt-4">
                  <div className="mb-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUsingAiForPoi}
                        onChange={() => setIsUsingAiForPoi(!isUsingAiForPoi)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 font-medium">Use AI for points of interest</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      {isUsingAiForPoi
                        ? "Using Ollama to find interesting places along your route"
                        : "Using traditional search for points of interest"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      generatePlan().catch(err => {
                        console.error('Error in generate plan:', err);
                        setIsGeneratingPlan(false);
                      });
                    }}
                    disabled={isGeneratingPlan}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Again'
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    This will calculate the route between all your destinations in order and find named points of interest along the way
                  </p>
                </div>
              )}

              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">POI Distance</h3>
                <select
                  value={poiDistance}
                  onChange={(e) => setPoiDistance(Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Maximum distance of points of interest from your route</p>
              </div>

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
              <div className="mb-4">
                {/* Tourism & Attractions */}
                <details className="bg-white rounded-lg shadow-sm border">
                  <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                    <span>Tourism & Attractions</span>
                    <span className="text-xs text-blue-600">{selectedCategories.tourism.length} selected</span>
                  </summary>
                  <div className="px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryOptions.tourism.map((option) => (
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
              <div className="mb-4">
                {/* Natural Attractions */}
                <details className="bg-white rounded-lg shadow-sm border">
                  <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                    <span>Natural Attractions</span>
                    <span className="text-xs text-blue-600">{selectedCategories.natural.length} selected</span>
                  </summary>
                  <div className="px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryOptions.natural.map((option) => (
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
              <div className="mb-4">
                {/* Cultural & Historical Sites */}
                <details className="bg-white rounded-lg shadow-sm border">
                  <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                    <span>Cultural & Historical Sites</span>
                    <span className="text-xs text-blue-600">{selectedCategories.historic.length} selected</span>
                  </summary>
                  <div className="px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryOptions.historic.map((option) => (
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
              <div className="mb-4">
                {/* Recreational & Leisure */}
                <details className="bg-white rounded-lg shadow-sm border">
                  <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                    <span>Recreational & Leisure</span>
                    <span className="text-xs text-blue-600">{selectedCategories.leisure.length} selected</span>
                  </summary>
                  <div className="px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryOptions.leisure.map((option) => (
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
              <div className="mb-4">
                {/* Entertainment & Nightlife */}
                <details className="bg-white rounded-lg shadow-sm border">
                  <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                    <span>Entertainment & Nightlife</span>
                    <span className="text-xs text-blue-600">{selectedCategories.entertainment.length} selected</span>
                  </summary>
                  <div className="px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryOptions.entertainment.map((option) => (
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
              <div className="mb-4">
                {/* Sports & Outdoor Activities */}
                <details className="bg-white rounded-lg shadow-sm border">
                  <summary className="px-4 py-2 cursor-pointer font-medium flex justify-between items-center">
                    <span>Sports & Outdoor Activities</span>
                    <span className="text-xs text-blue-600">{selectedCategories.sports.length} selected</span>
                  </summary>
                  <div className="px-4 py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryOptions.sports.map((option) => (
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

            {/* Your Destinations & Points of Interest */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                Your Destinations & Points of Interest
              </h2>

              {tripDays.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No destinations added yet.</p>
                  <p className="text-sm mt-2">Search and add locations to plan your route.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tripDays.map((day) => (
                    <div key={day.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 mr-2 min-w-0">
                          <div className="flex items-center flex-wrap gap-1 mb-1">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                              Destination
                            </span>
                            <h3 className="font-medium text-sm truncate">{day.location.name}</h3>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600 truncate">
                              {day.location.city && day.location.country
                                ? `${day.location.city}, ${day.location.country}`
                                : day.location.country || 'Location details not available'}
                            </p>
                            <button
                              onClick={() => openInGoogleMaps(day)}
                              className="text-blue-600 hover:text-blue-800 ml-1 flex-shrink-0"
                              title="View in Google Maps"
                            >
                              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDay(day.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                          title="Remove this day"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {tripDays.length >= 2 && (
                    <button
                      onClick={generatePlan}
                      disabled={isGeneratingPlan}
                      className="w-full mt-3 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isGeneratingPlan ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Generate Trip Plan
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 hidden">
          {/* This section is now hidden as we moved it to the right panel */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* All Points of Interest */}
          {pointsOfInterest.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg col-span-1 lg:col-span-3">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-red-600" />
                All Points of Interest
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select points of interest to include in your trip ({pointsOfInterest.length} found)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pointsOfInterest.map((poi) => (
                  <div
                    key={poi.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      selectedPOI === poi.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
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
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                          {poi.type || 'Point of Interest'}
                        </span>
                        {poi.locality && (
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {poi.locality}
                          </span>
                        )}
                        {poi.distanceToRoute && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {poi.distanceToRoute.toFixed(1)}km
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
                            setPointsOfInterest(
                              pointsOfInterest.map((p) =>
                                p.id === poi.id ? { ...p, selected: !p.selected } : p
                              )
                            );
                          }}
                          className={`px-3 py-1 text-sm rounded-full ${
                            poi.selected
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
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      selectedPOI === poi.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
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
                          className={`px-3 py-1 text-sm rounded-full ${
                            poi.selected
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
          {pointsOfInterest.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Points of Interest</h2>

              <div className="space-y-6">
                {tripDays.map((day, index) => {
                  const dayPOIs = pointsOfInterest.filter((poi) => poi.dayId === day.id);

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
                        {dayPOIs.map((poi) => (
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
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openInGoogleMaps(poi);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                  >
                                    <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
                                    View in Google Maps
                                  </a>
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
                                    onClick={handleCancelEdit}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Cancel editing"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => handleEditPOI(e, poi)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeletePOI(e, poi.id)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Delete"
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
        </div>
      </div>
      
      {/* Add the Create Trip Layout button */}
      {pointsOfInterest.filter(poi => poi.selected).length > 0 && (
        <div className="pdf-button-container mt-4 mb-4 flex justify-center gap-4">
          <Button 
            onClick={generatePDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Trip Layout
          </Button>
          
          {!isGeneratingPlan && (
            <Button 
              onClick={() => {
                setIsGeneratingPlan(true);
                generatePlan().then(() => {
                  // Hide the button after generating
                  setIsGeneratingPlan(false);
                });
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Generate Again
            </Button>
          )}
        </div>
      )}

      {/* Add Select All button for POIs */}
      {pointsOfInterest.length > 0 && (
        <div className="flex justify-end mb-4 px-4">
          <Button
            onClick={() => {
              // Toggle all POIs based on current state
              const allSelected = pointsOfInterest.every(poi => poi.selected);
              setPointsOfInterest(
                pointsOfInterest.map(poi => ({
                  ...poi,
                  selected: !allSelected
                }))
              );
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded text-sm"
          >
            {pointsOfInterest.every(poi => poi.selected) ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      )}

      {/* POI Section */}
      {pointsOfInterest.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-lg font-semibold mb-4">
            Select points of interest to include in your trip ({pointsOfInterest.filter(poi => poi.name && poi.name !== 'Unnamed').length} found)
          </h2>
          
          {/* POI Filters */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by category:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(poiFilters).map((category) => (
                <button
                  key={category}
                  onClick={() => setPoiFilters({
                    ...poiFilters,
                    [category]: !poiFilters[category]
                  })}
                  className={`px-3 py-1.5 rounded-full text-xs ${
                    poiFilters[category]
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                  <span className="ml-1">
                    ({pointsOfInterest.filter(poi => categorizePOI(poi.type) === category && poi.name && poi.name !== 'Unnamed').length})
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* POI List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredPOIs().map((poi) => (
              <div
                key={poi.id}
                className={`border rounded-lg p-4 transition-all ${
                  poi.selected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{poi.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{poi.type}</p>
                    {poi.locality && (
                      <p className="text-xs text-gray-500 mt-1">{poi.locality}</p>
                    )}
                    {poi.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{poi.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => togglePOISelection(poi.id)}
                    className={`ml-2 p-1.5 rounded-full ${
                      poi.selected
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    style={{ backgroundColor: poi.selected ? '#10b981' : '' }} // Force green-500 color
                  >
                    <CheckIcon 
                      className="h-4 w-4" 
                      style={{ color: poi.selected ? 'white' : 'currentColor' }} 
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {getFilteredPOIs().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No points of interest match your selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Planning;