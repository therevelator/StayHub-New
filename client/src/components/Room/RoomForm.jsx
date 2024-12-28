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

const RoomForm = ({ initialData, onSubmit, onChange, onClose }) => {
  if (typeof onSubmit !== 'function') {
    console.error('RoomForm: onSubmit prop must be a function');
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    name: initialData?.name || '',
    room_type: initialData?.room_type || ROOM_TYPES[0],
    status: initialData?.status || ROOM_STATUS[0],
    beds: initialData?.beds ? 
      (typeof initialData.beds === 'string' ? 
        JSON.parse(initialData.beds) : 
        Array.isArray(initialData.beds) ? 
          initialData.beds : 
          [initialData.beds]
      ) : 
      [{ type: BED_TYPES[0], count: 1 }],
    max_occupancy: initialData?.max_occupancy || 1,
    base_price: initialData?.base_price || '',
    cleaning_fee: initialData?.cleaning_fee || '',
    service_fee: initialData?.service_fee || '',
    tax_rate: initialData?.tax_rate || '',
    security_deposit: initialData?.security_deposit || '',
    price_per_night: initialData?.price_per_night || '',
    cancellation_policy: initialData?.cancellation_policy || CANCELLATION_POLICIES[0],
    description: initialData?.description || '',
    bathroom_type: initialData?.bathroom_type || 'private',
    view_type: initialData?.view_type || VIEW_TYPES[0],
    has_private_bathroom: initialData?.has_private_bathroom === 1,
    smoking: initialData?.smoking === 1,
    accessibility_features: initialData?.accessibility_features ? 
      (typeof initialData.accessibility_features === 'string' ? 
        JSON.parse(initialData.accessibility_features) : 
        Array.isArray(initialData.accessibility_features) ?
          initialData.accessibility_features :
          []
      ) : 
      [],
    energy_saving_features: initialData?.energy_saving_features ?
      (typeof initialData.energy_saving_features === 'string' ?
        JSON.parse(initialData.energy_saving_features) :
        Array.isArray(initialData.energy_saving_features) ?
          initialData.energy_saving_features :
          []
      ) :
      [],
    amenities: initialData?.amenities ?
      (typeof initialData.amenities === 'string' ?
        JSON.parse(initialData.amenities) :
        Array.isArray(initialData.amenities) ?
          initialData.amenities :
          []
      ) :
      [],
    room_size: initialData?.room_size || '',
    floor_level: initialData?.floor_level || '',
    has_balcony: initialData?.has_balcony === 1,
    has_kitchen: initialData?.has_kitchen === 1,
    has_minibar: initialData?.has_minibar === 1,
    has_toiletries: initialData?.has_toiletries === 1,
    has_towels_linens: initialData?.has_towels_linens === 1,
    has_room_service: initialData?.has_room_service === 1,
    includes_breakfast: initialData?.includes_breakfast === 1,
    extra_bed_available: initialData?.extra_bed_available === 1,
    pets_allowed: initialData?.pets_allowed === 1,
    flooring_type: initialData?.flooring_type || FLOORING_TYPES[0],
    cleaning_frequency: initialData?.cleaning_frequency || CLEANING_FREQUENCIES[0],
    images: initialData?.images || [],
    amenity_input: ''
  });

  useEffect(() => {
    if (initialData) {
      console.log('Initial data received:', initialData); // Debug log
      
      try {
        // Initialize beds data
        let initialBeds = initialData.beds;
        
        // If beds is a string, try to parse it
        if (typeof initialData.beds === 'string') {
          console.log('Parsing beds from string:', initialData.beds);
          try {
            initialBeds = JSON.parse(initialData.beds);
          } catch (e) {
            console.error('Failed to parse beds string:', e);
            initialBeds = [{ type: BED_TYPES[0], count: 1 }];
          }
        } 
        // If beds is not an array, use default
        else if (!Array.isArray(initialData.beds)) {
          console.log('Using default bed configuration - not an array:', initialData.beds);
          initialBeds = [{ type: BED_TYPES[0], count: 1 }];
        }
        
        // Validate and normalize each bed entry
        initialBeds = initialBeds.map(bed => {
          // Ensure each bed has type and count
          if (!bed || typeof bed !== 'object') {
            console.warn('Invalid bed entry, using default:', bed);
            return { type: BED_TYPES[0], count: 1 };
          }
          
          return {
            type: bed.type && BED_TYPES.includes(bed.type) ? bed.type : BED_TYPES[0],
            count: parseInt(bed.count) || 1
          };
        });

        console.log('Final beds configuration:', initialBeds);

        // Set the form data with validated beds
        setFormData(prev => ({
          ...prev,
          ...initialData,
          beds: initialBeds,
          max_occupancy: initialBeds.reduce((total, bed) => {
            return total + (bed.count * (PEOPLE_PER_BED[bed.type] || 1));
          }, 0)
        }));

      } catch (error) {
        console.error('Error setting up form data:', error, {
          initialData,
          bedsData: initialData.beds
        });
        
        // Fallback to default configuration
        setFormData(prev => ({
          ...prev,
          ...initialData,
          beds: [{ type: BED_TYPES[0], count: 1 }],
          max_occupancy: PEOPLE_PER_BED[BED_TYPES[0]] || 1
        }));
      }
    }
  }, [initialData]);

  const handleAddBed = () => {
    setFormData(prev => {
      const newBeds = [...prev.beds, { type: BED_TYPES[0], count: 1 }];
      return {
        ...prev,
        beds: newBeds,
        max_occupancy: newBeds.reduce((total, bed) => {
          return total + (bed.count * (PEOPLE_PER_BED[bed.type] || 1));
        }, 0)
      };
    });
  };

  const handleRemoveBed = (index) => {
    setFormData(prev => {
      const newBeds = prev.beds.filter((_, i) => i !== index);
      return {
        ...prev,
        beds: newBeds,
        max_occupancy: newBeds.reduce((total, bed) => {
          return total + (bed.count * (PEOPLE_PER_BED[bed.type] || 1));
        }, 0)
      };
    });
  };

  const handleBedChange = (index, field, value) => {
    setFormData(prev => {
      const newBeds = [...prev.beds];
      newBeds[index] = {
        ...newBeds[index],
        [field]: field === 'count' ? parseInt(value) || 1 : value
      };

      return {
        ...prev,
        beds: newBeds,
        max_occupancy: newBeds.reduce((total, bed) => {
          return total + (bed.count * (PEOPLE_PER_BED[bed.type] || 1));
        }, 0)
      };
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      // Handle file uploads
      const fileList = Array.from(files);
      setFormData(prev => ({
        ...prev,
        images: fileList.map(file => ({
          name: file.name,
          url: URL.createObjectURL(file),
          file
        }))
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If not on the last step, just move to next step
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    try {
      // Remove UI-only fields and prepare data
      const {
        amenity_input,
        room_amenities,
        bed_type,
        created_at,
        updated_at,
        property_id,
        ...restFormData
      } = formData;

      const priceFields = [
        'base_price',
        'cleaning_fee',
        'service_fee',
        'tax_rate',
        'security_deposit',
        'price_per_night'
      ];

      // Convert price fields to numbers or null
      const priceData = {};
      priceFields.forEach(field => {
        const value = restFormData[field];
        priceData[field] = value === '' || value === undefined ? null : parseFloat(value);
      });

      const submissionData = {
        ...restFormData,
        ...priceData,
        // Convert boolean values to 0/1
        has_private_bathroom: restFormData.has_private_bathroom ? 1 : 0,
        has_balcony: restFormData.has_balcony ? 1 : 0,
        has_kitchen: restFormData.has_kitchen ? 1 : 0,
        has_minibar: restFormData.has_minibar ? 1 : 0,
        has_toiletries: restFormData.has_toiletries ? 1 : 0,
        has_towels_linens: restFormData.has_towels_linens ? 1 : 0,
        has_room_service: restFormData.has_room_service ? 1 : 0,
        includes_breakfast: restFormData.includes_breakfast ? 1 : 0,
        extra_bed_available: restFormData.extra_bed_available ? 1 : 0,
        pets_allowed: restFormData.pets_allowed ? 1 : 0,
        smoking: restFormData.smoking ? 1 : 0,
        // Convert numeric strings to numbers
        floor_level: parseInt(restFormData.floor_level) || 0,
        room_size: parseInt(restFormData.room_size) || 0,
        // Stringify arrays and objects
        beds: JSON.stringify(restFormData.beds || []),
        amenities: JSON.stringify(restFormData.amenities || []),
        accessibility_features: JSON.stringify(restFormData.accessibility_features || []),
        energy_saving_features: JSON.stringify(restFormData.energy_saving_features || []),
        images: JSON.stringify(restFormData.images || [])
      };

      console.log('Submitting data:', submissionData);
      
      // Call both onSubmit and onChange with the same data
      if (onSubmit) {
        await onSubmit(submissionData);
      }
      if (onChange) {
        onChange(submissionData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
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
          >
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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
        <div>
          <label htmlFor="room_size" className="block text-sm font-medium text-gray-700">Room Size (sq ft)</label>
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
        <div className="md:col-span-2">
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
    </div>
  );

  const renderBedConfig = () => {
    console.log('Rendering bed config with data:', formData.beds); // Debug log
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Bed Configuration</h3>
        
        <div className="space-y-4">
          {formData.beds.map((bed, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Bed Type
                </label>
                <select
                  value={bed.type}
                  onChange={(e) => handleBedChange(index, 'type', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  {BED_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700">
                  Count
                </label>
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
    );
  };

  const renderPricing = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Pricing & Policies</h3>
      <div>
        <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">Base Price</label>
        <input
          type="number"
          id="base_price"
          name="base_price"
          value={formData.base_price || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
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
        <label htmlFor="cleaning_fee" className="block text-sm font-medium text-gray-700">Cleaning Fee</label>
        <input
          type="number"
          id="cleaning_fee"
          name="cleaning_fee"
          value={formData.cleaning_fee || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="service_fee" className="block text-sm font-medium text-gray-700">Service Fee</label>
        <input
          type="number"
          id="service_fee"
          name="service_fee"
          value={formData.service_fee || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
        <input
          type="number"
          id="tax_rate"
          name="tax_rate"
          value={formData.tax_rate || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="security_deposit" className="block text-sm font-medium text-gray-700">Security Deposit</label>
        <input
          type="number"
          id="security_deposit"
          name="security_deposit"
          value={formData.security_deposit || ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="cancellation_policy" className="block text-sm font-medium text-gray-700">Cancellation Policy</label>
        <select
          id="cancellation_policy"
          name="cancellation_policy"
          value={formData.cancellation_policy}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          {CANCELLATION_POLICIES.map((policy) => (
            <option key={policy} value={policy}>{policy}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderAmenities = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Amenities & Features</h3>
      
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Bathroom & Cleaning</h4>
        <div>
          <label htmlFor="bathroom_type" className="block text-sm font-medium text-gray-700">Bathroom Type</label>
          <select
            id="bathroom_type"
            name="bathroom_type"
            value={formData.bathroom_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {BATHROOM_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cleaning_frequency" className="block text-sm font-medium text-gray-700">Cleaning Frequency</label>
          <select
            id="cleaning_frequency"
            name="cleaning_frequency"
            value={formData.cleaning_frequency}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            {CLEANING_FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>{frequency}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Room Features</h4>
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
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Amenities</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_private_bathroom"
              checked={formData.has_private_bathroom}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Private Bathroom</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_kitchen"
              checked={formData.has_kitchen}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Kitchen</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_balcony"
              checked={formData.has_balcony}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Balcony</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_minibar"
              checked={formData.has_minibar}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Minibar</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_toiletries"
              checked={formData.has_toiletries}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Toiletries</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_towels_linens"
              checked={formData.has_towels_linens}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Towels & Linens</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_room_service"
              checked={formData.has_room_service}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Room Service</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="includes_breakfast"
              checked={formData.includes_breakfast}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Breakfast Included</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="pets_allowed"
              checked={formData.pets_allowed}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Pets Allowed</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="smoking"
              checked={formData.smoking}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Smoking Allowed</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700">Additional Features</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Accessibility Features
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(formData.accessibility_features) && formData.accessibility_features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = formData.accessibility_features.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, accessibility_features: newFeatures }));
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2">
            <input
              type="text"
              name="accessibility_feature_input"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Add accessibility feature"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = e.target.value.trim();
                  if (value) {
                    setFormData(prev => ({
                      ...prev,
                      accessibility_features: Array.isArray(prev.accessibility_features) 
                        ? [...prev.accessibility_features, value]
                        : [value]
                    }));
                    e.target.value = '';
                  }
                }
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Energy Saving Features</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(formData.energy_saving_features) && formData.energy_saving_features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = formData.energy_saving_features.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, energy_saving_features: newFeatures }));
                  }}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2">
            <input
              type="text"
              name="energy_saving_feature_input"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Add energy saving feature"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = e.target.value.trim();
                  if (value) {
                    setFormData(prev => ({
                      ...prev,
                      energy_saving_features: Array.isArray(prev.energy_saving_features) 
                        ? [...prev.energy_saving_features, value]
                        : [value]
                    }));
                    e.target.value = '';
                  }
                }
              }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="amenities" className="block text-sm font-medium text-gray-700">Additional Amenities</label>
          <div className="flex gap-2">
            <input
              type="text"
              id="amenity_input"
              name="amenity_input"
              value={formData.amenity_input}
              onChange={handleChange}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Add amenity..."
            />
            <button
              type="button"
              onClick={() => {
                if (formData.amenity_input.trim()) {
                  setFormData(prev => ({
                    ...prev,
                    amenities: [...prev.amenities, prev.amenity_input.trim()],
                    amenity_input: ''
                  }));
                }
              }}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {formData.amenities.map((amenity, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded-md">
                <span className="text-sm text-gray-700">{amenity}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      amenities: prev.amenities.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderImages = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Room Images</h3>
      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload Images
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary-50 file:text-primary-700
              hover:file:bg-primary-100"
          />
        </label>
      </div>
      {formData.images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {formData.images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={image.url || image}
                alt={`Room image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== index)
                  }));
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle bg-white rounded-lg shadow-xl transform transition-all">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={() => onClose && onClose()}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">{initialData ? 'Edit Room' : 'Add Room'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {currentStep === 1 && renderBasicInfo()}
              {currentStep === 2 && renderBedConfig()}
              {currentStep === 3 && renderAmenities()}
              {currentStep === 4 && renderPricing()}
              
              <div className="mt-6 flex justify-end space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  {currentStep < 4 ? 'Next' : 'Save'}
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
  initialData: PropTypes.object,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  onClose: PropTypes.func
};

RoomForm.defaultProps = {
  initialData: null,
  onSubmit: null,
  onChange: null,
  onClose: null
};

export default RoomForm;
