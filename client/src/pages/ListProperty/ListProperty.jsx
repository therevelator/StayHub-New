import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import propertyService from '../../services/propertyService';
import RoomForm from '../../components/Room/RoomForm';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import 'leaflet/dist/leaflet.css';
import { StarIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import PhotosForm from './steps/PhotosForm';
import AmenitiesForm from './steps/AmenitiesForm';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'resort', label: 'Resort' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'hostel', label: 'Hostel' }
];

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strict', label: 'Strict' }
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Romanian',
  'Russian',
  'Chinese',
  'Japanese'
];

const steps = [
  {
    id: 'basic',
    title: 'Basic Information',
    fields: ['name', 'description', 'property_type', 'guests', 'bedrooms', 'beds', 'bathrooms', 'star_rating']
  },
  {
    id: 'location',
    title: 'Location',
    fields: ['street', 'city', 'state', 'country', 'postal_code', 'latitude', 'longitude']
  },
  {
    id: 'amenities',
    title: 'Amenities',
    fields: ['amenities']
  },
  {
    id: 'rooms',
    title: 'Rooms',
    fields: ['rooms']
  },
  {
    id: 'photos',
    title: 'Photos',
    fields: ['photos']
  },
  {
    id: 'policies',
    title: 'Policies & Rules',
    fields: ['check_in_time', 'check_out_time', 'cancellation_policy', 'pet_policy', 'event_policy']
  },
  {
    id: 'additional',
    title: 'Additional Details',
    fields: ['languages_spoken', 'is_active', 'price']
  }
];

const MapComponent = ({ position, setPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (position[0] && position[1]) {
      map.setView(position, 13);
    }
  }, [position, map]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
  };

  map.on('click', handleMapClick);

  return <Marker position={position} />;
};

const ListProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    price: '',
    rating: 0,
    host_id: user?.id || null,
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    property_type: 'hotel',
    check_in_time: '14:00:00',
    check_out_time: '11:00:00',
    cancellation_policy: 'flexible',
    pet_policy: '',
    event_policy: '',
    star_rating: 0,
    languages_spoken: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rooms: [],
    photos: [],
    amenities: []
  });
  const [mapPosition, setMapPosition] = useState([44.8566, 24.8524]); // Default to Romania coordinates

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setMapPosition([parseFloat(formData.latitude), parseFloat(formData.longitude)]);
    }
  }, [formData.latitude, formData.longitude]);

  const handleMapPositionChange = (position) => {
    setMapPosition(position);
    setFormData(prev => ({
      ...prev,
      latitude: position[0].toString(),
      longitude: position[1].toString()
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const languages = prev.languages_spoken || [];
      if (languages.includes(language)) {
        return {
          ...prev,
          languages_spoken: languages.filter(lang => lang !== language)
        };
      } else {
        return {
          ...prev,
          languages_spoken: [...languages, language]
        };
      }
    });
  };

  const handleStarRating = (rating) => {
    setFormData(prev => ({
      ...prev,
      star_rating: rating
    }));
  };

  const handleRoomSubmit = (roomData) => {
    console.log('Room submission data:', roomData); // Debug log
    const formattedRoom = {
      name: roomData.name?.trim(),
      room_type: roomData.room_type?.trim(),
      bed_type: roomData.bed_type || 'Single Bed',
      beds: JSON.stringify(roomData.beds || []),
      max_occupancy: parseInt(roomData.max_occupancy) || 1,
      base_price: parseFloat(roomData.base_price) || 0,
      cleaning_fee: parseFloat(roomData.cleaning_fee) || 0,
      service_fee: parseFloat(roomData.service_fee) || 0,
      tax_rate: parseFloat(roomData.tax_rate) || 0,
      security_deposit: parseFloat(roomData.security_deposit) || 0,
      description: roomData.description?.trim() || '',
      bathroom_type: roomData.bathroom_type || 'private',
      view_type: roomData.view_type || 'No View',
      has_private_bathroom: roomData.has_private_bathroom ? 1 : 0,
      smoking: roomData.smoking ? 1 : 0,
      accessibility_features: JSON.stringify(roomData.accessibility_features || []),
      floor_level: parseInt(roomData.floor_level) || 1,
      has_balcony: roomData.has_balcony ? 1 : 0,
      has_kitchen: roomData.has_kitchen ? 1 : 0,
      has_minibar: roomData.has_minibar ? 1 : 0,
      climate: roomData.climate || null,
      price_per_night: parseFloat(roomData.price_per_night) || 0,
      cancellation_policy: roomData.cancellation_policy || 'moderate',
      includes_breakfast: roomData.includes_breakfast ? 1 : 0,
      extra_bed_available: roomData.extra_bed_available ? 1 : 0,
      pets_allowed: roomData.pets_allowed ? 1 : 0,
      photos: JSON.stringify(roomData.photos || []),
      cleaning_frequency: roomData.cleaning_frequency || 'daily',
      has_toiletries: roomData.has_toiletries ? 1 : 0,
      has_towels_linens: roomData.has_towels_linens ? 1 : 0,
      has_room_service: roomData.has_room_service ? 1 : 0,
      flooring_type: roomData.flooring_type || 'Hardwood',
      energy_saving_features: JSON.stringify(roomData.energy_saving_features || []),
      status: roomData.status || 'available',
      room_size: parseFloat(roomData.room_size) || 0,
      amenities: JSON.stringify(roomData.amenities || [])
    };

    console.log('Formatted room data:', formattedRoom); // Debug log
    setFormData(prev => {
      const newFormData = {
        ...prev,
        rooms: [...prev.rooms, formattedRoom]
      };
      console.log('Updated form data:', newFormData); // Debug log
      return newFormData;
    });
    setShowRoomModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Starting form submission...'); // Debug log

    try {
      if (!user?.id) {
        console.log('No user ID found'); // Debug log
        toast.error('You must be logged in to create a property');
        navigate('/login');
        return;
      }

      // Ensure host_id is set before submission
      const submissionData = {
        ...formData,
        host_id: user.id // Explicitly set host_id
      };

      console.log('Submitting with host_id:', submissionData.host_id); // Debug log

      const response = await propertyService.create(submissionData);
      
      if (response.status === 'success') {
        toast.success('Property created successfully!');
        navigate('/admin/properties');
      } else {
        toast.error('Failed to create property. Please try again.');
      }
    } catch (error) {
      console.error('Error in property creation:', error);
      toast.error(error.message || 'An error occurred while creating the property.');
    }
  };

  const verifyAddress = async () => {
    try {
      // Try different combinations of address components
      const addressAttempts = [
        // First attempt: Full address
        [formData.street, formData.city, formData.state, formData.country, formData.postal_code],
        // Second attempt: Without postal code
        [formData.street, formData.city, formData.state, formData.country],
        // Third attempt: City, State, Country
        [formData.city, formData.state, formData.country],
        // Fourth attempt: Just City and Country
        [formData.city, formData.country]
      ].map(components => components.filter(Boolean).join(', '));

      for (const addressString of addressAttempts) {
        if (!addressString) continue;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en', // Prefer English results
              'User-Agent': 'BookingApp/1.0' // Identify your application
            }
          }
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setMapPosition([parseFloat(lat), parseFloat(lon)]);
          
          // Only update coordinates if they're empty
          if (!formData.latitude && !formData.longitude) {
            setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lon
            }));
          }
          
          toast.success('Address verified successfully!');
          return; // Exit after first successful attempt
        }
      }

      // If we get here, none of the attempts worked
      toast.error('Address not found. Try removing some details or check the spelling.');
    } catch (error) {
      console.error('Address verification error:', error);
      toast.error('Error verifying address. Please try again.');
    }
  };

  const renderRequiredLabel = (label) => (
    <label className="block text-sm font-medium text-gray-700">
      {label} <span className="text-red-500">*</span>
    </label>
  );

  const renderStepContent = () => {
    const currentFields = steps[currentStep].fields;
    
    switch (steps[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              {renderRequiredLabel('Property Name')}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              {renderRequiredLabel('Description')}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Star Rating</label>
                <div className="mt-1 flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-6 w-6 cursor-pointer ${
                        star <= formData.star_rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => handleStarRating(star)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                <input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Beds</label>
                <input
                  type="number"
                  name="beds"
                  value={formData.beds}
                  onChange={handleInputChange}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  min="0.5"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                {renderRequiredLabel('Street Address')}
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  {renderRequiredLabel('City')}
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  {renderRequiredLabel('State/Province')}
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  {renderRequiredLabel('Country')}
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={verifyAddress}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Verify Address
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="any"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="any"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full rounded-lg overflow-hidden">
              <MapContainer
                center={mapPosition}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapComponent position={mapPosition} setPosition={handleMapPositionChange} />
              </MapContainer>
            </div>
          </div>
        );

      case 'amenities':
        return (
          <AmenitiesForm
            data={formData.amenities || []}
            onChange={(amenities) => setFormData(prev => ({ ...prev, amenities }))}
          />
        );

      case 'rooms':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Rooms ({formData.rooms.length})</h3>
              <button
                type="button"
                onClick={() => setShowRoomModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Add Room
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {formData.rooms.map((room, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium">{room.name}</h4>
                  <p className="text-sm text-gray-600">Type: {room.room_type}</p>
                  <p className="text-sm text-gray-600">Max Occupancy: {room.max_occupancy}</p>
                </div>
              ))}
            </div>

            {showRoomModal && (
              <RoomForm
                onSubmit={handleRoomSubmit}
                onClose={() => setShowRoomModal(false)}
              />
            )}
          </div>
        );

      case 'photos':
        return (
          <PhotosForm
            data={formData.photos}
            onChange={(data) => setFormData(prev => ({ ...prev, photos: data.photos }))}
          />
        );

      case 'policies':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                {renderRequiredLabel('Check-in Time')}
                <TimePicker
                  onChange={value => setFormData(prev => ({ ...prev, check_in_time: value }))}
                  value={formData.check_in_time}
                  className="mt-1 block w-full"
                  disableClock
                  clearIcon={null}
                  required
                />
              </div>

              <div>
                {renderRequiredLabel('Check-out Time')}
                <TimePicker
                  onChange={value => setFormData(prev => ({ ...prev, check_out_time: value }))}
                  value={formData.check_out_time}
                  className="mt-1 block w-full"
                  disableClock
                  clearIcon={null}
                  required
                />
              </div>
            </div>

            <div>
              {renderRequiredLabel('Cancellation Policy')}
              <select
                name="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {CANCELLATION_POLICIES.map(policy => (
                  <option key={policy.value} value={policy.value}>{policy.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pet Policy</label>
              <textarea
                name="pet_policy"
                value={formData.pet_policy}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Describe your pet policy..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Event Policy</label>
              <textarea
                name="event_policy"
                value={formData.event_policy}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Describe your event policy..."
              />
            </div>
          </div>
        );

      case 'additional':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Base Price per Night</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {LANGUAGES.map(language => (
                  <label key={language} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.languages_spoken?.includes(language)}
                      onChange={() => handleLanguageToggle(language)}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Property is Active and Available for Booking</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      toast.error('Please login to create a property');
      navigate('/login');
    }
  }, [user, navigate]);

  // Update host_id when user changes
  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({
        ...prev,
        host_id: user.id
      }));
    }
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">List Your Property</h1>
          <p className="mt-2 text-sm text-gray-600">Fill in the details below to list your property.</p>
        </div>

        <div className="mb-8">
          <nav className="flex justify-center">
            <ol className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      index === currentStep
                        ? 'bg-primary-600 text-white'
                        : index < currentStep
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-4 text-sm font-medium ${
                      index === currentStep ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="ml-4 h-0.5 w-8 bg-gray-200" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {renderStepContent()}
        </div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Back
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              onClick={(e) => {
                console.log('Submit button clicked'); // Debug log
                handleSubmit(e);
              }}
            >
              Create Property
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListProperty;
