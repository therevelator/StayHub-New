import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import propertyService from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from '../../components/PropertyCard/PropertyCard';
import { toast } from 'react-hot-toast';

const AdminProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getAll();
      console.log('Properties response:', response);
      
      // Extract properties array from response.data
      const propertiesData = response.data || [];
      
      // Filter properties for admin or user's own properties
      const filteredProperties = user?.isAdmin 
        ? propertiesData
        : propertiesData.filter(prop => prop.userId === user.id);
        
      console.log('Filtered properties:', filteredProperties);
      setProperties(filteredProperties);
      setError(null);
    } catch (err) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', err);
      toast.error('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.delete(propertyId);
        setProperties(properties.filter(prop => prop.id !== propertyId));
        toast.success('Property deleted successfully');
      } catch (err) {
        setError('Failed to delete property');
        toast.error('Failed to delete property');
        console.error('Error deleting property:', err);
      }
    }
  };

  const filteredProperties = properties && Array.isArray(properties) ? properties
    .filter(property => {
      const matchesSearch = searchTerm === '' || 
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.country?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ? true : property.status?.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name-asc') return a.name?.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name?.localeCompare(a.name);
      return 0;
    }) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and monitor all properties in your system
            </p>
          </div>
          <Link
            to="/admin/properties/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Property
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onDelete={handleDelete}
          />
        ))}
        
        {filteredProperties.length === 0 && (
          <div className="col-span-full py-8">
            <div className="text-center">
              <p className="text-sm text-gray-500">No properties found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProperties;