import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BookingModal = ({ isOpen, onClose, onSuccess, roomId, availableDates, specialRequests, termsAccepted }) => {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
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

  const handleSubmit = async () => {
    try {
      if (!user) {
        alert('Please log in to book a room');
        onClose();
        navigate('/login');
        return;
      }

      if (!termsAccepted) {
        alert('Please accept the terms and conditions');
        return;
      }

      const endpoint = `/properties/rooms/${roomId}/book`;
      console.log('Room ID:', roomId);
      console.log('API endpoint:', endpoint);
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Full URL:', `${api.defaults.baseURL}${endpoint}`);
      
      const response = await api.post(endpoint, {
        checkInDate: checkInDate.toISOString().split('T')[0],
        checkOutDate: checkOutDate.toISOString().split('T')[0],
        numberOfGuests,
        specialRequests,
        termsAccepted
      });

      if (response.data.status === 'success') {
        alert(`Booking successful! Your booking reference is: ${response.data.data.bookingReference}`);
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
        alert('Please log in to book a room');
        onClose();
        navigate('/login');
      } else {
        alert(error.response?.data?.message || 'Failed to create booking');
      }
    }
  };

  if (!isOpen) return null;

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