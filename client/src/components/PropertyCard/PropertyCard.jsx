import React from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const PropertyCard = ({ property, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <img
          src={property.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={property.name}
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}
        >
          {property.status?.toLowerCase() || 'pending'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
          {property.name || 'Unnamed Property'}
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-500 truncate">
            {property.city}, {property.country}
          </p>
          <p className="text-sm text-gray-500">
            {property.property_type} • {property.bedrooms} BR • {property.bathrooms} BA
          </p>
          <p className="text-sm text-gray-500 truncate">
            {property.description || 'No description'}
          </p>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Link
            to={`/admin/properties/${property.id}/edit`}
            className="inline-flex items-center p-2 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-500"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={() => onDelete(property.id)}
            className="inline-flex items-center p-2 border border-transparent rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:bg-red-50 focus:text-red-500"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 