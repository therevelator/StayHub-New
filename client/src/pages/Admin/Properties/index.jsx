import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  HomeIcon,
  MapPinIcon,
  LanguageIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import propertyService from '../../../services/propertyService';
import LoadingSpinner from '../../../components/LoadingSpinner';

const AdminProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      setFilteredProperties(processedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError('Failed to load properties');
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You won\'t be able to revert this!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setDeleting(true);
        console.log('Component: Deleting property:', id);
        await propertyService.delete(id);
        console.log('Component: Property deleted successfully');
        
        await Swal.fire(
          'Deleted!',
          'Property has been deleted.',
          'success'
        );
        
        loadProperties();
      }
    } catch (error) {
      console.error('Component: Error deleting property:', error);
      console.error('Delete error details:', error.response || error);
      // Check if it's a foreign key constraint error
      const errorMessage = error.response?.data?.message || error.message;
      const isConstraintError = errorMessage.toLowerCase().includes('foreign key constraint') || 
                               errorMessage.toLowerCase().includes('referenced');

      await Swal.fire({
        icon: 'error',
        title: 'Cannot Delete Property',
        html: isConstraintError
          ? `<div class="text-left">
              <p class="font-medium mb-3">This property cannot be deleted because it has existing bookings or rooms.</p>
              <p class="mb-2">To delete this property, please ensure:</p>
              <ul class="list-disc pl-5 space-y-1">
                <li>All active bookings are completed or cancelled</li>
                <li>All rooms associated with this property are removed</li>
              </ul>
             </div>`
          : `<div class="text-left">
              <p>An unexpected error occurred while trying to delete the property.</p>
              <p class="mt-2 text-sm text-gray-600">Error: ${errorMessage}</p>
             </div>`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
        customClass: {
          htmlContainer: 'text-left'
        }
      });
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
              <p className="text-gray-600">Manage and monitor all your properties in one place</p>
            </div>
            <Link
              to="/admin/properties/add"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Property
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="max-w-xl relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border-0 py-4 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-base transition-all duration-200 hover:ring-gray-300 shadow-sm"
              placeholder="Search by property name, location, or ID..."
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value.toLowerCase();
                setSearchQuery(query);
                const filtered = properties.filter(property =>
                  property.name.toLowerCase().includes(query) ||
                  (property.location && property.location.toLowerCase().includes(query)) ||
                  (property.city && property.city.toLowerCase().includes(query)) ||
                  (property.country && property.country.toLowerCase().includes(query)) ||
                  (property.id && property.id.toString().toLowerCase().includes(query))
                );
                setFilteredProperties(filtered);
              }}
            />
          </div>
        </div>

        {/* Properties List */}
        {properties.length > 0 ? (
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <div 
                key={property.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">
                            {property.name || 'Unnamed Property'}
                          </h3>
                          <span className="text-sm text-gray-500">ID: {property.id}</span>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          property.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {property.is_active ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <HomeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {property.property_type} • {property.bedrooms || 0} bedrooms • {property.bathrooms || 0} bathrooms
                            {property.rooms && ` • ${property.rooms.length} room${property.rooms.length !== 1 ? 's' : ''}`}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            {[property.street, property.city, property.state, property.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>

                        {property.languages_spoken && property.languages_spoken.length > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <LanguageIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Languages: {property.languages_spoken.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/admin/properties/${property.id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(property.id)}
                        disabled={deleting}
                        className="inline-flex items-center px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No properties yet</h3>
            <p className="mt-2 text-gray-500">
              Get started by adding your first property
            </p>
            <div className="mt-8">
              <Link
                to="/admin/properties/add"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Property
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProperties; 