import React from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline'; // Added MapPinIcon

const PropertyCard = ({ property, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="group glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-56 overflow-hidden">
        <img
          src={property.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor(property.status)}`}
        >
          {property.status?.toLowerCase() || 'pending'}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {property.name || 'Unnamed Property'}
          </h3>
          <div className="flex items-center text-primary-600 font-bold bg-primary-50 px-2 py-1 rounded-lg">
            ${property.price_per_night || 0} <span className="text-xs font-normal text-gray-500 ml-1">/night</span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-500 text-sm">
            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <p className="truncate">
              {property.city}, {property.country}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">{property.property_type}</span>
            <span>•</span>
            <span>{property.bedrooms} Bed</span>
            <span>•</span>
            <span>{property.bathrooms} Bath</span>
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
            {property.description || 'No description available for this property.'}
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
          <Link
            to={`/admin/properties/${property.id}/edit`}
            className="inline-flex items-center p-2.5 rounded-xl text-gray-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            title="Edit Property"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={() => onDelete(property.id)}
            className="inline-flex items-center p-2.5 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Property"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 