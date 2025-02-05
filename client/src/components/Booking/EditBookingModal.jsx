import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import api from '../../services/api';
import { XMarkIcon } from '@heroicons/react/24/solid';

const EditBookingModal = ({ booking, onClose, onSuccess }) => {
  const [room, setRoom] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [totalPrice, setTotalPrice] = useState(parseFloat(booking.total_price) || 0);
  const [totalNights, setTotalNights] = useState(0);
  const [checkInDate, setCheckInDate] = useState(new Date(booking.check_in_date));
  const [checkOutDate, setCheckOutDate] = useState(new Date(booking.check_out_date));
  const [numberOfGuests, setNumberOfGuests] = useState(booking.number_of_guests);
  const [specialRequests, setSpecialRequests] = useState(booking.special_requests || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRoomAndAvailability = async () => {
      try {
        console.log('Booking data in modal:', JSON.stringify(booking, null, 2));
        // Extract property_id and room_id from booking
        const propertyId = booking.property_id || booking.propertyId;
        const roomId = booking.room_id || booking.roomId || booking.room?.id;
        
        if (!propertyId || !roomId) {
          console.error('Missing IDs - propertyId:', propertyId, 'roomId:', roomId);
          throw new Error('Property ID or Room ID not found in booking data');
          //todo: return to initial state
        }

        // Fetch room details
        const roomResponse = await api.get(`/properties/${propertyId}/rooms/${roomId}`);
        if (!roomResponse.data?.data) {
          throw new Error('Room data not found');
        }
        setRoom(roomResponse.data.data);

        // Get first and last day of the date range
        const startDateStr = format(checkInDate, 'yyyy-MM-dd');
        const endDateStr = format(checkOutDate, 'yyyy-MM-dd');

        // Fetch availability for the date range
        const availabilityResponse = await api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, {
          params: {
            startDate: startDateStr,
            endDate: endDateStr
          }
        });

        if (availabilityResponse.data?.data?.availability) {
          setAvailabilityMap(availabilityResponse.data.data.availability);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
        toast.error('Failed to fetch room data');
      }
    };

    fetchRoomAndAvailability();
  }, [booking.property_id, booking.room_id]);

  useEffect(() => {
    if (checkInDate && checkOutDate && room?.price_per_night) {
      const nights = differenceInDays(checkOutDate, checkInDate);
      const defaultPrice = parseFloat(room.price_per_night);
      
      if (nights > 0 && !isNaN(defaultPrice)) {
        setTotalNights(nights);
        
        // Calculate total price using custom prices where available
        let calculatedPrice = 0;
        for (let i = 0; i < nights; i++) {
          const currentDate = new Date(checkInDate);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          // Use custom price if available, otherwise use default room price
          const dayPrice = parseFloat(availabilityMap[dateStr]?.price || defaultPrice);
          calculatedPrice += dayPrice;
        }
        
        setTotalPrice(parseFloat(calculatedPrice));
      } else {
        setTotalNights(0);
        setTotalPrice(0);
      }
    } else {
      setTotalNights(0);
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, room, availabilityMap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await propertyOwnerService.updateBooking(booking.id, {
        checkInDate: format(checkInDate, 'yyyy-MM-dd'),
        checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
        numberOfGuests,
        specialRequests,
        totalPrice
      });

      toast.success('Booking updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setIsLoading(true);
    try {
      await propertyOwnerService.cancelBooking(booking.id);
      toast.success('Booking cancelled successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Booking</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {room && (
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">Room Details</h3>
                <p className="text-sm text-gray-600">{room.name}</p>
                <p className="text-sm text-gray-600">Base price: ${parseFloat(room.price_per_night).toFixed(2)} per night</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
              <DatePicker
                selected={checkInDate}
                onChange={setCheckInDate}
                selectsStart
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={new Date()}
                className="w-full p-2 border rounded"
                dateFormat="MMM d, yyyy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
              <DatePicker
                selected={checkOutDate}
                onChange={setCheckOutDate}
                selectsEnd
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={checkInDate}
                className="w-full p-2 border rounded"
                dateFormat="MMM d, yyyy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
              <input
                type="number"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows="3"
                className="w-full p-2 border rounded"
                placeholder="Any special requests..."
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Booking Summary</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Total nights: {totalNights}</p>
                <p className="text-sm font-medium text-gray-800">Total price: ${Number(totalPrice).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Cancel Booking
              </button>
              
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal; 