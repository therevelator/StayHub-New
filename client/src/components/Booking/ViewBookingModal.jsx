import React from 'react';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/solid';

const ViewBookingModal = ({ booking, onClose, onEdit, onDelete }) => {
  if (!booking) return null;

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking Reference and Status */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Booking Reference</p>
              <p className="text-lg font-medium">{booking.booking_reference || booking.id}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(booking.status)}`}>
              {booking.status}
            </span>
          </div>

          {/* Guest Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Guest Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{booking.first_name} {booking.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Guests</p>
                <p className="font-medium">{booking.number_of_guests}</p>
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Room Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Room Name</p>
                <p className="font-medium">{booking.room_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Room Type</p>
                <p className="font-medium">{booking.room_type}</p>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Stay Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Check-in Date</p>
                <p className="font-medium">{format(new Date(booking.check_in_date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out Date</p>
                <p className="font-medium">{format(new Date(booking.check_out_date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">${booking.total_price}</p>
              </div>
              {booking.payment_status && (
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium">{booking.payment_status}</p>
                </div>
              )}
            </div>
          </div>

          {/* Special Requests */}
          {booking.special_requests && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Special Requests</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{booking.special_requests}</p>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(booking)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Edit Booking
          </button>
          <button
            onClick={() => onDelete(booking)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingModal;
