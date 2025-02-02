import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible - Full refund 1 day prior to arrival' },
  { value: 'moderate', label: 'Moderate - Full refund 5 days prior to arrival' },
  { value: 'strict', label: 'Strict - 50% refund up until 1 week prior to arrival' }
];

const PET_POLICIES = [
  { value: 'allowed', label: 'Pets Allowed' },
  { value: 'not_allowed', label: 'No Pets Allowed' },
  { value: 'case_by_case', label: 'Case by Case Basis' }
];

const EVENT_POLICIES = [
  { value: 'allowed', label: 'Events Allowed' },
  { value: 'not_allowed', label: 'No Events Allowed' },
  { value: 'with_permission', label: 'Events with Permission Only' }
];

const PoliciesEdit = ({ property, onUpdate, disabled }) => {
  const [formData, setFormData] = useState({
    check_in_time: '15:00',
    check_out_time: '11:00',
    cancellation_policy: CANCELLATION_POLICIES[0].value,
    pet_policy: PET_POLICIES[0].value,
    event_policy: EVENT_POLICIES[0].value,
    house_rules: '',
    min_stay: 1,
    max_stay: 30
  });

  useEffect(() => {
    console.log('[PoliciesEdit] Property received:', property);
    if (property) {
      const newFormData = {
        check_in_time: property.check_in_time || '15:00',
        check_out_time: property.check_out_time || '11:00',
        cancellation_policy: property.cancellation_policy || CANCELLATION_POLICIES[0].value,
        pet_policy: property.pet_policy || PET_POLICIES[0].value,
        event_policy: property.event_policy || EVENT_POLICIES[0].value,
        house_rules: property.house_rules || '',
        min_stay: property.min_stay || 1,
        max_stay: property.max_stay || 30
      };
      console.log('[PoliciesEdit] Setting initial form data:', newFormData);
      setFormData(newFormData);
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    console.log(`[PoliciesEdit] Field changed: ${name} = ${value}`);
    const newValue = type === 'number' ? parseInt(value, 10) || 0 : value;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: newValue
      };
      console.log('[PoliciesEdit] Updated form data:', newData);
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[PoliciesEdit] Form submitted with data:', formData);
    try {
      // Create a clean object with only the policy fields
      const updatedData = {
        check_in_time: formData.check_in_time || '15:00',
        check_out_time: formData.check_out_time || '11:00',
        cancellation_policy: formData.cancellation_policy || 'flexible',
        pet_policy: formData.pet_policy || 'not_allowed',
        event_policy: formData.event_policy || 'not_allowed',
        house_rules: formData.house_rules || '', // Always send house_rules, even if empty
        min_stay: parseInt(formData.min_stay) || 1,
        max_stay: parseInt(formData.max_stay) || 30
      };

      console.log('[PoliciesEdit] Sending update with data:', updatedData);
      await onUpdate('policies', updatedData);
      console.log('[PoliciesEdit] Update completed');
    } catch (error) {
      console.error('[PoliciesEdit] Error updating policies:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Check-in/Check-out Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="check_in_time" className="block text-sm font-medium text-gray-700">
            Check-in Time
          </label>
          <input
            type="time"
            name="check_in_time"
            id="check_in_time"
            required
            disabled={disabled}
            value={formData.check_in_time}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="check_out_time" className="block text-sm font-medium text-gray-700">
            Check-out Time
          </label>
          <input
            type="time"
            name="check_out_time"
            id="check_out_time"
            required
            disabled={disabled}
            value={formData.check_out_time}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Length of Stay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="min_stay" className="block text-sm font-medium text-gray-700">
            Minimum Stay (nights)
          </label>
          <input
            type="number"
            name="min_stay"
            id="min_stay"
            min="1"
            required
            disabled={disabled}
            value={formData.min_stay}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="max_stay" className="block text-sm font-medium text-gray-700">
            Maximum Stay (nights)
          </label>
          <input
            type="number"
            name="max_stay"
            id="max_stay"
            min="1"
            required
            disabled={disabled}
            value={formData.max_stay}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Policies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="cancellation_policy" className="block text-sm font-medium text-gray-700">
            Cancellation Policy
          </label>
          <select
            name="cancellation_policy"
            id="cancellation_policy"
            required
            disabled={disabled}
            value={formData.cancellation_policy}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {CANCELLATION_POLICIES.map((policy) => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pet_policy" className="block text-sm font-medium text-gray-700">
            Pet Policy
          </label>
          <select
            name="pet_policy"
            id="pet_policy"
            required
            disabled={disabled}
            value={formData.pet_policy}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {PET_POLICIES.map((policy) => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event_policy" className="block text-sm font-medium text-gray-700">
            Event Policy
          </label>
          <select
            name="event_policy"
            id="event_policy"
            required
            disabled={disabled}
            value={formData.event_policy}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {EVENT_POLICIES.map((policy) => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* House Rules */}
      <div>
        <label htmlFor="house_rules" className="block text-sm font-medium text-gray-700">
          House Rules
        </label>
        <textarea
          name="house_rules"
          id="house_rules"
          rows={4}
          disabled={disabled}
          value={formData.house_rules}
          onChange={handleChange}
          placeholder="Enter any specific house rules or guidelines for guests..."
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

PoliciesEdit.propTypes = {
  property: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default PoliciesEdit; 