'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Swal from 'sweetalert2';

const RoomPage = () => {
  const { roomId, propertyId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [bookingDates, setBookingDates] = useState([]);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [totalNights, setTotalNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [activeStartDate, setActiveStartDate] = useState(new Date());

  const fetchAvailability = async (date) => {
    try {
      // Get first and last day of the displayed month
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const startDateStr = format(firstDay, 'yyyy-MM-dd');
      const endDateStr = format(lastDay, 'yyyy-MM-dd');
      
      console.log('Fetching availability:', { startDateStr, endDateStr });
      
      const availabilityResponse = await api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, {
        params: {
          startDate: startDateStr,
          endDate: endDateStr
        }
      });

      console.log('Raw availability response:', availabilityResponse.data);
      
      // Process availability data
      const available = [];
      const occupied = [];
      const maintenance = [];
      const blocked = [];
      const availabilityData = {};
      
      if (availabilityResponse.data?.data?.availability) {
        Object.entries(availabilityResponse.data.data.availability).forEach(([date, info]) => {
          console.log('Processing date:', date, 'info:', info);
          availabilityData[date] = info;
          
          switch(info.status) {
            case 'available':
              available.push(date);
              break;
            case 'occupied':
              occupied.push(date);
              break;
            case 'maintenance':
              maintenance.push(date);
              break;
            case 'blocked':
              blocked.push(date);
              break;
          }
        });
      }
      
      console.log('Processed availability:', { available, occupied, maintenance, blocked });
      setAvailabilityMap(availabilityData);
      setAvailableDates(available);
      setBookingDates([...occupied, ...maintenance, ...blocked]);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError(error.response?.data?.message || 'Failed to fetch availability');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First get the room details
        const roomResponse = await api.get(`/properties/${propertyId}/rooms/${roomId}`);
        if (!roomResponse.data?.data) {
          throw new Error('Room data not found');
        }
        
        const roomData = roomResponse.data.data;
        
        // Parse amenities if they're a string
        if (roomData.amenities && typeof roomData.amenities === 'string') {
          try {
            const parsedAmenities = JSON.parse(roomData.amenities);
            if (Array.isArray(parsedAmenities)) {
              roomData.amenities = parsedAmenities;
            }
          } catch (e) {
            console.log('Error parsing room amenities:', e);
            // If parsing fails, keep the original string
          }
        }
        
        console.log('Room data:', roomData);
        setRoom(roomData);
        
        // Then get availability for current month
        await fetchAvailability(activeStartDate);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to fetch room details');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && roomId) {
      fetchData();
    }
  }, [propertyId, roomId, activeStartDate]);

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
          const dayPrice = availabilityMap[dateStr]?.price || defaultPrice;
          calculatedPrice += dayPrice;
        }
        
        setTotalPrice(calculatedPrice);
      } else {
        setTotalNights(0);
        setTotalPrice(0);
      }
    } else {
      setTotalNights(0);
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, room, availabilityMap]);

  const getStatusStyles = (status) => {
    switch(status) {
      case 'occupied':
        return 'bg-red-100 text-red-800 hover:bg-red-100 cursor-not-allowed';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100 cursor-not-allowed';
      case 'blocked':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100 cursor-not-allowed';
      case 'available':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'hover:bg-gray-100';
    }
  };

  const getStatusTitle = (status, info) => {
    if (!info) return '';
    
    const price = info.price ? `$${parseFloat(info.price).toFixed(2)}` : 'N/A';
    const notes = info.notes ? ` - ${info.notes}` : '';
    
    switch(status) {
      case 'occupied':
        return `Booked by another guest${notes}`;
      case 'maintenance':
        return `Under maintenance${notes}`;
      case 'blocked':
        return `Not available for booking${notes}`;
      case 'available':
        return `Available - ${price}/night${notes}`;
      default:
        return notes || '';
    }
  };

  const handleDateClick = (value) => {
    if (!value) return;
    
    const dateStr = format(value, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateStr];
    
    // Don't allow selecting unavailable dates
    if (dateInfo && (dateInfo.status === 'occupied' || dateInfo.status === 'maintenance' || dateInfo.status === 'blocked')) {
      return;
    }

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection
      setCheckInDate(value);
      setCheckOutDate(null);
    } else {
      // Complete the selection
      if (value < checkInDate) {
        setCheckInDate(value);
        setCheckOutDate(checkInDate);
      } else {
        setCheckOutDate(value);
      }
    }
  };

  const handleMonthChange = ({ activeStartDate, view }) => {
    console.log('Calendar view changed:', { activeStartDate, view });
    if (view === 'month') {
      setActiveStartDate(activeStartDate);
    }
  };

  const tileClassName = ({ date }) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateString];
    
    const isCheckIn = checkInDate && dateString === format(checkInDate, 'yyyy-MM-dd');
    const isCheckOut = checkOutDate && dateString === format(checkOutDate, 'yyyy-MM-dd');
    const isBetween = checkInDate && checkOutDate && 
      date > checkInDate && 
      date < checkOutDate;

    let classes = ['rounded-lg'];

    // Selection styles take precedence
    if (isCheckIn || isCheckOut) {
      classes.push('bg-amber-100 text-amber-800 hover:bg-amber-200');
    } else if (isBetween) {
      classes.push('bg-amber-50 text-amber-800 hover:bg-amber-100');
    } else if (dateInfo) {
      classes.push(getStatusStyles(dateInfo.status));
    } else {
      classes.push('hover:bg-gray-100');
    }

    return classes.join(' ');
  };

  const tileContent = ({ date }) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateString];
    
    if (!dateInfo) return null;
    
    return (
      <div 
        title={getStatusTitle(dateInfo.status, dateInfo)}
        className="w-full h-full"
      />
    );
  };

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate) {
      Swal.fire('Please select both check-in and check-out dates.');
      return;
    }
    if (!termsAccepted) {
      Swal.fire('You must accept the terms and conditions to proceed.');
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
      
      // Debug logging
      console.log('Room data for booking:', {
        room,
        amenities: room.amenities,
        type: room.amenities ? typeof room.amenities : 'undefined'
      });
      
      // Get amenities from the room.amenities array
      const amenitiesStr = Array.isArray(room.amenities) ? 
        room.amenities.filter(amenity => amenity !== null).join(', ') : 
        '';
      
      Swal.fire({
        title: '<span style="color: #2563eb">Booking Successful! 🎉</span>',
        html: `
          <div style='text-align: left; padding: 20px; background: #f8fafc; border-radius: 8px;'>
            <h3 style='color: #2563eb; margin-bottom: 15px; font-size: 1.2em;'>Booking Details</h3>
            <div style='background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
              <p style='margin: 10px 0; font-size: 1.1em;'><strong style='color: #475569;'>Booking Reference:</strong> <span style='color: #2563eb; font-weight: 500;'>${response.data.data.bookingReference}</span></p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Room:</strong> ${room.name}</p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Check-In:</strong> ${format(checkInDate, 'EEEE, MMMM d, yyyy')}</p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Check-Out:</strong> ${format(checkOutDate, 'EEEE, MMMM d, yyyy')}</p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Total Nights:</strong> ${totalNights}</p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
              ${amenitiesStr ? `<p style='margin: 10px 0;'><strong style='color: #475569;'>Room Amenities:</strong> ${amenitiesStr}</p>` : ''}
              ${specialRequests ? `<p style='margin: 10px 0;'><strong style='color: #475569;'>Special Requests:</strong> ${specialRequests}</p>` : ''}
            </div>
            ${room.images?.[0] ? `<img src='${room.images[0]}' alt='Room Image' style='width: 100%; border-radius: 8px; margin-top: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);' />` : ''}
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Done',
        confirmButtonColor: '#2563eb',
        width: '600px',
        showCloseButton: true,
        allowOutsideClick: false
      });
    } catch (error) {
      console.error('Error booking the room:', error);
      Swal.fire({
        title: 'Booking Failed',
        text: error.response?.data?.message || 'Unable to complete your booking. Please try again.',
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#2563eb'
      });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle>Book Your Stay</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    onChange={handleDateClick}
                    onActiveStartDateChange={handleMonthChange}
                    activeStartDate={activeStartDate}
                    value={checkInDate || checkOutDate ? [checkInDate, checkOutDate].filter(Boolean) : null}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    minDate={new Date()}
                    className="w-full border rounded-lg p-4"
                  />
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                      <span className="text-sm">Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                      <span className="text-sm">Booked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-orange-100 rounded mr-2"></div>
                      <span className="text-sm">Maintenance</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                      <span className="text-sm">Blocked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-amber-100 rounded mr-2"></div>
                      <span className="text-sm">Selected Dates</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Check-in Date</p>
                        <p className="text-lg">{checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'Not selected'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Check-out Date</p>
                        <p className="text-lg">{checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'Not selected'}</p>
                      </div>
                    </div>

                    {room.price_per_night && (
                      <div className="border-t pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Price per night</span>
                            <span className="font-medium">${parseFloat(room.price_per_night).toFixed(2)}</span>
                          </div>
                          {totalNights > 0 && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Number of nights</span>
                                <span>{totalNights}</span>
                              </div>
                              <div className="flex justify-between items-center font-medium text-lg pt-2 border-t">
                                <span>Total price</span>
                                <span>${totalPrice.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6">
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
              disabled={!termsAccepted || !checkInDate || !checkOutDate}
              className={`w-full py-3 px-4 rounded-lg transition-colors ${
                termsAccepted && checkInDate && checkOutDate
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