import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import EditBookingModal from '../../components/Booking/EditBookingModal';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const MyReservations = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingService.getGuestBookings();
      console.log('Guest bookings response:', response);
      console.log('Room details from first booking:', response.data?.[0]?.room);
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load your reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  const handleUpdateBooking = async (updatedBooking) => {
    try {
      await bookingService.updateBooking(updatedBooking.id, updatedBooking);
      toast.success('Booking updated successfully');
      fetchBookings();
      handleCloseModal();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const result = await Swal.fire({
        title: 'Cancel Reservation',
        text: 'Are you sure you want to cancel this reservation?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it',
        cancelButtonText: 'Keep reservation'
      });

      if (result.isConfirmed) {
        await bookingService.cancelBooking(bookingId);
        toast.success('Reservation cancelled successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel reservation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Reservations</h1>
      
      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <p className="text-gray-500">You don't have any reservations yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{booking.property.name}</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>{booking.room.name}</p>
                    {(() => {
                      console.log('Room data:', booking.room);
                      console.log('Beds data:', booking.room.beds);
                      
                      if (booking.room.beds?.length > 0) {
                        return (
                          <p className="text-gray-400">
                            {booking.room.beds.map((bed, index) => {
                              console.log('Processing bed:', bed);
                              return (
                                <span key={index}>
                                  {bed.count}x {bed.type}
                                  {index < booking.room.beds.length - 1 ? ', ' : ''}
                                </span>
                              );
                            })}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Check-in: {new Date(booking.check_in_date).toLocaleDateString()}</p>
                    <p>Check-out: {new Date(booking.check_out_date).toLocaleDateString()}</p>
                    <p className="mt-2">Total Price: ${booking.total_price}</p>
                    <p className="mt-1">Status: <span className={`font-medium ${
                      booking.status === 'confirmed' ? 'text-green-600' :
                      booking.status === 'pending' ? 'text-yellow-600' :
                      booking.status === 'cancelled' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  {booking.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={handleCloseModal}
          onSuccess={fetchBookings}
        />
      )}
    </div>
  );
};

export default MyReservations;
