'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addDays } from 'date-fns';

const RoomPage = () => {
  const { roomId, propertyId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [bookingDates, setBookingDates] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const fetchRoomAndAvailability = async () => {
      try {
        const [roomResponse, availabilityResponse] = await Promise.all([
          api.get(`/properties/${propertyId}/rooms/${roomId}`),
          api.get(`/properties/${propertyId}/rooms/${roomId}/availability`)
        ]);

        if (!roomResponse.data) {
          throw new Error('Room data not found');
        }

        setRoom(roomResponse.data);
        setAvailableDates(availabilityResponse.data.availableDates || []);
        setBookingDates(availabilityResponse.data.bookingDates || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to fetch room details');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && roomId) {
      fetchRoomAndAvailability();
    }
  }, [propertyId, roomId]);

  const handleDateChange = (date) => {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      setCheckInDate(date);
      setCheckOutDate(null);
    } else {
      setCheckOutDate(date);
    }
  };

  const tileClassName = ({ date }) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isCheckIn = checkInDate && dateString === format(checkInDate, 'yyyy-MM-dd');
    const isCheckOut = checkOutDate && dateString === format(checkOutDate, 'yyyy-MM-dd');
    
    // Check if the date is between check-in and check-out
    const isBetween = checkInDate && checkOutDate && 
      date > checkInDate && 
      date < checkOutDate;

    // First priority: Check if it's a check-in date (should be red/blocked)
    if (isCheckIn) {
      return 'bg-red-100 text-red-800';
    }

    // Second priority: Check if it's a check-out date (should be green/available)
    if (isCheckOut) {
      return 'bg-green-100 text-green-800';
    }

    // Third priority: Check if it's a date between check-in and check-out
    if (isBetween) {
      return 'bg-red-100 text-red-800';
    }

    // Fourth priority: Check existing bookings
    if (Array.isArray(bookingDates) && bookingDates.includes(dateString)) {
      return 'bg-red-100 text-red-800';
    }

    // Fifth priority: Check available dates
    if (Array.isArray(availableDates) && availableDates.includes(dateString)) {
      return 'bg-green-100 text-green-800';
    }

    return '';
  };

  const handleMouseEnter = (date) => {
    setHoveredDate(date);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select both check-in and check-out dates.');
      return;
    }
    if (!termsAccepted) {
      alert('You must accept the terms and conditions to proceed.');
      return;
    }

    try {
      const bookingData = {
        propertyId,
        checkInDate: format(checkInDate, 'yyyy-MM-dd'),
        checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
        specialRequests,
        termsAccepted,
      };

      const response = await api.post(`/properties/${propertyId}/rooms/${roomId}/book`, bookingData);
      alert('Booking successful!');
    } catch (error) {
      console.error('Error booking the room:', error);
      alert('Failed to book the room. Please try again later.');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {room && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-4">{room.name}</h1>
            <p className="text-gray-600 mb-4">{room.description}</p>
            
            {/* Calendar Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Availability Calendar</h2>
              <div className="calendar-container">
                <Calendar
                  tileClassName={tileClassName}
                  minDate={new Date()}
                  onChange={handleDateChange}
                  value={checkInDate || checkOutDate ? [checkInDate, checkOutDate] : null}
                  className="rounded-lg border p-4 w-full"
                  onMouseOver={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
                  <span>Check-in Date</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
                  <span>Check-out Date</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-50 rounded mr-2"></div>
                  <span>Selected Interval</span>
                </div>
              </div>
            </div>

            {/* Selected Dates Display */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Selected Dates</h3>
              <p>Check-in: {checkInDate ? format(checkInDate, 'yyyy-MM-dd') : 'Not selected'}</p>
              <p>Check-out: {checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : 'Not selected'}</p>
            </div>

            {/* Special Requests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                rows="4"
                placeholder="Any special requests or requirements?"
              ></textarea>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
              <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600 mb-4 h-40 overflow-y-auto">
                <h4 className="font-semibold mb-2">1. Booking and Payment</h4>
                <p className="mb-2">• Full payment is required at the time of booking</p>
                <p className="mb-2">• Rates are per room, per night</p>
                
                <h4 className="font-semibold mb-2">2. Cancellation Policy</h4>
                <p className="mb-2">• Free cancellation up to 48 hours before check-in</p>
                <p className="mb-2">• Cancellations within 48 hours of check-in will be charged one night's stay</p>
                
                <h4 className="font-semibold mb-2">3. Check-in/Check-out</h4>
                <p className="mb-2">• Check-in time: 3:00 PM</p>
                <p className="mb-2">• Check-out time: 11:00 AM</p>
                
                <h4 className="font-semibold mb-2">4. Room Rules</h4>
                <p className="mb-2">• No smoking in rooms</p>
                <p className="mb-2">• Quiet hours: 10:00 PM - 7:00 AM</p>
              </div>
              
              <div className="flex items-start mb-6">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 mr-2"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I have read and agree to the Terms and Conditions
                </label>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              onClick={handleBooking}
              disabled={!termsAccepted}
              className={`w-full py-3 px-4 rounded-lg transition-colors mt-4 ${
                termsAccepted
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Book this Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage; 