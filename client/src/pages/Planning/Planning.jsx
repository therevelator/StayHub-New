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
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../../services/api';

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
  const [isProcessingAiPoi, setIsProcessingAiPoi] = useState(false);
  const [ollamaModel, setOllamaModel] = useState('llama3.2:latest');

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
        country: location.components.country || '',
      },
      date: format(new Date(), 'yyyy-MM-dd'),
      pointsOfInterest: [],
    };

    setTripDays([...tripDays, newDay]);
  };

  // Handle day removal
  const handleRemoveDay = (dayId) => {
    setTripDays(tripDays.filter((day) => day.id !== dayId));
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

  // Handle POI click to highlight on map
  const handlePOIClick = (poi) => {
    setSelectedPOI(poi.id === selectedPOI ? null : poi.id);

    // Center map on the POI if selected
    if (mapRef.current && poi.id !== selectedPOI) {
      const map = mapRef.current;
      map.setView([poi.lat, poi.lng], 16, {
        animate: true,
        duration: 1,
        easeLinearity: 0.25,
      });

      // Open the popup for this POI
      const popupContent = L.popup()
        .setLatLng([poi.lat, poi.lng])
        .setContent(`
          <div class="p-2">
            <h3 class="font-medium text-lg">${poi.name}</h3>
            <p class="text-sm text-gray-600 capitalize">${poi.type}</p>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2"
            >
              View in Google Maps
            </a>
          </div>
        `)
        .openOn(map);
    }
  };

  // Handle POI deletion
  const handleDeletePOI = (e, poiId) => {
    e.stopPropagation(); // Prevent triggering the POI click
    setPointsOfInterest((prev) => prev.filter((poi) => poi.id !== poiId));

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
      setPointsOfInterest((prev) =>
        prev.map((poi) =>
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
    setInterests((prev) => ({
      ...prev,
      [interest]: !prev[interest],
    }));
  };

  // Handle trip style checkbox change
  const handleTripStyleChange = (style) => {
    setTripStyle((prev) => ({
      ...prev,
      [style]: !prev[style],
    }));
  };

  // Handle car checkbox change
  const handleCarChange = () => {
    setHasCar((prev) => !prev);

    // Refresh route POIs with new car setting if we have a route
    if (routeCoordinates.length > 0) {
      setTimeout(() => findRoutePointsOfInterest(), 100);
    }
  };

  // Handle category selection change
  const handleCategoryChange = (category, value) => {
    setSelectedCategories((prev) => {
      const currentSelections = [...prev[category]];

      // Toggle selection
      const newState = currentSelections.includes(value)
        ? {
            ...prev,
            [category]: currentSelections.filter((item) => item !== value),
          }
        : {
            ...prev,
            [category]: [...currentSelections, value],
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
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

  // Overpass API endpoints with fallback
  const OVERPASS_ENDPOINTS = [
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

  // Find points of interest using Ollama AI
  const findPointsOfInterestWithOllama = async () => {
    if (tripDays.length < 2) {
      console.warn('Cannot find POIs: need at least two destinations');
      setIsGeneratingPlan(false);
      return;
    }

    // Check if we have route coordinates
    if (!routeCoordinates || routeCoordinates.length === 0) {
      console.warn('No route coordinates available for Ollama POI search');
      setIsGeneratingPlan(false);
      return;
    }

    setIsProcessingAiPoi(true);

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
        ${tripStyle ? `My trip style is: ${tripStyle}` : ''}
        
        Please suggest 15-20 interesting points of interest along or near this route that match my interests.
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

      console.log('Sending request to Ollama with prompt:', prompt);

      // Call Ollama API
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: ollamaModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4096, // Ensure we get a complete response
        },
      });

      // Parse the response
      const responseText = response.data.response;
      console.log('Received response from Ollama:', responseText);

      // Extract JSON from the response - try multiple approaches
      let poisFromAi = [];

      try {
        // First try: direct JSON parsing
        try {
          poisFromAi = JSON.parse(responseText.trim());
          console.log('Successfully parsed JSON directly');
        } catch (parseError) {
          console.log('Direct JSON parsing failed, trying regex extraction');

          // Second try: regex extraction
          const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
          if (!jsonMatch) {
            throw new Error('Could not find JSON pattern in response');
          }

          const jsonStr = jsonMatch[0];
          poisFromAi = JSON.parse(jsonStr);
          console.log('Successfully parsed JSON using regex extraction');
        }

        // Validate the parsed data
        if (!Array.isArray(poisFromAi) || poisFromAi.length === 0) {
          throw new Error('Parsed result is not a valid array or is empty');
        }

        // Check if the first item has the expected structure
        const firstPoi = poisFromAi[0];
        if (
          !firstPoi.name ||
          !firstPoi.type ||
          typeof firstPoi.lat !== 'number' ||
          typeof firstPoi.lng !== 'number'
        ) {
          console.warn('POI data may be malformed:', firstPoi);
          // Continue anyway, we'll clean it up later
        }
      } catch (error) {
        console.error('JSON parsing failed:', error);
        throw new Error(`Failed to parse Ollama response: ${error.message}`);
      }

      // Process and add IDs to POIs
      const processedPois = poisFromAi.map((poi) => ({
        ...poi,
        id: `ai-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        isAiGenerated: true,
        selected: false,
        popularity: 0.8,
        locality: poi.locality || 'Unknown',
        location: {
          name: poi.name,
          lat: poi.lat,
          lng: poi.lng,
          city: poi.locality,
          country: '',
        },
        type: 'poi',
      }));

      // Set the POIs to state
      setPointsOfInterest(processedPois);

      // Insert POIs between trip days instead of adding them as separate days
      const actualDays = tripDays.filter((day) => day.type !== 'poi');

      // Sort POIs by their proximity to the route
      const sortedPois = [...processedPois];

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
    } catch (error) {
      console.error('Error finding POIs with Ollama:', error);

      // Try a simplified prompt as a fallback
      try {
        console.log('Trying simplified prompt as fallback...');

        const simplifiedPrompt = `
          I need points of interest between ${tripDays[0].location.name} and ${tripDays[tripDays.length - 1].location.name}.
          Only include places that are within ${poiDistance} km of the route I'll be traveling.
          Please provide 10 interesting tourist attractions as a JSON array with these fields:
          [{"name": "...", "type": "...", "lat": 00.000000, "lng": 00.000000, "description": "...", "locality": "..."}]
          RETURN ONLY JSON.
        `;

        const fallbackResponse = await axios.post('http://localhost:11434/api/generate', {
          model: ollamaModel,
          prompt: simplifiedPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2048,
          },
        });

        const fallbackText = fallbackResponse.data.response;
        let fallbackPois = [];

        try {
          fallbackPois = JSON.parse(fallbackText.trim());
        } catch (parseError) {
          const jsonMatch = fallbackText.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            fallbackPois = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse fallback response');
          }
        }

        if (Array.isArray(fallbackPois) && fallbackPois.length > 0) {
          const processedPois = fallbackPois.map((poi) => ({
            ...poi,
            id: `ai-fallback-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            isAiGenerated: true,
            selected: false,
            popularity: 0.7,
            locality: poi.locality || 'Unknown',
            location: {
              name: poi.name,
              lat: poi.lat,
              lng: poi.lng,
              city: poi.locality || 'Unknown',
              country: '',
            },
            type: 'poi',
          }));

          setPointsOfInterest(processedPois);

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

          return; // Successfully used fallback
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      // If we reach here, both main and fallback attempts failed
      Swal.fire({
        title: 'Error',
        text: 'Failed to find points of interest using AI. Falling back to traditional search.',
        icon: 'error',
      });

      // Fall back to traditional search as a last resort
      findPointsOfInterestTraditional();
    } finally {
      setIsProcessingAiPoi(false);
    }
  };

  // Find all points of interest based on selected filters using traditional method
  const findPointsOfInterestTraditional = async () => {
    if (tripDays.length < 2 || !routeCoordinates.length) {
      console.warn('Cannot find POIs: need route coordinates and at least two destinations');
      return;
    }

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

        const response = await axios.post('https://overpass-api.de/api/interpreter', localityQuery);
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
      });

      const localities = (await Promise.all(localityPromises))
        .flat()
        .filter((locality, index, self) =>
          // Remove duplicates based on name
          index === self.findIndex((l) => l.tags.name === locality.tags.name)
        );

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
            ).join('\n            ')}
          );
          out body;
          >;
          out count tags;
        `;

        const data = await makeOverpassRequest(poiQuery);
        return data.elements
          .filter((element) => element.tags?.name)
          .map((element) => ({
            id: element.id,
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
          }));
      });

      // Get all POIs and group by locality
      const allPois = (await Promise.all(poiPromises))
        .flat()
        .filter((poi, index, self) =>
          // Remove duplicates based on ID
          index === self.findIndex((p) => p.id === poi.id)
        );

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

      setPointsOfInterest(allPois);
      setPoisByLocality(poisByLocality);
    } catch (error) {
      console.error('Error finding route POIs:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to find points of interest along the route',
        icon: 'error',
      });
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

  // Generate trip plan
  const generatePlan = async () => {
    // Check if we have at least 2 destinations
    if (tripDays.length < 2) {
      Swal.fire({
        title: 'Not enough destinations',
        text: 'Please add at least two destinations to generate a plan',
        icon: 'warning',
      });
      return;
    }

    setIsGeneratingPlan(true);
    setRoutePOIs([]); // Clear existing route POIs

    try {
      // Validate coordinates
      const invalidLocation = tripDays.find((day) => {
        const lat = parseFloat(day.location.lat);
        const lng = parseFloat(day.location.lng);
        return isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180;
      });

      if (invalidLocation) {
        console.error('Invalid coordinates found:', invalidLocation);
        Swal.fire({
          title: 'Invalid Coordinates',
          text: `Invalid coordinates found for location: ${invalidLocation.location.name}`,
          icon: 'error',
        });
        setIsGeneratingPlan(false);
        return;
      }

      // OSRM API expects coordinates in format: longitude,latitude
      const waypoints = tripDays
        .map((day) =>
          [
            parseFloat(day.location.lng).toFixed(6),
            parseFloat(day.location.lat).toFixed(6),
          ].join(',')
        )
        .join(';');

      // Clear any existing routes
      setRouteCoordinates([]);
      setPoiRoutes([]);

      // For OSRM API, we need to ensure we have valid coordinates
      if (!waypoints.match(/^(-?\d+\.\d+,-?\d+\.\d+;)+(-?\d+\.\d+,-?\d+\.\d+)$/)) {
        console.error('Invalid waypoints format:', waypoints);
        Swal.fire({
          title: 'Invalid Coordinates',
          text: 'Some destinations have invalid coordinates. Please try different locations.',
          icon: 'error',
        });
        setIsGeneratingPlan(false);
        return;
      }

      try {
        const routeResponse = await axios.get(
          `https://router.project-osrm.org/route/v1/${transportMode}/${waypoints}?overview=full&geometries=geojson`
        );

        if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
          // Extract route coordinates
          const route = routeResponse.data.routes[0].geometry.coordinates;

          // Get route distance and duration
          const distance = (routeResponse.data.routes[0].distance / 1000).toFixed(1); // km
          const duration = Math.round(routeResponse.data.routes[0].duration / 60); // minutes

          // Convert from [lng, lat] to [lat, lng] for Leaflet
          const leafletCoordinates = route.map((point) => [point[1], point[0]]);
          setRouteCoordinates(leafletCoordinates);

          // Center map on the route
          if (mapRef.current && leafletCoordinates.length > 0) {
            const bounds = L.latLngBounds(leafletCoordinates);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          }

          // Set isUsingAiForPoi to true to always use AI for POIs
          setIsUsingAiForPoi(true);

          // Find POIs along the route using AI
          findPointsOfInterestWithOllama();
        } else {
          console.error('No routes found in the response');
          Swal.fire({
            title: 'Route Calculation Failed',
            text: 'Could not calculate a route between the destinations. Please try different locations or transport mode.',
            icon: 'error',
          });
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setIsGeneratingPlan(false);
      }
    } catch (error) {
      console.error('Error in generatePlan:', error);
      setIsGeneratingPlan(false);
    }
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
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
              <div className="relative">
                <div className="flex flex-col gap-3">
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
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
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

            {/* Trip Days */}
            {tripDays.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h2 className="text-lg font-semibold mb-2">Trip Days</h2>
                <div className="space-y-3">
                  {tripDays.map((day) => (
                    <div key={day.id} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                              Destination
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
              </div>
            )}
          </div>

          {/* Center Panel: Map */}
          <div className="md:col-span-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <MapContainer
                center={[routeCoordinates[0]?.[0] || 0, routeCoordinates[0]?.[1] || 0]}
                zoom={13}
                style={{ height: '700px', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

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
                    icon={createCustomIcon('#EF4444')}
                    eventHandlers={{
                      click: () => handlePOIClick(poi),
                    }}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <h3 className="font-medium">{poi.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{poi.type}</p>
                        {poi.locality && (
                          <p className="text-xs text-gray-500">
                            Located in {poi.locality}
                            {poi.distanceToRoute && ` (${poi.distanceToRoute.toFixed(1)}km from route)`}
                          </p>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                        >
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
                          View in Google Maps
                        </a>
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

                {/* Map controller to update bounds */}
                <MapController locations={mapLocations} />
              </MapContainer>
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
                        Calculate Route with {tripDays.length} Destinations
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

              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">POI Distance from Route</h3>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Days List */}
          <div className="space-y-4">
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
                <div className="space-y-4">
                  {tripDays.map((day) => (
                    <div key={day.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                              Destination
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
                  {routePOIs.map((poi) => (
                    <div
                      key={poi.id}
                      className={`text-sm border-l-2 ${
                        selectedPOI === poi.id ? 'border-green-500 bg-green-50'
                          : poi.distanceToRoute <= 1 ? 'border-purple-500'
                          : poi.isPopular ? 'border-yellow-500'
                          : 'border-blue-500'
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
                                      href={`https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                                      onClick={(e) => e.stopPropagation()}
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
      </div>
    </div>
  );
};

export default Planning;