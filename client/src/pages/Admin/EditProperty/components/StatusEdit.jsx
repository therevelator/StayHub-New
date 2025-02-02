import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Dutch',
  'Greek',
  'Turkish',
  'Vietnamese',
  'Thai',
  'Polish',
  'Swedish',
  'Danish',
  'Norwegian',
  'Finnish',
  'Hungarian',
  'Czech',
  'Romanian',
  'Bulgarian',
  'Hebrew',
  'Indonesian',
  'Malay',
  'Filipino'
];

const StatusEdit = ({ property, onUpdate, onSubmit, disabled }) => {
  const [formData, setFormData] = useState({
    is_active: property?.is_active ?? true,
    languages_spoken: Array.isArray(property?.languages_spoken)
      ? property.languages_spoken
      : typeof property?.languages_spoken === 'string'
        ? JSON.parse(property.languages_spoken)
        : []
  });

  useEffect(() => {
    if (property) {
      setFormData({
        is_active: property?.is_active ?? true,
        languages_spoken: Array.isArray(property?.languages_spoken)
          ? property.languages_spoken
          : typeof property?.languages_spoken === 'string'
            ? JSON.parse(property.languages_spoken)
            : []
      });
    }
  }, [property]);

  const handleStatusChange = (checked) => {
    const updatedData = {
      ...formData,
      is_active: checked
    };
    setFormData(updatedData);
    onUpdate('status', updatedData);
  };

  const handleLanguageToggle = (language) => {
    const newLanguages = formData.languages_spoken.includes(language)
      ? formData.languages_spoken.filter(l => l !== language)
      : [...formData.languages_spoken, language];

    const updatedData = {
      ...formData,
      languages_spoken: newLanguages
    };
    setFormData(updatedData);
    onUpdate('languages', updatedData);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6 space-y-8">
        {/* Active Status */}
        <div className="border-b pb-6">
          <Switch.Group as="div" className="flex items-center justify-between">
            <Switch.Label as="span" className="flex flex-col" passive>
              <span className="text-lg font-medium text-gray-900">Property Status</span>
              <span className="text-sm text-gray-500">
                {formData.is_active
                  ? 'Property is visible to guests and available for booking'
                  : 'Property is hidden from guests and cannot be booked'}
              </span>
            </Switch.Label>
            <Switch
              checked={formData.is_active}
              onChange={handleStatusChange}
              disabled={disabled}
              className={`${formData.is_active ? 'bg-primary-600' : 'bg-gray-200'}
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="sr-only">Property status</span>
              <span
                aria-hidden="true"
                className={`${formData.is_active ? 'translate-x-5' : 'translate-x-0'}
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
          </Switch.Group>
        </div>

        {/* Languages */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Languages Spoken</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select all languages spoken by the host or staff
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {formData.languages_spoken.length} selected
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
            {LANGUAGES.map((language) => (
              <label
                key={language}
                className="relative flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.languages_spoken.includes(language)}
                  onChange={() => handleLanguageToggle(language)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <span className="ml-3 text-sm text-gray-700">{language}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={async () => {
            try {
              // Update status and languages first
              await onUpdate('status', formData);
              await onUpdate('languages', formData);
              
              // Then trigger submit
              await onUpdate('submit', true);
            } catch (error) {
              console.error('Error during property submission:', error);
            }
          }}
          disabled={disabled}
          className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-primary-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Complete Property Setup
        </button>
      </div>
    </div>
  );
};

StatusEdit.propTypes = {
  property: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func
};

export default StatusEdit; 