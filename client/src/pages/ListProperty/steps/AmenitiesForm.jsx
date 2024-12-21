import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  WifiIcon,
  TvIcon,
  HomeIcon,
  SparklesIcon,
  FireIcon,
  KeyIcon,
  ShieldCheckIcon,
  BoltIcon,
  BeakerIcon,
  HeartIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  BuildingLibraryIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const amenityCategories = [
  {
    title: 'Essential Amenities',
    items: [
      { id: 'wifi', label: 'WiFi', icon: WifiIcon },
      { id: 'tv', label: 'TV', icon: TvIcon },
      { id: 'kitchen', label: 'Kitchen', icon: HomeIcon },
      { id: 'washer', label: 'Washer', icon: SparklesIcon },
      { id: 'heating', label: 'Heating', icon: FireIcon },
      { id: 'private_entrance', label: 'Private entrance', icon: KeyIcon },
    ],
  },
  {
    title: 'Safety Features',
    items: [
      { id: 'security_system', label: 'Security System', icon: ShieldCheckIcon },
      { id: 'smoke_alarm', label: 'Smoke Alarm', icon: BoltIcon },
      { id: 'fire_extinguisher', label: 'Fire Extinguisher', icon: BeakerIcon },
      { id: 'first_aid', label: 'First Aid Kit', icon: HeartIcon },
    ],
  },
  {
    title: 'Property Features',
    items: [
      { id: 'pool', label: 'Swimming Pool', icon: BuildingLibraryIcon },
      { id: 'gym', label: 'Gym', icon: BuildingStorefrontIcon },
      { id: 'parking', label: 'Parking', icon: BuildingOfficeIcon },
      { id: 'workspace', label: 'Workspace', icon: HomeModernIcon },
    ],
  },
];

const AmenitiesForm = ({ onSubmit, initialValues = {} }) => {
  const formik = useFormik({
    initialValues: {
      amenities: initialValues.amenities || [],
    },
    validationSchema: Yup.object({
      amenities: Yup.array()
        .min(1, 'Please select at least one amenity')
        .required('Amenities are required'),
    }),
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  const handleAmenityToggle = (amenityId) => {
    const currentAmenities = formik.values.amenities;
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter((id) => id !== amenityId)
      : [...currentAmenities, amenityId];
    
    formik.setFieldValue('amenities', newAmenities);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Property Amenities
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Select all the amenities available at your property
        </p>

        {amenityCategories.map((category) => (
          <div key={category.title} className="mb-8">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {category.title}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.items.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = formik.values.amenities.includes(amenity.id);
                
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className={`flex items-center p-4 rounded-lg border ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    } transition-colors duration-200 ease-in-out`}
                  >
                    <Icon className={`h-5 w-5 ${
                      isSelected ? 'text-primary-500' : 'text-gray-400'
                    } mr-3`} />
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {formik.touched.amenities && formik.errors.amenities && (
          <p className="text-sm text-red-600 mt-2">{formik.errors.amenities}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        {/* <button
          type="button"
          onClick={() => formik.resetForm()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Save and Continue
        </button> */}
      </div>
    </form>
  );
};

export default AmenitiesForm;
