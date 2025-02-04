import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import roomService from '../../services/roomService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import PriceDisplay from '../PriceDisplay/PriceDisplay';
import RoomCalendar from '../RoomCalendar/RoomCalendar';

const BookingModal = ({ isOpen, onClose, onSuccess, propertyId, roomId, availableDates, specialRequests, termsAccepted }) => {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');

  const isDateUnavailable = (date) => {
    const availableDatesMap = availableDates.reduce((acc, date) => {
      acc[date] = true;
      return acc;
    }, {});
    
    const dateString = date.toISOString().split('T')[0];
    return !availableDatesMap[dateString];
  };

  const handlePriceChange = (price, availability) => {
    setTotalPrice(price);
    setPriceBreakdown(availability);
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        Swal.fire('Please log in to book a room');
        onClose();
        navigate('/login');
        return;
      }

      if (!termsAccepted) {
        Swal.fire('Please accept the terms and conditions');
        return;
      }

      const response = await roomService.bookRoom(propertyId, roomId, {
        checkInDate: checkInDate.toISOString().split('T')[0],
        checkOutDate: checkOutDate.toISOString().split('T')[0],
        numberOfGuests,
        specialRequests,
        termsAccepted
      });

      if (response.data.status === 'success') {
        Swal.fire({
          title: '<span style="color: #2563eb">Booking Successful! 🎉</span>',
          html: `
            <div style='text-align: left; padding: 20px; background: #f8fafc; border-radius: 8px;'>
              <h3 style='color: #2563eb; margin-bottom: 15px; font-size: 1.2em;'>Booking Details</h3>
              <div style='background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
                <p style='margin: 10px 0; font-size: 1.1em;'><strong style='color: #475569;'>Booking Reference:</strong> <span style='color: #2563eb; font-weight: 500;'>${response.data.data.bookingReference}</span></p>
                <p style='margin: 10px 0;'><strong style='color: #475569;'>Check-In:</strong> ${new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style='margin: 10px 0;'><strong style='color: #475569;'>Check-Out:</strong> ${new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${response.data.data.propertyName ? `<p style='margin: 10px 0;'><strong style='color: #475569;'>Property:</strong> ${response.data.data.propertyName}</p>` : ''}
                ${response.data.data.roomType ? `<p style='margin: 10px 0;'><strong style='color: #475569;'>Room Type:</strong> ${response.data.data.roomType}</p>` : ''}
                ${response.data.data.roomAmenities?.length ? `<p style='margin: 10px 0;'><strong style='color: #475569;'>Amenities:</strong> ${response.data.data.roomAmenities.join(', ')}</p>` : ''}
                ${specialRequests ? `<p style='margin: 10px 0;'><strong style='color: #475569;'>Special Requests:</strong> ${specialRequests}</p>` : ''}
              </div>
              ${response.data.data.roomImage ? `<img src='${response.data.data.roomImage}' alt='Room Image' style='width: 100%; border-radius: 8px; margin-top: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);' />` : ''}
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Done',
          confirmButtonColor: '#2563eb',
          width: '600px',
          showCloseButton: true,
          allowOutsideClick: false
        });
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        Swal.fire('Please log in to book a room');
        onClose();
        navigate('/login');
      } else {
        Swal.fire(error.response?.data?.message || 'Failed to create booking');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Book Room</h2>
        
        <RoomCalendar
          propertyId={propertyId}
          roomId={roomId}
          initialCheckIn={checkInDate}
          initialCheckOut={checkOutDate}
          onDateChange={({ checkInDate, checkOutDate }) => {
            setCheckInDate(checkInDate);
            setCheckOutDate(checkOutDate);
          }}
          onPriceChange={handlePriceChange}
        />

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Guests
          </label>
          <input
            type="number"
            min="1"
            value={numberOfGuests}
            onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
            className="w-full p-2 border rounded-md"
          />
        </div>

        {checkInDate && checkOutDate && (
          <PriceDisplay
            totalPrice={totalPrice}
            priceBreakdown={priceBreakdown}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
          />
        )}

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!checkInDate || !checkOutDate}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Book Room</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Check-in Date</label>
            <DatePicker
              selected={checkInDate}
              onChange={date => setCheckInDate(date)}
              dayClassName={date =>
                isDateUnavailable(date) ? 'text-red-500' : 'text-green-500'
              }
              minDate={new Date()}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-2">Check-out Date</label>
            <DatePicker
              selected={checkOutDate}
              onChange={date => setCheckOutDate(date)}
              dayClassName={date =>
                isDateUnavailable(date) ? 'text-red-500' : 'text-green-500'
              }
              minDate={checkInDate || new Date()}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal; 