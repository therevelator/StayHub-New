import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

const BATHROOM_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'en-suite', label: 'En-suite' },
  { value: 'jack-and-jill', label: 'Jack and Jill' },
  { value: 'split', label: 'Split' }
];

const PEOPLE_PER_BED = {
  'Single Bed': 1,
  'Double Bed': 2,
  'Queen Bed': 2,
  'King Bed': 2,
  'Bunk Bed': 2
};

const RoomForm = ({ room, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    price: '',
    capacity: '',
    description: '',
    amenities: [],
    beds: [{ type: 'Single Bed', count: 1 }],
    bathroomType: 'private',
    ...room
  });

  const roomTypes = [
    'Single Room',
    'Double Room',
    'Suite',
    'Deluxe Room',
    'Family Room',
    'Studio',
    'Apartment'
  ];

  const bedTypes = [
    'Single Bed',
    'Double Bed',
    'Queen Bed',
    'King Bed',
    'Bunk Bed'
  ];

  const amenitiesList = [
    'Wi-Fi',
    'TV',
    'Air Conditioning',
    'Mini Bar',
    'Safe',
    'Balcony',
    'Sea View',
    'Kitchen',
    'Private Bathroom'
  ];

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
      capacity: newCapacity
    }));
  };

  const handleAddBed = () => {
    const newBeds = [...formData.beds, { type: 'Single Bed', count: 1 }];
    const newCapacity = calculateCapacity(newBeds);
    setFormData(prev => ({
      ...prev,
      beds: newBeds,
      capacity: newCapacity
    }));
  };

  const handleRemoveBed = (index) => {
    if (formData.beds.length > 1) {
      const newBeds = formData.beds.filter((_, i) => i !== index);
      const newCapacity = calculateCapacity(newBeds);
      setFormData(prev => ({
        ...prev,
        beds: newBeds,
        capacity: newCapacity
      }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      capacity: parseInt(formData.capacity),
      bathroom_type: formData.bathroomType,
      room_type: formData.type.toLowerCase(),
      price_per_night: parseFloat(formData.price),
      max_occupancy: parseInt(formData.capacity),
      amenities: formData.amenities || [],
      beds: formData.beds.map(bed => ({
        type: bed.type,
        count: parseInt(bed.count)
      }))
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {room ? 'Edit Room' : 'Add New Room'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Room Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Room Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a type</option>
            {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Beds Configuration
          </label>
          {formData.beds.map((bed, index) => (
            <div key={index} className="flex items-center gap-4">
              <select
                value={bed.type}
                onChange={(e) => handleBedChange(index, 'type', e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {bedTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="number"
                value={bed.count}
                onChange={(e) => handleBedChange(index, 'count', e.target.value)}
                min="1"
                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveBed(index)}
                className="text-red-600 hover:text-red-800"
                disabled={formData.beds.length === 1}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddBed}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Bed
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price per Night ($)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacity (Guests)
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bathroom Type
          </label>
          <select
            name="bathroomType"
            value={formData.bathroomType}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {BATHROOM_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amenities
          </label>
          <div className="grid grid-cols-3 gap-2">
            {amenitiesList.map(amenity => (
              <label key={amenity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {room ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomForm; 