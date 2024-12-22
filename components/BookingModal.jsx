import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const BookingModal = ({ isOpen, onClose, roomId, availableDates }) => {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);

  // Function to determine if a date should be marked as unavailable
  const isDateUnavailable = (date) => {
    // Convert availableDates to a map for O(1) lookup
    const availableDatesMap = availableDates.reduce((acc, date) => {
      acc[date] = true;
      return acc;
    }, {});
    
    const dateString = date.toISOString().split('T')[0];
    return !availableDatesMap[dateString];
  };

  const handleSubmit = () => {
    // Handle booking submission
    console.log('Booking submitted:', { checkInDate, checkOutDate, roomId });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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