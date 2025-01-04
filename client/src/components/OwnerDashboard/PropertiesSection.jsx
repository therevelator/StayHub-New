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

const PropertiesSection = ({ properties, selectedProperty, onPropertySelect }) => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your properties and view their bookings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Properties List */}
        <div className="space-y-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className={`bg-white rounded-lg shadow-sm cursor-pointer transition-all ${
                selectedProperty?.id === property.id
                  ? 'ring-2 ring-primary-500'
                  : 'hover:shadow-md'
              }`}
              onClick={() => onPropertySelect(property)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HomeIcon className="h-6 w-6 text-gray-400" />
                    <h2 className="ml-3 text-lg font-medium text-gray-900">
                      {property.name}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{property.rooms?.length || 0}</span> rooms
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">
                        {property.active_bookings_count || 0}
                      </span>{' '}
                      active bookings
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {property.address}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
                    Max {property.max_guests} guests
                  </div>
                </div>

                {property.description && (
                  <p className="mt-4 text-sm text-gray-500">{property.description}</p>
                )}
              </div>

              {property.recent_bookings && property.recent_bookings.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-900">Recent Bookings</h3>
                  <div className="mt-2 space-y-3">
                    {property.recent_bookings.slice(0, 3).map((booking) => {
                      const StatusIcon = statusIcons[booking.status];
                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <StatusIcon
                              className={`h-5 w-5 ${
                                statusColors[booking.status].split(' ')[1]
                              }`}
                            />
                            <span className="ml-2 text-sm text-gray-900">
                              {booking.guest_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {format(new Date(booking.check_in_date), 'MMM d')} -{' '}
                              {format(new Date(booking.check_out_date), 'MMM d, yyyy')}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[booking.status]
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Property Details */}
        {selectedProperty && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Property Details
              </h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedProperty.address}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedProperty.contact_phone || 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Check-in Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedProperty.check_in_time || 'Not specified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Check-out Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedProperty.check_out_time || 'Not specified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">House Rules</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedProperty.house_rules || 'No specific rules provided'}
                  </dd>
                </div>
              </dl>
            </div>

            {selectedProperty.rooms && selectedProperty.rooms.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Rooms</h2>
                <div className="space-y-4">
                  {selectedProperty.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {room.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {room.description || 'No description provided'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${parseFloat(room.price_per_night).toFixed(2)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">per night</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesSection; 