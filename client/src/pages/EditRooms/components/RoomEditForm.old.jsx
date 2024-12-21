import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon,
  HomeIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  WifiIcon,
  TvIcon,
  LockClosedIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  SparklesIcon,
  MapPinIcon,
} from '@heroicons/react/20/solid';

const BED_TYPES = [
  'Single Bed',
  'Double Bed',
  'Queen Bed',
  'King Bed',
  'Sofa Bed',
  'Bunk Bed',
];

const BATHROOM_TYPES = [
  { value: 'private', label: 'Private Bathroom' },
  { value: 'shared', label: 'Shared Bathroom' },
];

const ROOM_TYPES = [
  'Standard Room',
  'Deluxe Room',
  'Suite',
  'Family Room',
  'Single Room',
  'Double Room',
  'Studio',
  'Penthouse',
];

const VIEW_TYPES = [
  'City View',
  'Garden View',
  'Ocean View',
  'Mountain View',
  'Pool View',
  'No View',
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: WifiIcon },
  { id: 'tv', label: 'TV', icon: TvIcon },
  { id: 'safe', label: 'Safe', icon: LockClosedIcon },
  { id: 'coffee_maker', label: 'Coffee Maker', icon: BeakerIcon },
  { id: 'work_desk', label: 'Work Desk', icon: ComputerDesktopIcon },
  { id: 'telephone', label: 'Telephone', icon: PhoneIcon },
  { id: 'air_conditioning', label: 'Air Conditioning', icon: SparklesIcon },
  { id: 'minibar', label: 'Minibar', icon: BeakerIcon },
  { id: 'room_service', label: 'Room Service', icon: SparklesIcon },
];

const CLEANING_FREQUENCIES = [
  'daily',
  'every_2_days',
  'every_3_days',
  'weekly',
  'on_request',
];

const RoomEditForm = ({ room, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: ROOM_TYPES[0],
    beds: [],
    max_occupancy: 1,
    base_price: '',
    cleaning_fee: '',
    service_fee: '',
    tax_rate: '',
    security_deposit: '',
    description: '',
    bathroom_type: 'private',
    amenities: [],
    room_size: '',
    view_type: VIEW_TYPES[0],
    floor_level: 1,
    cleaning_frequency: CLEANING_FREQUENCIES[0],
    has_balcony: false,
    has_kitchen: false,
    has_minibar: false,
    includes_breakfast: false,
    extra_bed_available: false,
    pets_allowed: false,
    smoking_allowed: false,
    accessibility_features: [],
  });

  useEffect(() => {
    if (room) {
      setFormData({
        ...room,
        beds: Array.isArray(room.beds) ? room.beds : [],
        base_price: room.base_price?.toString() || '',
        cleaning_fee: room.cleaning_fee?.toString() || '',
        service_fee: room.service_fee?.toString() || '',
        tax_rate: room.tax_rate?.toString() || '',
        security_deposit: room.security_deposit?.toString() || '',
        max_occupancy: room.max_occupancy?.toString() || '1',
        room_size: room.room_size?.toString() || '',
        floor_level: room.floor_level?.toString() || '1',
        amenities: room.amenities || [],
        accessibility_features: room.accessibility_features || [],
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBedChange = (index, field, value) => {
    const newBeds = [...formData.beds];
    if (!newBeds[index]) {
      newBeds[index] = { type: BED_TYPES[0], count: 1 };
    }
    newBeds[index][field] = field === 'count' ? parseInt(value, 10) || 1 : value;
    setFormData((prev) => ({
      ...prev,
      beds: newBeds,
    }));
  };

  const addBed = () => {
    setFormData((prev) => ({
      ...prev,
      beds: [...prev.beds, { type: BED_TYPES[0], count: 1 }],
    }));
  };

  const removeBed = (index) => {
    setFormData((prev) => ({
      ...prev,
      beds: prev.beds.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (amenityId) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = () => {
    const dataToSubmit = {
      ...formData,
      base_price: parseFloat(formData.base_price) || 0,
      cleaning_fee: parseFloat(formData.cleaning_fee) || 0,
      service_fee: parseFloat(formData.service_fee) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      security_deposit: parseFloat(formData.security_deposit) || 0,
      max_occupancy: parseInt(formData.max_occupancy, 10) || 1,
    };
    onUpdate(dataToSubmit);
  };

  const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center space-x-2 mb-4">
      <Icon className="h-6 w-6 text-primary-600" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <SectionTitle icon={HomeIcon} title="Basic Information" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Room Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Room Name
              </label>
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

            {/* Room Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Room Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
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
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Beds */}
        <div className="space-y-4">
          <SectionTitle icon={BuildingOffice2Icon} title="Sleeping Arrangements" />
          <div className="space-y-3">
            {formData.beds.map((bed, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                <select
                  value={bed.type}
                  onChange={(e) => handleBedChange(index, 'type', e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  {BED_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={bed.count}
                  onChange={(e) => handleBedChange(index, 'count', e.target.value)}
                  min="1"
                  className="w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeBed(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addBed}
              className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Bed
            </button>
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-4">
          <SectionTitle icon={InformationCircleIcon} title="Amenities" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AMENITIES.map(({ id, label, icon: Icon }) => (
              <div key={id} className="relative flex items-start">
                <div className="flex items-center h-6">
                  <input
                    id={id}
                    type="checkbox"
                    checked={formData.amenities.includes(id)}
                    onChange={() => toggleAmenity(id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                </div>
                <div className="ml-3 flex items-center">
                  <Icon className="h-5 w-5 text-gray-400 mr-2" />
                  <label htmlFor={id} className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Size and Floor Level */}
        <div className="space-y-4">
          <SectionTitle icon={MapPinIcon} title="Room Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="room_size" className="block text-sm font-medium text-gray-700">
                Room Size (sq ft)
              </label>
              <input
                type="number"
                id="room_size"
                name="room_size"
                value={formData.room_size}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="floor_level" className="block text-sm font-medium text-gray-700">
                Floor Level
              </label>
              <input
                type="number"
                id="floor_level"
                name="floor_level"
                value={formData.floor_level}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="view_type" className="block text-sm font-medium text-gray-700">
                View Type
              </label>
              <select
                id="view_type"
                name="view_type"
                value={formData.view_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {VIEW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="space-y-4">
          <SectionTitle icon={SparklesIcon} title="Additional Features" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-6">
                <input
                  id="has_balcony"
                  name="has_balcony"
                  type="checkbox"
                  checked={formData.has_balcony}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="has_balcony" className="text-sm font-medium text-gray-700">
                  Balcony
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-6">
                <input
                  id="has_kitchen"
                  name="has_kitchen"
                  type="checkbox"
                  checked={formData.has_kitchen}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="has_kitchen" className="text-sm font-medium text-gray-700">
                  Kitchen
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-6">
                <input
                  id="includes_breakfast"
                  name="includes_breakfast"
                  type="checkbox"
                  checked={formData.includes_breakfast}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="includes_breakfast" className="text-sm font-medium text-gray-700">
                  Breakfast Included
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-6">
                <input
                  id="extra_bed_available"
                  name="extra_bed_available"
                  type="checkbox"
                  checked={formData.extra_bed_available}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="extra_bed_available" className="text-sm font-medium text-gray-700">
                  Extra Bed Available
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-6">
                <input
                  id="pets_allowed"
                  name="pets_allowed"
                  type="checkbox"
                  checked={formData.pets_allowed}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="pets_allowed" className="text-sm font-medium text-gray-700">
                  Pets Allowed
                </label>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex items-center h-6">
                <input
                  id="smoking_allowed"
                  name="smoking_allowed"
                  type="checkbox"
                  checked={formData.smoking_allowed}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="smoking_allowed" className="text-sm font-medium text-gray-700">
                  Smoking Allowed
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cleaning Frequency */}
        <div className="space-y-4">
          <SectionTitle icon={SparklesIcon} title="Cleaning Service" />
          <div>
            <label htmlFor="cleaning_frequency" className="block text-sm font-medium text-gray-700">
              Cleaning Frequency
            </label>
            <select
              id="cleaning_frequency"
              name="cleaning_frequency"
              value={formData.cleaning_frequency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              {CLEANING_FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {frequency.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bathroom Type */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bathroom_type" className="block text-sm font-medium text-gray-700">
                Bathroom Type
              </label>
              <select
                id="bathroom_type"
                name="bathroom_type"
                value={formData.bathroom_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {BATHROOM_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="max_occupancy" className="block text-sm font-medium text-gray-700">
                Maximum Occupancy
              </label>
              <input
                type="number"
                id="max_occupancy"
                name="max_occupancy"
                value={formData.max_occupancy}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <SectionTitle icon={CurrencyDollarIcon} title="Pricing & Fees" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">
                Base Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  min="0"
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="cleaning_fee" className="block text-sm font-medium text-gray-700">
                Cleaning Fee
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="cleaning_fee"
                  name="cleaning_fee"
                  value={formData.cleaning_fee}
                  onChange={handleChange}
                  min="0"
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="security_deposit" className="block text-sm font-medium text-gray-700">
                Security Deposit
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="security_deposit"
                  name="security_deposit"
                  value={formData.security_deposit}
                  onChange={handleChange}
                  min="0"
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {room ? 'Save Changes' : 'Add Room'}
          </button>
          {room && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Room
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RoomEditForm;
