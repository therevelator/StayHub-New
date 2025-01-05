import React from 'react';
import { format } from 'date-fns';
import {
  HomeIcon,
  MapPinIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  pending: ClockIcon,
  confirmed: CheckCircleIcon,
  cancelled: XCircleIcon,
  completed: CheckCircleIcon
};

export const PropertiesSection = ({ properties }) => {
  const navigate = useNavigate();

  const handlePropertyClick = (propertyId) => {
    navigate(`/owner/properties/${propertyId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          onClick={() => handlePropertyClick(property.id)}
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">{property.name}</h3>
          <p className="text-gray-500 mb-4">{property.address}</p>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{property.rooms_count}</span> rooms
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">
                {property.active_bookings_count}
              </span>{' '}
              active bookings
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertiesSection; 