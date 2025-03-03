import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/20/solid';

const ROOM_TYPES = ['Standard Room', 'Deluxe Room', 'Suite', 'Studio', 'Villa'];
const BED_TYPES = ['Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Bunk Bed'];
const VIEW_TYPES = ['City View', 'Ocean View', 'Garden View', 'Mountain View', 'Pool View'];
const BATHROOM_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'en-suite', label: 'En-suite' },
  { value: 'jack-and-jill', label: 'Jack and Jill' },
  { value: 'split', label: 'Split' }
];
const CANCELLATION_POLICIES = ['flexible', 'moderate', 'strict'];
const CLEANING_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'on_request'];
const FLOORING_TYPES = ['Carpet', 'Hardwood', 'Tile', 'Marble', 'Concrete'];
const ROOM_STATUS = ['available', 'occupied', 'maintenance', 'blocked'];

const PEOPLE_PER_BED = {
  'Single Bed': 1,
  'Double Bed': 2,
  'Queen Bed': 2,
  'King Bed': 2,
  'Bunk Bed': 2
};

const RoomForm = ({ room, onSubmit, onClose }) => {
  console.log('Room prop received:', room); // Debug log

  const [formData, setFormData] = useState({
    name: '',
    room_type: '',
    price_per_night: '',
    max_occupancy: '',
    description: '',
    amenities: [],
    beds: [{ type: 'Single Bed', count: 1 }],
    bathroom_type: 'private',
    room_size: '',
    floor_level: '',
    status: 'available',
    view_type: 'No View',
    flooring_type: 'Carpet',
    base_price: '',
    has_private_bathroom: true,
    smoking: false,
    has_balcony: false,
    has_kitchen: false,
    has_minibar: false,
    includes_breakfast: false,
    extra_bed_available: false,
    pets_allowed: false,
    has_toiletries: true,
    has_towels_linens: true,
    has_room_service: false,
    cleaning_frequency: 'daily',
    cancellation_policy: 'flexible'
  });

  useEffect(() => {
    if (room) {
      console.log('[RoomForm] Setting form data with room:', room);
      
      // Parse JSON strings if needed
      const parseBeds = (beds) => {
        console.log('[RoomForm] Parsing beds:', beds);
        if (!beds) return [{ type: 'Single Bed', count: 1 }];
        try {
          if (Array.isArray(beds)) return beds;
          const parsed = JSON.parse(beds);
          return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ type: 'Single Bed', count: 1 }];
        } catch (e) {
          console.error('[RoomForm] Error parsing beds:', e);
          return [{ type: 'Single Bed', count: 1 }];
        }
      };

      const parseArray = (value) => {
        console.log('[RoomForm] Parsing array:', value);
        if (!value) return [];
        try {
          if (Array.isArray(value)) return value;
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('[RoomForm] Error parsing array:', e);
          return [];
        }
      };

      // Initialize form data with room data
      const initialData = {
        id: room.id,
        property_id: room.property_id,
        name: room.name || '',
        room_type: room.room_type || 'Standard Room',
        price_per_night: room.price_per_night || '',
        base_price: room.base_price || '',
        max_occupancy: room.max_occupancy || 2,
        description: room.description || '',
        bathroom_type: room.bathroom_type || 'private',
        room_size: room.room_size || '',
        floor_level: room.floor_level || 1,
        status: room.status || 'available',
        view_type: room.view_type || 'No View',
        flooring_type: room.flooring_type || 'Carpet',
        cleaning_frequency: room.cleaning_frequency || 'daily',
        cancellation_policy: room.cancellation_policy || 'flexible',
        has_private_bathroom: Boolean(room.has_private_bathroom),
        smoking: Boolean(room.smoking),
        has_balcony: Boolean(room.has_balcony),
        has_kitchen: Boolean(room.has_kitchen),
        has_minibar: Boolean(room.has_minibar),
        includes_breakfast: Boolean(room.includes_breakfast),
        extra_bed_available: Boolean(room.extra_bed_available),
        pets_allowed: Boolean(room.pets_allowed),
        has_toiletries: room.has_toiletries !== false,
        has_towels_linens: room.has_towels_linens !== false,
        has_room_service: Boolean(room.has_room_service),
        beds: parseBeds(room.beds),
        amenities: parseArray(room.amenities),
        accessibility_features: parseArray(room.accessibility_features),
        energy_saving_features: parseArray(room.energy_saving_features),
        images: parseArray(room.images)
      };
      
      console.log('[RoomForm] Parsed form data:', initialData);

      console.log('[RoomForm] Initialized form data:', initialData);
      setFormData(initialData);
    }
  }, [room]);

  console.log('Current form data:', formData); // Debug log

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateCapacity = (beds) => {
    return beds.reduce((total, bed) => {
      return total + (bed.count * (PEOPLE_PER_BED[bed.type] || 1));
    }, 0);
  };

  const handleBedChange = (index, field, value) => {
    const newBeds = [...formData.beds];
    newBeds[index] = {
      ...newBeds[index],
      [field]: field === 'count' ? parseInt(value) || 1 : value
    };
    const newCapacity = calculateCapacity(newBeds);
    setFormData(prev => ({
      ...prev,
      beds: newBeds,
      max_occupancy: newCapacity
    }));
  };

  const handleAddBed = () => {
    const newBeds = [...formData.beds, { type: 'Single Bed', count: 1 }];
    const newCapacity = calculateCapacity(newBeds);
    setFormData(prev => ({
      ...prev,
      beds: newBeds,
      max_occupancy: newCapacity
    }));
  };

  const handleRemoveBed = (index) => {
    const newBeds = formData.beds.filter((_, i) => i !== index);
    const newCapacity = calculateCapacity(newBeds);
    setFormData(prev => ({
      ...prev,
      beds: newBeds,
      max_occupancy: newCapacity
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => {
      const amenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format the data before submission
    const submissionData = {
      ...formData,
      // Ensure numeric values
      price_per_night: Number(formData.price_per_night) || 0,
      base_price: Number(formData.base_price) || 0,
      max_occupancy: Number(formData.max_occupancy) || 2,
      floor_level: Number(formData.floor_level) || 1,
      room_size: Number(formData.room_size) || 0,
      
      // Ensure arrays are properly formatted
      beds: Array.isArray(formData.beds) ? formData.beds : [],
      amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
      accessibility_features: Array.isArray(formData.accessibility_features) ? formData.accessibility_features : [],
      energy_saving_features: Array.isArray(formData.energy_saving_features) ? formData.energy_saving_features : [],
      
      // Ensure boolean values
      has_private_bathroom: Boolean(formData.has_private_bathroom),
      smoking: Boolean(formData.smoking),
      has_balcony: Boolean(formData.has_balcony),
      has_kitchen: Boolean(formData.has_kitchen),
      has_minibar: Boolean(formData.has_minibar),
      includes_breakfast: Boolean(formData.includes_breakfast),
      extra_bed_available: Boolean(formData.extra_bed_available),
      pets_allowed: Boolean(formData.pets_allowed),
      has_toiletries: Boolean(formData.has_toiletries),
      has_towels_linens: Boolean(formData.has_towels_linens),
      has_room_service: Boolean(formData.has_room_service),
      room_size: Number(formData.room_size) || 0,
      floor_level: Number(formData.floor_level) || 1,
      max_occupancy: Number(formData.max_occupancy) || 2,
      // Ensure arrays are properly formatted
      beds: formData.beds || [{ type: 'Single Bed', count: 1 }],
      amenities: formData.amenities || [],
      accessibility_features: formData.accessibility_features || [],
      energy_saving_features: formData.energy_saving_features || [],
      images: formData.images || [],
      // Ensure boolean values
      has_private_bathroom: Boolean(formData.has_private_bathroom),
      smoking: Boolean(formData.smoking),
      has_balcony: Boolean(formData.has_balcony),
      has_kitchen: Boolean(formData.has_kitchen),
      has_minibar: Boolean(formData.has_minibar),
      includes_breakfast: Boolean(formData.includes_breakfast),
      extra_bed_available: Boolean(formData.extra_bed_available),
      pets_allowed: Boolean(formData.pets_allowed),
      has_toiletries: Boolean(formData.has_toiletries),
      has_towels_linens: Boolean(formData.has_towels_linens),
      has_room_service: Boolean(formData.has_room_service)
    };
    // Prepare data for submission by ensuring proper format of complex fields
    const preparedData = {
      ...submissionData,
      // Ensure arrays are properly formatted
      beds: Array.isArray(submissionData.beds) ? submissionData.beds : parseBeds(submissionData.beds),
      amenities: Array.isArray(submissionData.amenities) ? submissionData.amenities : parseArray(submissionData.amenities),
      accessibility_features: Array.isArray(submissionData.accessibility_features) ? submissionData.accessibility_features : [],
      energy_saving_features: Array.isArray(submissionData.energy_saving_features) ? submissionData.energy_saving_features : [],
      images: Array.isArray(submissionData.images) ? submissionData.images : [],
      climate: submissionData.climate || { type: 'ac', available: true },
      // Ensure required fields have default values
      room_type: submissionData.room_type || 'Standard Room',
      bathroom_type: submissionData.bathroom_type || 'private',
      status: submissionData.status || 'available',
      view_type: submissionData.view_type || 'No View',
      flooring_type: submissionData.flooring_type || 'Carpet',
      cleaning_frequency: submissionData.cleaning_frequency || 'daily',
      cancellation_policy: submissionData.cancellation_policy || 'flexible'
    };

    console.log('[RoomForm] Submitting prepared data:', preparedData);
    onSubmit(preparedData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle bg-white rounded-lg shadow-xl transform transition-all">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">{room ? 'Edit Room' : 'Add Room'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Room Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="room_type" className="block text-sm font-medium text-gray-700">Room Type</label>
                    <select
                      id="room_type"
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a type</option>
                      {ROOM_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700">Price per Night</label>
                    <input
                      type="number"
                      id="price_per_night"
                      name="price_per_night"
                      value={formData.price_per_night}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="room_size" className="block text-sm font-medium text-gray-700">Room Size (sq ft)</label>
                    <input
                      type="number"
                      id="room_size"
                      name="room_size"
                      value={formData.room_size}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="floor_level" className="block text-sm font-medium text-gray-700">Floor Level</label>
                    <input
                      type="number"
                      id="floor_level"
                      name="floor_level"
                      value={formData.floor_level}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      {ROOM_STATUS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Bed Configuration</h3>
                <div className="space-y-4">
                  {formData.beds.map((bed, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Bed Type</label>
                        <select
                          value={bed.type}
                          onChange={(e) => handleBedChange(index, 'type', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {BED_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700">Count</label>
                        <input
                          type="number"
                          value={bed.count}
                          onChange={(e) => handleBedChange(index, 'count', e.target.value)}
                          min="1"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBed(index)}
                        className="h-10 px-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddBed}
                  className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Bed
                </button>

                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Maximum Occupancy</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formData.max_occupancy} {formData.max_occupancy === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Room Features</h3>
                <div>
                  <label htmlFor="bathroom_type" className="block text-sm font-medium text-gray-700">Bathroom Type</label>
                  <select
                    id="bathroom_type"
                    name="bathroom_type"
                    value={formData.bathroom_type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    {BATHROOM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="view_type" className="block text-sm font-medium text-gray-700">View Type</label>
                  <select
                    id="view_type"
                    name="view_type"
                    value={formData.view_type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    {VIEW_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="flooring_type" className="block text-sm font-medium text-gray-700">Flooring Type</label>
                  <select
                    id="flooring_type"
                    name="flooring_type"
                    value={formData.flooring_type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    {FLOORING_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Balcony', 'Sea View', 'Kitchen', 'Private Bathroom'].map(amenity => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  {room ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

RoomForm.propTypes = {
  room: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RoomForm;
