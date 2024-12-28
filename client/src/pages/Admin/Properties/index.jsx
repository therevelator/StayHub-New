import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import propertyService from '../../../services/propertyService';
import LoadingSpinner from '../../../components/LoadingSpinner';

const AdminProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await propertyService.getAll();
      console.log('Properties response:', response);
      
      // The API returns the data directly in the response
      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      
      // Process the properties data
      const processedProperties = response.data.map(property => ({
        ...property,
        // Only parse languages_spoken if it's a string
        languages_spoken: typeof property.languages_spoken === 'string' 
          ? JSON.parse(property.languages_spoken) 
          : property.languages_spoken || [],
        // Parse beds for each room
        rooms: property.rooms?.map(room => ({
          ...room,
          beds: typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds
        })) || []
      }));
      
      console.log('Processed properties:', processedProperties);
      setProperties(processedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError('Failed to load properties');
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      setDeleting(true);
      console.log('Component: Deleting property:', id);
      await propertyService.delete(id);
      console.log('Component: Property deleted successfully');
      toast.success('Property deleted successfully');
      loadProperties();
    } catch (error) {
      console.error('Component: Error deleting property:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete property';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Error Loading Properties</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={loadProperties}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
        <Link
          to="/admin/properties/add"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Property
        </Link>
      </div>

      {properties.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {properties.map((property) => (
              <li key={property.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {property.name || 'Unnamed Property'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {property.property_type} • {property.bedrooms || 0} bedrooms • {property.bathrooms || 0} bathrooms
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {[property.street, property.city, property.state, property.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {property.rooms && property.rooms.length > 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                          {property.rooms.length} room{property.rooms.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {property.languages_spoken && property.languages_spoken.length > 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                          Languages: {property.languages_spoken.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/admin/properties/${property.id}/edit`}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Edit property</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(property.id)}
                        disabled={deleting}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Delete property</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {property.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new property
          </p>
          <div className="mt-6">
            <Link
              to="/admin/properties/add"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Property
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProperties; 