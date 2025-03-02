import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const AddProperty = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    has_wifi: false,
    has_parking: false,
    has_breakfast: false,
    has_pool: false,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/owner/properties', formData);
      if (response.data.status === 'success') {
        navigate('/owner/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create property');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Add New Property</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Property Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Switch
                    checked={formData.has_wifi}
                    onChange={(checked) => handleChange({ target: { name: 'has_wifi', type: 'checkbox', checked } })}
                    className={`${formData.has_wifi ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full mr-3`}
                  >
                    <span className={`${formData.has_wifi ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                  </Switch>
                  <span className="text-sm font-medium text-gray-700">WiFi</span>
                </div>

                <div className="flex items-center">
                  <Switch
                    checked={formData.has_parking}
                    onChange={(checked) => handleChange({ target: { name: 'has_parking', type: 'checkbox', checked } })}
                    className={`${formData.has_parking ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full mr-3`}
                  >
                    <span className={`${formData.has_parking ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                  </Switch>
                  <span className="text-sm font-medium text-gray-700">Parking</span>
                </div>

                <div className="flex items-center">
                  <Switch
                    checked={formData.has_breakfast}
                    onChange={(checked) => handleChange({ target: { name: 'has_breakfast', type: 'checkbox', checked } })}
                    className={`${formData.has_breakfast ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full mr-3`}
                  >
                    <span className={`${formData.has_breakfast ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                  </Switch>
                  <span className="text-sm font-medium text-gray-700">Breakfast</span>
                </div>

                <div className="flex items-center">
                  <Switch
                    checked={formData.has_pool}
                    onChange={(checked) => handleChange({ target: { name: 'has_pool', type: 'checkbox', checked } })}
                    className={`${formData.has_pool ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full mr-3`}
                  >
                    <span className={`${formData.has_pool ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                  </Switch>
                  <span className="text-sm font-medium text-gray-700">Pool</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Add Property
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
