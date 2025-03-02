import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { 
  WifiIcon, 
  TvIcon, 
  HomeModernIcon,
  SparklesIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import '../../styles/filterContainer.css';
import '../../styles/dualRangeSlider.css';

const FilterContainer = ({ onFilterChange, properties = [] }) => {
  // Price range state
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  
  // Rating filter state
  const [rating, setRating] = useState(0);
  
  // Amenities state - initialize empty and populate based on available amenities
  const [amenities, setAmenities] = useState({});
  
  // Beds state - initialize empty and populate based on available beds
  const [beds, setBeds] = useState({});
  
  // Amenity search state
  const [amenitySearch, setAmenitySearch] = useState('');
  const [showAmenitySuggestions, setShowAmenitySuggestions] = useState(false);
  const [bedSearch, setBedSearch] = useState('');
  const [showBedSuggestions, setShowBedSuggestions] = useState(false);
  const searchRef = useRef(null);
  const bedSearchRef = useRef(null);
  
  // Define mapping of normalized keys to display names
  const amenityDisplayNames = {
    // Room boolean fields
    roomservice: 'Room Service',
    privatebathroom: 'Private Bathroom',
    balcony: 'Balcony',
    kitchen: 'Kitchen',
    minibar: 'Minibar',
    breakfastincluded: 'Breakfast Included',
    extrabedavailable: 'Extra Bed Available',
    petsallowed: 'Pets Allowed',
    toiletries: 'Toiletries',
    towelslinens: 'Towels & Linens',
    smokingallowed: 'Smoking Allowed',
    safe: 'Safe',
    
    // Common amenities
    wifi: 'WiFi',
    tv: 'TV',
    airconditioning: 'Air Conditioning',
    parking: 'Parking',
    pool: 'Swimming Pool',
    gym: 'Gym',
    washer: 'Washer/Dryer',
    breakfast: 'Breakfast',
    hottub: 'Hot Tub',
    beachaccess: 'Beach Access',
    fireplace: 'Fireplace',
    bbqgrill: 'BBQ Grill',
    freewifi: 'Free WiFi',
    heating: 'Heating',
    workspace: 'Workspace',
    laundry: 'Laundry',
    dishwasher: 'Dishwasher',
    refrigerator: 'Refrigerator',
    microwave: 'Microwave',
    coffeemaker: 'Coffee Maker',
    hairdryer: 'Hair Dryer',
    iron: 'Iron',
    privateentrance: 'Private Entrance',
    securitycameras: 'Security Cameras',
    smokealarm: 'Smoke Alarm',
    carbonmonoxidealarm: 'Carbon Monoxide Alarm',
    firstaidkit: 'First Aid Kit',
    fireextinguisher: 'Fire Extinguisher',
    oceanview: 'Ocean View',
    seaview: 'Sea View',
    mountainview: 'Mountain View',
    
    // Bed types
    singlebed: 'Single Bed',
    doublebed: 'Double Bed',
    queenbed: 'Queen Bed',
    kingbed: 'King Bed',
    sofabed: 'Sofa Bed',
    bunkbed: 'Bunk Bed'
  };

  // Extract unique bed types from properties and their rooms
  const availableBedTypes = useMemo(() => {
    const bedsMap = new Map();
    
    properties.forEach(property => {
      if (property.room_beds) {
        try {
          const roomBeds = typeof property.room_beds === 'string' ?
            JSON.parse(property.room_beds) :
            property.room_beds;

          if (Array.isArray(roomBeds)) {
            roomBeds.forEach(bed => {
              if (typeof bed === 'string' && bed.trim()) {
                const cleanBed = bed.trim();
                const normalizedKey = cleanBed.toLowerCase().replace(/[^a-z0-9]/g, '');
                bedsMap.set(normalizedKey, amenityDisplayNames[normalizedKey] || cleanBed);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing room beds:', error);
        }
      }
    });
    
    return bedsMap;
  }, [properties, amenityDisplayNames]);

  // Convert Map to array for display
  const bedTypesList = useMemo(() => {
    return Array.from(availableBedTypes.entries())
      .map(([key, displayName]) => ({ key, displayName }));
  }, [availableBedTypes]);

  // Filter bed types based on search
  const filteredBedTypes = useMemo(() => {
    return bedTypesList.filter(bedType =>
      bedType.displayName.toLowerCase().includes(bedSearch.toLowerCase())
    );
  }, [bedSearch, bedTypesList]);

  // Get selected bed types list
  const selectedBedTypesList = useMemo(() => {
    return bedTypesList.filter(bedType => beds[bedType.key]);
  }, [beds, bedTypesList]);

  // Handle bed search change
  const handleBedSearchChange = (e) => {
    setBedSearch(e.target.value);
  };

  // Handle bed type selection
  const handleSelectBedType = (bedType) => {
    const newBeds = { ...beds, [bedType]: !beds[bedType] };
    setBeds(newBeds);
  };

  // Handle bed type toggle
  const handleBedTypeToggle = (bedType) => {
    const newBeds = { ...beds, [bedType]: false };
    setBeds(newBeds);
  };
  
  // Normalize amenity key for consistent lookup
  const normalizeAmenityKey = (amenity) => {
    return amenity.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Extract unique amenities from properties and their rooms
  const availableAmenities = useMemo(() => {
    const amenitiesMap = new Map();
    
    properties.forEach(property => {
      // Process property-level amenities
      if (property.property_amenities) {
        try {
          const propertyAmenities = typeof property.property_amenities === 'string' ?
            JSON.parse(property.property_amenities) :
            property.property_amenities;

          if (Array.isArray(propertyAmenities)) {
            propertyAmenities.forEach(amenity => {
              if (typeof amenity === 'string' && amenity.trim()) {
                const cleanAmenity = amenity.trim();
                const normalizedKey = normalizeAmenityKey(cleanAmenity);
                amenitiesMap.set(normalizedKey, cleanAmenity);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing property amenities:', error);
        }
      }
      
      // Process room-level amenities
      if (property.room_amenities) {
        try {
          const roomAmenities = typeof property.room_amenities === 'string' ?
            JSON.parse(property.room_amenities) :
            property.room_amenities;

          if (Array.isArray(roomAmenities)) {
            roomAmenities.forEach(amenity => {
              if (typeof amenity === 'string' && amenity.trim()) {
                const cleanAmenity = amenity.trim();
                const normalizedKey = normalizeAmenityKey(cleanAmenity);
                amenitiesMap.set(normalizedKey, cleanAmenity);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing room amenities:', error);
        }
      }
    });
    
    return amenitiesMap;
  }, [properties]);

  // Convert Map to array and filter based on search
  const filteredAmenities = useMemo(() => {
    const searchTerm = amenitySearch.toLowerCase();
    return Array.from(availableAmenities.entries())
      .map(([key, originalName]) => ({
        key,
        displayName: amenityDisplayNames[key] || originalName
      }))
      .filter(amenity => 
        amenity.displayName.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [availableAmenities, amenitySearch]);
  


  // Get selected amenities for display
  const selectedAmenitiesList = Object.entries(amenities)
    .filter(([_, selected]) => selected)
    .map(([key]) => ({
      key,
      displayName: amenityDisplayNames[key] || availableAmenities.get(key) || key.replace(/([a-z])([A-Z])/g, '$1 $2').trim()
    }));

  // Update filters when they change
  useEffect(() => {
    onFilterChange({
      priceRange,
      rating,
      amenities,
      beds
    });
  }, [priceRange, rating, amenities, beds]); // Removed onFilterChange from dependencies to prevent infinite loop

  // Handle price range changes
  const handleMinPriceChange = (e) => {
    const newMinPrice = parseInt(e.target.value);
    setMinPrice(newMinPrice);
    if (newMinPrice <= maxPrice - 10) {
      setPriceRange([newMinPrice, maxPrice]);
    } else {
      // Ensure there's at least a $10 gap between min and max
      setPriceRange([newMinPrice, Math.max(newMinPrice + 10, maxPrice)]);
      setMaxPrice(Math.max(newMinPrice + 10, maxPrice));
    }
  };

  const handleMaxPriceChange = (e) => {
    const newMaxPrice = parseInt(e.target.value);
    setMaxPrice(newMaxPrice);
    if (newMaxPrice >= minPrice + 10) {
      setPriceRange([minPrice, newMaxPrice]);
    } else {
      // Ensure there's at least a $10 gap between min and max
      setPriceRange([Math.min(newMaxPrice - 10, minPrice), newMaxPrice]);
      setMinPrice(Math.min(newMaxPrice - 10, minPrice));
    }
  };

  // Handle rating selection
  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating === rating ? 0 : selectedRating);
  };

  // Handle amenity toggle
  const handleAmenityToggle = (amenity) => {
    const normalizedKey = normalizeAmenityKey(amenity);
    setAmenities(prev => ({
      ...prev,
      [normalizedKey]: !prev[normalizedKey]
    }));
  };
  
  // Handle amenity search input change
  const handleAmenitySearchChange = (e) => {
    setAmenitySearch(e.target.value);
    setShowAmenitySuggestions(true);
  };
  
  // Handle selecting an amenity from suggestions
  const handleSelectAmenity = (amenityKey) => {
    handleAmenityToggle(amenityKey);
    setAmenitySearch('');
    setShowAmenitySuggestions(false);
  };
  
  // Handle click outside to close suggestions
  const handleClickOutside = useCallback((event) => {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setShowAmenitySuggestions(false);
    }
    if (bedSearchRef.current && !bedSearchRef.current.contains(event.target)) {
      setShowBedSuggestions(false);
    }
  }, []);
  
  // Add and remove click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 filter-container">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="mb-4">
          <div className="dual-range-container">
            {/* Price range track */}
            <div 
              className="price-range-track" 
              style={{
                left: `${(priceRange[0] / 1000) * 100}%`,
                width: `${((priceRange[1] - priceRange[0]) / 1000) * 100}%`
              }}
            ></div>
            
            {/* Min price slider */}
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[0]}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const newMinPrice = Math.min(value, priceRange[1] - 10);
                setMinPrice(newMinPrice);
                setPriceRange([newMinPrice, priceRange[1]]);
              }}
              className="dual-range-slider"
            />
            
            {/* Max price slider */}
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[1]}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                const newMaxPrice = Math.max(value, priceRange[0] + 10);
                setMaxPrice(newMaxPrice);
                setPriceRange([priceRange[0], newMaxPrice]);
              }}
              className="dual-range-slider"
            />
          </div>
          
          <div className="price-display">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
        
        <div className="flex justify-between gap-4 mt-4">
          <div className="w-1/2">
            <label className="block text-sm text-gray-600 mb-1">Min Price</label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                min="0"
                max="990"
                value={minPrice}
                onChange={handleMinPriceChange}
                className="block w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="w-1/2">
            <label className="block text-sm text-gray-600 mb-1">Max Price</label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                min="10"
                max="1000"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                className="block w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating Filter */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Rating</h3>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingClick(star)}
              className="focus:outline-none"
            >
              {star <= rating ? (
                <StarIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <StarOutline className="h-6 w-6 text-gray-400" />
              )}
            </button>
          ))}
          {rating > 0 && (
            <button 
              onClick={() => setRating(0)}
              className="ml-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Beds Filter */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Bed Types</h3>
        
        {/* Bed Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search bed types..."
            value={bedSearch}
            onChange={handleBedSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none text-gray-600 bg-gray-50"
          />
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Selected Bed Types */}
        <div className="mb-4">
          <h4 className="text-sm text-gray-600 mb-2">Selected Bed Types:</h4>
          {selectedBedTypesList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedBedTypesList.map(bedType => (
                <div 
                  key={bedType.key}
                  className="bg-primary-50 border border-primary-200 rounded-full px-3 py-1 text-xs flex items-center"
                >
                  <span>{bedType.displayName}</span>
                  <button 
                    onClick={() => handleBedTypeToggle(bedType.key)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No bed types selected</div>
          )}
        </div>

        {/* Available Bed Types */}
        <div>
          <h4 className="text-sm text-gray-600 mb-2">Available Bed Types:</h4>
          <div className="flex flex-col">
            {filteredBedTypes.map(bedType => (
              <div
                key={bedType.key}
                onClick={() => handleSelectBedType(bedType.key)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${beds[bedType.key] 
                    ? 'bg-primary-50 border border-primary-200 text-primary-700' 
                    : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700'}
                `}
              >
                <span className="text-sm font-medium">{bedType.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Amenities Filter */}
      <div>
        <h3 className="font-medium mb-3">Amenities</h3>
        
        {/* Amenity Search Input */}
        <div className="relative mb-4" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search amenities..."
            value={amenitySearch}
            onChange={handleAmenitySearchChange}
            onFocus={() => setShowAmenitySuggestions(true)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent amenity-search-input"
          />
          {amenitySearch && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => {
                setAmenitySearch('');
                setShowAmenitySuggestions(false);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          
          {/* Amenity Suggestions Dropdown */}
          {showAmenitySuggestions && filteredAmenities.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg amenity-suggestions">
              {filteredAmenities.map(amenity => (
                <div 
                  key={amenity.key}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${amenities[amenity.key] ? 'bg-primary-50' : ''}`}
                  onClick={() => handleSelectAmenity(amenity.key)}
                >
                  <input 
                    type="checkbox" 
                    checked={amenities[amenity.key] || false} 
                    readOnly
                    className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm">{amenity.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Amenities */}
        <div className="mb-2">
          <h4 className="text-sm text-gray-600 mb-2">Selected Amenities:</h4>
          {selectedAmenitiesList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAmenitiesList.map(amenity => (
                <div 
                  key={amenity.key}
                  className="bg-primary-50 border border-primary-200 rounded-full px-3 py-1 text-xs flex items-center amenity-tag"
                >
                  <span>{amenity.displayName}</span>
                  <button 
                    onClick={() => handleAmenityToggle(amenity.key)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none amenity-remove-btn"
                    aria-label={`Remove ${amenity.displayName}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No amenities selected</p>
          )}
        </div>
        
        {/* Available Property Amenities */}
        {filteredAmenities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm text-gray-600 mb-2">Available Amenities:</h4>
            <div className="flex flex-col space-y-2">
              {filteredAmenities.slice(0, 10).map(amenity => (
                <div 
                  key={amenity.key}
                  onClick={() => handleAmenityToggle(amenity.key)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200
                    ${amenities[amenity.key] 
                      ? 'bg-primary-50 border border-primary-200 text-primary-700' 
                      : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700'}
                  `}
                >
                  <span className="text-sm font-medium">{amenity.displayName}</span>
                </div>
              ))}
            </div>
            {filteredAmenities.length > 10 && (
              <p className="text-xs text-gray-500 mt-3">
                {filteredAmenities.length - 10} more amenities available. Use the search above to find specific amenities.
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Reset Filters Button */}
      <button
        onClick={() => {
          setPriceRange([0, 1000]);
          setMinPrice(0);
          setMaxPrice(1000);
          setRating(0);
          // Reset all amenities to false
          const resetAmenities = {};
          availableAmenities.forEach(amenity => {
            resetAmenities[amenity.key] = false;
          });
          // Also reset any previously selected amenities not in availableAmenities
          Object.keys(amenities).forEach(key => {
            resetAmenities[key] = false;
          });
          setAmenities(resetAmenities);
          setAmenitySearch('');
          setShowAmenitySuggestions(false);
        }}
        className="mt-6 w-full py-2 text-center bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterContainer;
