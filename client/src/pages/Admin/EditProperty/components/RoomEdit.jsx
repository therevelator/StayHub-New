import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ROOM_TYPES = [
  'Standard Room',
  'Deluxe Room',
  'Suite',
  'Studio',
  'Villa',
  'Apartment',
  'Penthouse'
];

const BED_TYPES = [
  'Single Bed',
  'Double Bed',
  'Queen Bed',
  'King Bed',
  'Bunk Bed',
  'Sofa Bed'
];

const VIEW_TYPES = [
  'City View',
  'Ocean View',
  'Garden View',
  'Mountain View',
  'Pool View',
  'No View'
];

const BATHROOM_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' }
];

const CLEANING_FREQUENCIES = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'on_request',
  'before_check_in'
];

const FLOORING_TYPES = [
  'Carpet',
  'Hardwood',
  'Tile',
  'Marble',
  'Concrete',
  'Laminate'
];

const ROOM_STATUS = [
  'available',
  'occupied',
  'maintenance',
  'blocked'
];

const CANCELLATION_POLICIES = [
  'flexible',
  'moderate',
  'strict'
];

const RoomEdit = ({ room, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    room_type: ROOM_TYPES[0],
    beds: [{ type: BED_TYPES[0], count: 1 }],
    max_occupancy: 1,
    base_price: '',
    cleaning_fee: '',
    service_fee: '',
    tax_rate: '',
    security_deposit: '',
    description: '',
    bathroom_type: BATHROOM_TYPES[0].value,
    view_type: VIEW_TYPES[0],
    has_private_bathroom: true,
    smoking: false,
    accessibility_features: [],
    floor_level: '',
    has_balcony: false,
    has_kitchen: false,
    has_minibar: false,
    climate: { hasHeating: false, hasCooling: false },
    price_per_night: '',
    cancellation_policy: CANCELLATION_POLICIES[0],
    includes_breakfast: false,
    extra_bed_available: false,
    pets_allowed: false,
    images: [],
    cleaning_frequency: CLEANING_FREQUENCIES[0],
    has_toiletries: false,
    has_towels_linens: false,
    has_room_service: false,
    flooring_type: FLOORING_TYPES[0],
    energy_saving_features: [],
    status: ROOM_STATUS[0],
    room_size: '',
    amenities: []
  });

  useEffect(() => {
    if (room) {
      setFormData({
        ...room,
        beds: typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds || [{ type: BED_TYPES[0], count: 1 }],
        climate: typeof room.climate === 'string' ? JSON.parse(room.climate) : room.climate || { hasHeating: false, hasCooling: false },
        accessibility_features: typeof room.accessibility_features === 'string' ? JSON.parse(room.accessibility_features) : room.accessibility_features || [],
        energy_saving_features: typeof room.energy_saving_features === 'string' ? JSON.parse(room.energy_saving_features) : room.energy_saving_features || [],
        amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities || []
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBedChange = (index, field, value) => {
    const newBeds = [...formData.beds];
    newBeds[index] = {
      ...newBeds[index],
      [field]: field === 'count' ? parseInt(value) || 1 : value
    };
    setFormData(prev => ({
      ...prev,
      beds: newBeds
    }));
  };

  const handleAddBed = () => {
    setFormData(prev => ({
      ...prev,
      beds: [...prev.beds, { type: BED_TYPES[0], count: 1 }]
    }));
  };

  const handleRemoveBed = (index) => {
    setFormData(prev => ({
      ...prev,
      beds: prev.beds.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (feature, type) => {
    const field = type === 'accessibility' ? 'accessibility_features' : 'energy_saving_features';
    setFormData(prev => {
      const features = prev[field];
      const newFeatures = features.includes(feature)
        ? features.filter(f => f !== feature)
        : [...features, feature];
      return {
        ...prev,
        [field]: newFeatures
      };
    });
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => {
      const amenities = prev.amenities;
      const newAmenities = amenities.includes(amenity)
        ? amenities.filter(a => a !== amenity)
        : [...amenities, amenity];
      return {
        ...prev,
        amenities: newAmenities
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Room Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="room_type" className="block text-sm font-medium text-gray-700">
            Room Type
          </label>
          <select
            name="room_type"
            id="room_type"
            required
            value={formData.room_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            id="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {ROOM_STATUS.map((status) => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="room_size" className="block text-sm font-medium text-gray-700">
            Room Size (sq ft)
          </label>
          <input
            type="number"
            name="room_size"
            id="room_size"
            min="0"
            value={formData.room_size}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Bed Configuration */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Bed Configuration</h3>
          <button
            type="button"
            onClick={handleAddBed}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Bed
          </button>
        </div>

        <div className="space-y-4">
          {formData.beds.map((bed, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <select
                  value={bed.type}
                  onChange={(e) => handleBedChange(index, 'type', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  {BED_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="1"
                  value={bed.count}
                  onChange={(e) => handleBedChange(index, 'count', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBed(index)}
                className="p-2 text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="price_per_night" className="block text-sm font-medium text-gray-700">
            Price per Night
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="price_per_night"
              id="price_per_night"
              required
              min="0"
              step="0.01"
              value={formData.price_per_night}
              onChange={handleChange}
              className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cleaning_fee" className="block text-sm font-medium text-gray-700">
            Cleaning Fee
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="cleaning_fee"
              id="cleaning_fee"
              min="0"
              step="0.01"
              value={formData.cleaning_fee}
              onChange={handleChange}
              className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="service_fee" className="block text-sm font-medium text-gray-700">
            Service Fee
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="service_fee"
              id="service_fee"
              min="0"
              step="0.01"
              value={formData.service_fee}
              onChange={handleChange}
              className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Features and Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Features
          </label>
          <div className="space-y-2">
            {[
              { name: 'has_private_bathroom', label: 'Private Bathroom' },
              { name: 'has_balcony', label: 'Balcony' },
              { name: 'has_kitchen', label: 'Kitchen' },
              { name: 'has_minibar', label: 'Minibar' },
              { name: 'has_toiletries', label: 'Toiletries' },
              { name: 'has_towels_linens', label: 'Towels & Linens' },
              { name: 'has_room_service', label: 'Room Service' },
              { name: 'includes_breakfast', label: 'Breakfast Included' },
              { name: 'extra_bed_available', label: 'Extra Bed Available' },
              { name: 'pets_allowed', label: 'Pets Allowed' },
              { name: 'smoking', label: 'Smoking Allowed' }
            ].map((feature) => (
              <div key={feature.name} className="flex items-center">
                <input
                  type="checkbox"
                  id={feature.name}
                  name={feature.name}
                  checked={formData[feature.name]}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor={feature.name} className="ml-2 block text-sm text-gray-900">
                  {feature.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Climate Control
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasHeating"
                checked={formData.climate.hasHeating}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  climate: { ...prev.climate, hasHeating: e.target.checked }
                }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="hasHeating" className="ml-2 block text-sm text-gray-900">
                Heating
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasCooling"
                checked={formData.climate.hasCooling}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  climate: { ...prev.climate, hasCooling: e.target.checked }
                }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="hasCooling" className="ml-2 block text-sm text-gray-900">
                Air Conditioning
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="bathroom_type" className="block text-sm font-medium text-gray-700">
            Bathroom Type
          </label>
          <select
            name="bathroom_type"
            id="bathroom_type"
            required
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
          <label htmlFor="view_type" className="block text-sm font-medium text-gray-700">
            View Type
          </label>
          <select
            name="view_type"
            id="view_type"
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
          <label htmlFor="cleaning_frequency" className="block text-sm font-medium text-gray-700">
            Cleaning Frequency
          </label>
          <select
            name="cleaning_frequency"
            id="cleaning_frequency"
            value={formData.cleaning_frequency}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {CLEANING_FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency.charAt(0).toUpperCase() + frequency.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="flooring_type" className="block text-sm font-medium text-gray-700">
            Flooring Type
          </label>
          <select
            name="flooring_type"
            id="flooring_type"
            value={formData.flooring_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {FLOORING_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {room ? 'Update Room' : 'Create Room'}
        </button>
      </div>
    </form>
  );
};

RoomEdit.propTypes = {
  room: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default RoomEdit; 