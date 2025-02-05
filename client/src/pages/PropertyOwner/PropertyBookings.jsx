
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import EditBookingModal from '../../components/Booking/EditBookingModal';
import ViewBookingModal from '../../components/Booking/ViewBookingModal';

const PropertyBookings = () => {
  const { propertyId } = useParams();
  if (!propertyId) return <div className="p-4">No property ID provided</div>;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetchBookings();
  }, [propertyId]);

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings for property:', propertyId);
      const response = await propertyOwnerService.getPropertyBookings(propertyId);
      console.log('Fetched bookings:', response.data);
      // Log the first booking to inspect its structure
      if (response.data && response.data.length > 0) {
        console.log('First booking structure:', JSON.stringify(response.data[0], null, 2));
      }
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (booking) => {
    console.log('Editing booking:', JSON.stringify(booking, null, 2));
    // First close any open modals
    handleCloseModal();
    // Then set the selected booking for edit modal
    setSelectedBooking({
      ...booking,
      propertyId, // Add propertyId from URL params
    });
  };

  const handleViewClick = (booking) => {
    // First close any open modals
    handleCloseModal();
    // Then show the viewing modal
    setViewingBooking(booking);
  };

  const handleDeleteClick = async (booking) => {
    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      await Swal.fire({
        title: 'Already Cancelled',
        text: 'This booking has already been cancelled.',
        icon: 'info',
        confirmButtonColor: '#6B7280' // gray-500
      });
      return;
    }
    const result = await Swal.fire({
      title: 'Cancel Booking',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626', // red-600
      cancelButtonColor: '#6b7280', // gray-500
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await propertyOwnerService.cancelBooking(booking.id);
      await Swal.fire({
        title: 'Cancelled!',
        text: 'The booking has been cancelled successfully.',
        icon: 'success',
        confirmButtonColor: '#10B981' // green-500
      });
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to cancel the booking. Please try again.',
        icon: 'error',
        confirmButtonColor: '#DC2626' // red-600
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
    setViewingBooking(null);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">Bookings</h2>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
          {/* Rows per page selector */}
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing rows per page
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-grow sm:max-w-xs">
            <input
              type="text"
              placeholder="Search by name, booking ID, or confirmation number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'confirmed' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg ${statusFilter === 'cancelled' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>
      
      {(() => {
        let filteredBookings = bookings;

        // Apply status filter
        if (statusFilter !== 'all') {
          filteredBookings = filteredBookings.filter(booking => 
            booking.status.toLowerCase() === statusFilter.toLowerCase()
          );
        }

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filteredBookings = filteredBookings.filter(booking => 
            `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(query) ||
            booking.id.toString().includes(query) ||
            (booking.booking_reference && booking.booking_reference.toLowerCase().includes(query))
          );
        }

        // Sort bookings by check-in date (latest first)
        filteredBookings.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));

        // Calculate pagination
        const indexOfLastBooking = currentPage * rowsPerPage;
        const indexOfFirstBooking = indexOfLastBooking - rowsPerPage;
        const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
        const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);

        return filteredBookings.length === 0 ? (
          <div className="text-center text-gray-500">
            {searchQuery.trim() || statusFilter !== 'all' 
              ? 'No bookings match your search criteria.'
              : 'No bookings found for this property.'}
          </div>
        ) : (
          <div>
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
                  {currentBookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer" 
                      onClick={() => handleViewClick(booking)}
                    >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(booking);
                            }}
                            className="text-sm font-medium text-red-600 hover:text-red-800 border border-red-600 rounded px-3 py-1 hover:bg-red-50 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstBooking + 1} to {Math.min(indexOfLastBooking, filteredBookings.length)} of {filteredBookings.length} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedBooking && (
        <EditBookingModal
          booking={selectedBooking}
          onClose={handleCloseModal}
          onSuccess={handleBookingUpdated}
        />
      )}

      {viewingBooking && (
        <ViewBookingModal
          booking={viewingBooking}
          onClose={handleCloseModal}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}
    </div>
  );
};

export default PropertyBookings; 
