import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const PROPERTY_TYPES = [
  'hotel',
  'apartment',
  'villa',
  'resort',
  'guesthouse',
  'hostel',
  'house',
  'condo',
  'townhouse',
  'cabin',
  'cottage',
  'bungalow',
  'mansion',
  'castle',
  'farm',
  'ranch',
  'boat',
  'treehouse',
  'yurt',
  'tent',
  'other'
];

const BasicInfoEdit = ({ property, onUpdate, disabled }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_type: PROPERTY_TYPES[0],
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    star_rating: 0
  });

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        description: property.description || '',
        property_type: property.property_type || PROPERTY_TYPES[0],
        guests: property.guests || 1,
        bedrooms: property.bedrooms || 1,
        beds: property.beds || 1,
        bathrooms: property.bathrooms || 1,
        star_rating: property.star_rating || 0
      });
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a clean object with only modified fields
    const updateData = {};
    
    // Only include fields that have valid values
    if (formData.name) updateData.name = formData.name.trim();
    if (formData.description) updateData.description = formData.description.trim();
    if (formData.property_type) updateData.property_type = formData.property_type;
    
    // Handle numeric fields - only include if they are valid numbers
    if (formData.guests !== '') updateData.guests = parseInt(formData.guests) || 1;
    if (formData.bedrooms !== '') updateData.bedrooms = parseInt(formData.bedrooms) || 1;
    if (formData.beds !== '') updateData.beds = parseInt(formData.beds) || 1;
    if (formData.bathrooms !== '') updateData.bathrooms = parseFloat(formData.bathrooms) || 1;
    if (formData.star_rating !== '') updateData.star_rating = parseFloat(formData.star_rating) || 0;
    
    console.log('[BasicInfoEdit] Form submitted');
    console.log('[BasicInfoEdit] Original form data:', formData);
    console.log('[BasicInfoEdit] Cleaned data to send:', updateData);
    
    try {
      await onUpdate('basic', updateData);
      console.log('[BasicInfoEdit] Update completed successfully');
    } catch (error) {
      console.error('[BasicInfoEdit] Error during update:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Property Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          disabled={disabled}
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Property Type */}
      <div>
        <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">
          Property Type
        </label>
        <select
          name="property_type"
          id="property_type"
          required
          disabled={disabled}
          value={formData.property_type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Capacity and Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div>
          <label htmlFor="guests" className="block text-sm font-medium text-gray-700">
            Max Guests
          </label>
          <input
            type="number"
            name="guests"
            id="guests"
            min="1"
            required
            disabled={disabled}
            value={formData.guests}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
            Bedrooms
          </label>
          <input
            type="number"
            name="bedrooms"
            id="bedrooms"
            min="0"
            required
            disabled={disabled}
            value={formData.bedrooms}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="beds" className="block text-sm font-medium text-gray-700">
            Beds
          </label>
          <input
            type="number"
            name="beds"
            id="beds"
            min="1"
            required
            disabled={disabled}
            value={formData.beds}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
            Bathrooms
          </label>
          <input
            type="number"
            name="bathrooms"
            id="bathrooms"
            min="0"
            step="0.5"
            required
            disabled={disabled}
            value={formData.bathrooms}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="star_rating" className="block text-sm font-medium text-gray-700">
            Star Rating
          </label>
          <input
            type="number"
            name="star_rating"
            id="star_rating"
            min="0"
            max="5"
            step="0.5"
            required
            disabled={disabled}
            value={formData.star_rating}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
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
          required
          disabled={disabled}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

BasicInfoEdit.propTypes = {
  property: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default BasicInfoEdit; 