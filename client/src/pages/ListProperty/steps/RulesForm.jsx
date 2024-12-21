import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/20/solid';

const RulesForm = ({ data = {}, onChange }) => {
  const [formData, setFormData] = useState({
    checkInTime: data.checkInTime || '14:00',
    checkOutTime: data.checkOutTime || '11:00',
    cancellationPolicy: data.cancellationPolicy || 'flexible',
    houseRules: data.houseRules || [],
    petPolicy: data.petPolicy || '',
    eventPolicy: data.eventPolicy || ''
  });
  const [customRule, setCustomRule] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`RulesForm - ${name} changed to:`, value);
    
    // Handle time inputs
    if (name === 'checkInTime' || name === 'checkOutTime') {
      // Default times
      const defaultTimes = {
        checkInTime: '14:00',
        checkOutTime: '11:00'
      };
      
      // Use default if empty
      if (!value) {
        const newData = { ...formData, [name]: defaultTimes[name] };
        console.log('Empty time, using default:', newData);
        setFormData(newData);
        onChange(newData);
        return;
      }
      
      // Validate time format
      const [hours, minutes] = value.split(':').map(num => parseInt(num));
      if (!isNaN(hours) && !isNaN(minutes) &&
          hours >= 0 && hours <= 23 &&
          minutes >= 0 && minutes <= 59) {
        // Format as HH:mm
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const newData = { ...formData, [name]: formattedTime };
        console.log('Valid time format:', newData);
        setFormData(newData);
        onChange(newData);
        return;
      }
      
      // If invalid, use default
      console.log('Invalid time format, using default');
      const newData = { ...formData, [name]: defaultTimes[name] };
      setFormData(newData);
      onChange(newData);
      return;
    }
    
    // Handle other inputs
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onChange(newData);
  };

  const addCustomRule = () => {
    if (customRule.trim()) {
      const newRules = [...formData.houseRules, customRule.trim()];
      setFormData(prev => ({ ...prev, houseRules: newRules }));
      onChange({ ...formData, houseRules: newRules });
      setCustomRule('');
    }
  };

  const removeRule = (index) => {
    const newRules = formData.houseRules.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, houseRules: newRules }));
    onChange({ ...formData, houseRules: newRules });
  };

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="checkInTime" className="block text-sm font-medium text-gray-700">
            Check-in Time
          </label>
          <input
            type="time"
            id="checkInTime"
            name="checkInTime"
            value={formData.checkInTime || '14:00'}
            onChange={handleChange}
            required
            pattern="[0-9]{2}:[0-9]{2}"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="checkOutTime" className="block text-sm font-medium text-gray-700">
            Check-out Time
          </label>
          <input
            type="time"
            id="checkOutTime"
            name="checkOutTime"
            value={formData.checkOutTime || '11:00'}
            onChange={handleChange}
            required
            pattern="[0-9]{2}:[0-9]{2}"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700">
          Cancellation Policy
        </label>
        <select
          id="cancellationPolicy"
          name="cancellationPolicy"
          value={formData.cancellationPolicy}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="flexible">Flexible</option>
          <option value="moderate">Moderate</option>
          <option value="strict">Strict</option>
        </select>
      </div>

      <div>
        <label htmlFor="petPolicy" className="block text-sm font-medium text-gray-700">
          Pet Policy
        </label>
        <textarea
          id="petPolicy"
          name="petPolicy"
          value={formData.petPolicy}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={2}
        />
      </div>

      <div>
        <label htmlFor="eventPolicy" className="block text-sm font-medium text-gray-700">
          Event Policy
        </label>
        <textarea
          id="eventPolicy"
          name="eventPolicy"
          value={formData.eventPolicy}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          House Rules
        </label>
        <div className="space-y-2">
          {formData.houseRules.map((rule, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <span className="text-sm text-gray-700">{rule}</span>
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Add a custom rule"
            value={customRule}
            onChange={(e) => setCustomRule(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={addCustomRule}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Rule
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Save Rules
        </button>
      </div>
    </form>
  );
};

export default RulesForm;
