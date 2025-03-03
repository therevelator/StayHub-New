'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [nightlyPrices, setNightlyPrices] = useState([]);

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

  // Get URL search params
  const [searchParams] = useSearchParams();

  // Set initial dates from URL parameters
  useEffect(() => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate) {
      setCheckInDate(new Date(startDate));
      setActiveStartDate(new Date(startDate));
    }
    if (endDate) {
      setCheckOutDate(new Date(endDate));
    }
  }, [searchParams]);

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
        const prices = [];
        
        for (let i = 0; i < nights; i++) {
          const currentDate = new Date(checkInDate);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          // Use custom price if available, otherwise use default room price
          const dayPrice = parseFloat(availabilityMap[dateStr]?.price || defaultPrice);
          calculatedPrice += dayPrice;
          prices.push({ date: currentDate, price: dayPrice });
        }
        
        setNightlyPrices(prices);
        setTotalPrice(parseFloat(calculatedPrice));
      } else {
        setTotalNights(0);
        setTotalPrice(0);
        setNightlyPrices([]);
      }
    } else {
      setTotalNights(0);
      setTotalPrice(0);
      setNightlyPrices([]);
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
    
    // Only allow selecting the first blocked date after an available date as checkout
    if (dateInfo && (dateInfo.status === 'occupied' || dateInfo.status === 'maintenance' || dateInfo.status === 'blocked')) {
      // If we have a check-in date and this is after it, check if it's the first blocked date
      if (checkInDate && value > checkInDate && !checkOutDate) {
        // Check if all dates between check-in and this date are available
        const daysBetween = differenceInDays(value, checkInDate);
        let isFirstBlockedDate = true;
        
        for (let i = 1; i < daysBetween; i++) {
          const currentDate = new Date(checkInDate);
          currentDate.setDate(currentDate.getDate() + i);
          const currentDateStr = format(currentDate, 'yyyy-MM-dd');
          const currentDateInfo = availabilityMap[currentDateStr];
          
          if (currentDateInfo && (currentDateInfo.status === 'occupied' || currentDateInfo.status === 'maintenance' || currentDateInfo.status === 'blocked')) {
            isFirstBlockedDate = false;
            break;
          }
        }
        
        if (isFirstBlockedDate) {
          setCheckOutDate(value);
          return;
        }
      }
      // Otherwise, don't allow selection
      Swal.fire('You can only select the first blocked date after your check-in date');
      return;
    }

    // If clicking the same check-in date, cancel the selection
    if (checkInDate && format(value, 'yyyy-MM-dd') === format(checkInDate, 'yyyy-MM-dd') && !checkOutDate) {
      setCheckInDate(null);
      return;
    }

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection
      setCheckInDate(value);
      setCheckOutDate(null);
    } else {
      // Complete the selection
      if (value <= checkInDate) {
        // Prevent selecting same day or earlier day for checkout
        Swal.fire('Check-out date must be after check-in date');
        return;
      }
      setCheckOutDate(value);
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

    if (numberOfGuests > room.max_occupancy) {
      Swal.fire({
        icon: 'error',
        title: 'Max Occupancy Exceeded',
        text: `This room can only accommodate up to ${room.max_occupancy} guests.`
      });
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
        numberOfGuests,
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
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Number of Guests:</strong> ${numberOfGuests}</p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Check-In:</strong> ${format(checkInDate, 'EEEE, MMMM d, yyyy')}</p>
              <p style='margin: 10px 0;'><strong style='color: #475569;'>Check-Out:</strong> ${format(checkOutDate, 'EEEE, MMMM d, yyyy')}</p>
              
              <div style='margin: 15px 0; padding: 10px; background: #f8fafc; border-radius: 6px;'>
                <p style='margin: 5px 0; color: #475569; font-weight: 600;'>Price Breakdown:</p>
                ${nightlyPrices.map(({ date, price }) => `
                  <div style='display: flex; justify-content: space-between; margin: 5px 0;'>
                    <span style='color: #64748b;'>${format(date, 'EEE, MMM d, yyyy')}</span>
                    <span style='color: #475569; font-weight: 500;'>$${price.toFixed(2)}</span>
                  </div>
                `).join('')}
                <div style='display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;'>
                  <span style='color: #475569; font-weight: 600;'>Total Nights:</span>
                  <span style='color: #475569; font-weight: 500;'>${totalNights}</span>
                </div>
                <div style='display: flex; justify-content: space-between; margin-top: 5px; font-weight: 600;'>
                  <span style='color: #475569;'>Total Price:</span>
                  <span style='color: #2563eb;'>$${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
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
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
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
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Number of Guests
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={room.max_occupancy}
                              value={numberOfGuests}
                              onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="text-sm text-gray-500 mt-1">Max occupancy: {room.max_occupancy} guests</p>
                          </div>

                          {nightlyPrices.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-medium text-gray-700">Price Breakdown:</p>
                              {nightlyPrices.map(({ date, price }, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{format(date, 'EEE, MMM d, yyyy')}</span>
                                  <span className="font-medium">${price.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-gray-600">Number of nights</span>
                                <span>{totalNights}</span>
                              </div>
                              <div className="flex justify-between items-center font-medium text-lg pt-2 border-t">
                                <span>Total price</span>
                                <span>${totalPrice.toFixed(2)}</span>
                              </div>
                            </div>
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