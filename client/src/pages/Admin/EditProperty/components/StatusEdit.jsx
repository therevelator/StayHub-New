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

const StatusEdit = ({ property, onUpdate, disabled }) => {
  const [formData, setFormData] = useState({
    is_active: true,
    languages_spoken: []
  });

  useEffect(() => {
    if (property) {
      setFormData({
        is_active: property.is_active ?? true,
        languages_spoken: Array.isArray(property.languages_spoken)
          ? property.languages_spoken
          : typeof property.languages_spoken === 'string'
            ? JSON.parse(property.languages_spoken)
            : []
      });
    }
  }, [property]);

  const handleStatusChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }));
    onUpdate({ is_active: checked });
  };

  const handleLanguageToggle = (language) => {
    const newLanguages = formData.languages_spoken.includes(language)
      ? formData.languages_spoken.filter(l => l !== language)
      : [...formData.languages_spoken, language];

    setFormData(prev => ({
      ...prev,
      languages_spoken: newLanguages
    }));
    onUpdate({ languages_spoken: newLanguages });
  };

  return (
    <div className="space-y-8">
      {/* Active Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Property Status</h3>
        <div className="mt-4 flex items-center">
          <Switch
            checked={formData.is_active}
            onChange={handleStatusChange}
            disabled={disabled}
            className={`${
              formData.is_active ? 'bg-primary-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="sr-only">Property status</span>
            <span
              aria-hidden="true"
              className={`${
                formData.is_active ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
          <span className="ml-3 text-sm">
            {formData.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {formData.is_active
            ? 'Property is visible to guests and available for booking'
            : 'Property is hidden from guests and cannot be booked'}
        </p>
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Languages Spoken</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select all languages spoken by the host or staff
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {LANGUAGES.map((language) => (
            <label
              key={language}
              className="relative flex items-start"
            >
              <div className="flex h-5 items-center">
                <input
                  type="checkbox"
                  checked={formData.languages_spoken.includes(language)}
                  onChange={() => handleLanguageToggle(language)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="text-gray-700">{language}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

StatusEdit.propTypes = {
  property: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default StatusEdit; 