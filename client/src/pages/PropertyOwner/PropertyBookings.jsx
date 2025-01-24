import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import { toast } from 'react-hot-toast';
import EditBookingModal from '../../components/Booking/EditBookingModal';

const PropertyBookings = () => {
  const { propertyId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [propertyId]);

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings for property:', propertyId);
      const response = await propertyOwnerService.getPropertyBookings(propertyId);
      console.log('Fetched bookings:', response.data);
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (booking) => {
    console.log('Editing booking:', booking);
    setSelectedBooking(booking);
  };

  const handleDeleteClick = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await propertyOwnerService.cancelBooking(booking.id);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  const handleBookingUpdated = () => {
    fetchBookings();
  };

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

  if (loading) {
    return <div className="p-4">Loading bookings...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Bookings</h2>
      
      {bookings.length === 0 ? (
        <div className="text-center text-gray-500">
          No bookings found for this property.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-4 px-4 text-left text-sm font-medium text-gray-400 uppercase">
                  Guest
                </th>
                <th className="py-4 px-4 text-left text-sm font-medium text-gray-400 uppercase">
                  Room
                </th>
                <th className="py-4 px-4 text-left text-sm font-medium text-gray-400 uppercase">
                  Check In
                </th>
                <th className="py-4 px-4 text-left text-sm font-medium text-gray-400 uppercase">
                  Check Out
                </th>
                <th className="py-4 px-4 text-left text-sm font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="py-4 px-4 text-right text-sm font-medium text-gray-400 uppercase">
                  Amount
                </th>
                <th className="py-4 px-4 text-right text-sm font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b last:border-b-0">
                  <td className="py-4 px-4">
                    {booking.first_name} {booking.last_name}
                  </td>
                  <td className="py-4 px-4">
                    {booking.room_name}
                  </td>
                  <td className="py-4 px-4">
                    {format(new Date(booking.check_in_date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-4 px-4">
                    {format(new Date(booking.check_out_date), 'MMM d, yyyy')}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    ${booking.total_price}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEditClick(booking)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-600 rounded px-3 py-1 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(booking)}
                        className="text-sm font-medium text-red-600 hover:text-red-800 border border-red-600 rounded px-3 py-1 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={handleCloseModal}
          onSuccess={handleBookingUpdated}
        />
      )}
    </div>
  );
};

export default PropertyBookings; 