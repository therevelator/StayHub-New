'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BedDouble, Bath, Mountain, Grid, Maximize, Home, Sofa, Star } from 'lucide-react';
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
  const [alternativeRooms, setAlternativeRooms] = useState([]);
  const [checkinOnlyDates, setCheckinOnlyDates] = useState([]);
  const [checkoutOnlyDates, setCheckoutOnlyDates] = useState([]);

  const isRoomFullyAvailable = (availability) => {
    if (!availability) return false;
    return Object.values(availability).every(info => 
      info.status === 'available' && !info.booking_id
    );
  };

  const isDateRangeAvailable = (availability, startDate, endDate) => {
    if (!startDate || !endDate || !availability) {
      console.log('Missing required data:', { availability, startDate, endDate });
      return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Get all dates in the range
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }
    
    console.log('Checking availability for dates:', dates);
    
    // Check if we have availability info for ALL dates
    const availability_status = dates.map(date => {
      const info = availability[date];
      
      // A date is available if:
      // 1. It's the check-in date (first date) - can use checkout-starred dates
      // 2. It's the check-out date (last date) - can use checkin-starred dates
      // 3. All middle dates must be fully available (no bookings)
      
      const isStartDate = date === format(start, 'yyyy-MM-dd');
      const isEndDate = date === format(end, 'yyyy-MM-dd');
      
      let isAvailable = false;
      
      if (!info) {
        isAvailable = false;
      } else if (isStartDate && isEndDate) {
        // Same day check-in/check-out (edge case)
        // A date can be both check-in and check-out if it's marked as such
        isAvailable = info.status === 'available' || 
                     (info.is_checkin_only && info.is_checkout_only);
      } else if (isStartDate) {
        // Check-in date: either regular available date or a checkout-starred date
        // We allow a checkout-starred date to be used as a check-in date
        isAvailable = info.status === 'available' || 
                     info.is_checkin_only || 
                     info.is_checkout_only;
      } else if (isEndDate) {
        // Check-out date: either regular available date or a checkin-starred date
        // We allow a checkin-starred date to be used as a check-out date
        isAvailable = info.status === 'available' || 
                     info.is_checkout_only || 
                     info.is_checkin_only;
      } else {
        // Middle dates: must be fully available (no bookings)
        isAvailable = info.status === 'available' && !info.booking_id;
      }
      
      const status = {
        date,
        available: isAvailable,
        info,
        isStartDate,
        isEndDate
      };
      console.log('Date status:', status);
      return status;
    });
    
    const all_available = availability_status.every(status => status.available);
    console.log('All dates available:', all_available);
    
    return all_available;
  };

  const fetchAvailability = async (date) => {
    try {
      // Get first and last day of the displayed month
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      firstDay.setHours(0, 0, 0, 0);
      lastDay.setHours(0, 0, 0, 0);
      
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
      
      const { requested_room, other_rooms } = availabilityResponse.data.data;
      
      // Process availability data for the requested room
      const available = [];
      const unavailable = [];
      const checkinOnly = [];
      const checkoutOnly = [];
      
      // Process raw availability data to identify check-in and check-out only dates
      if (requested_room?.availability) {
        // Get all booking IDs to track
        const bookingIds = new Set();
        
        // Create a map of all dates to properly analyze booking patterns
        const dateMap = {};
        
        // First pass: collect all booking data
        Object.entries(requested_room.availability).forEach(([dateStr, info]) => {
          dateMap[dateStr] = { ...info };
          
          if (info.booking_id) {
            bookingIds.add(info.booking_id);
          }
        });
        
        // Initialize bookings object to track booking details
        const bookings = {};
        bookingIds.forEach(id => {
          bookings[id] = { dates: [], checkInDate: null, checkOutDate: null };
        });
        
        // Second pass: identify all dates for each booking
        Object.entries(dateMap).forEach(([dateStr, info]) => {
          if (info.booking_id) {
            if (!bookings[info.booking_id].dates.includes(dateStr)) {
              bookings[info.booking_id].dates.push(dateStr);
            }
          }
        });
        
        // Sort dates and determine check-in/check-out dates for each booking
        Object.values(bookings).forEach(booking => {
          if (booking.dates.length > 0) {
            booking.dates.sort();
            booking.checkInDate = booking.dates[0];
            // The checkout date is the day AFTER the last occupied date
            // This is because checkout date is not part of the booking dates
            const lastOccupiedDate = new Date(booking.dates[booking.dates.length - 1]);
            const checkoutDate = new Date(lastOccupiedDate);
            checkoutDate.setDate(checkoutDate.getDate() + 1);
            booking.checkOutDate = format(checkoutDate, 'yyyy-MM-dd');
          }
        });
        
        // Third pass: mark check-in and check-out dates
        Object.entries(dateMap).forEach(([dateStr, info]) => {
          let isCheckinOnly = false;
          let isCheckoutOnly = false;
          
          // Check if this date is a check-in date for any booking
          Object.values(bookings).forEach(booking => {
            // Check-in date is the first day of the booking
            if (dateStr === booking.checkInDate) {
              isCheckinOnly = true;
              info.is_checkin_only = true;
            }
            
            // Check-out date is the day AFTER the last occupied date
            if (dateStr === booking.checkOutDate) {
              isCheckoutOnly = true;
              info.is_checkout_only = true;
            }
          });
          
          // Handle directly marked dates from API (if available)
          if (info.is_checkin_only) {
            isCheckinOnly = true;
          }
          if (info.is_checkout_only) {
            isCheckoutOnly = true;
          }
          
          // Update the date info in the dateMap
          dateMap[dateStr] = { 
            ...info, 
            is_checkin_only: isCheckinOnly, 
            is_checkout_only: isCheckoutOnly 
          };
        });
        
        // Final pass: categorize dates for displaying in the calendar
        Object.entries(dateMap).forEach(([dateStr, info]) => {
          // Ensure the processed info is applied back to the original data
          requested_room.availability[dateStr] = { ...info };
          
          // Categorize the date
          if (info.is_checkout_only && !info.booking_id) {
            // Checkout-only date that isn't occupied
            checkoutOnly.push(dateStr);
            info.status = 'available'; // Mark as available for the calendar
          } else if (info.is_checkin_only && !info.booking_id) {
            // Checkin-only date that isn't occupied
            checkinOnly.push(dateStr);
            info.status = 'available'; // Mark as available for the calendar
          } else if (info.is_checkin_only && info.is_checkout_only) {
            // Both checkin and checkout (special case)
            info.status = 'available'; // Mark as available for the calendar
            available.push(dateStr);
          } else if (info.booking_id) {
            // Occupied date
            unavailable.push(dateStr);
          } else if (info.status === 'available') {
            // Regular available date
            available.push(dateStr);
          } else {
            // Maintenance, blocked, or other unavailable status
            unavailable.push(dateStr);
          }
        });
      }
      
      const availability = requested_room?.availability || {};
      setAvailabilityMap(availability);
      setAvailableDates(available);
      setBookingDates(unavailable);
      setCheckinOnlyDates(checkinOnly);
      setCheckoutOnlyDates(checkoutOnly);
      
      // Update room data with availability status
      setRoom(prev => ({
        ...prev,
        ...requested_room,
        is_fully_available: isRoomFullyAvailable(availability)
      }));
      
      // Process alternative rooms - check each room's complete date range
      const processedAlternativeRooms = (other_rooms || []).map(room => ({
        ...room,
        is_available: Object.values(room.availability).every(info => 
          info.status === 'available' && !info.booking_id
        )
      }));
      
      setAlternativeRooms(processedAlternativeRooms);
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
      const [year, month, day] = startDate.split('-').map(Number);
      const checkInDateObj = new Date(year, month - 1, day);
      checkInDateObj.setHours(0, 0, 0, 0);
      console.log('=== START DATE DEBUG ===');
      console.log('Input start date:', startDate);
      console.log('Parsed date:', format(checkInDateObj, 'yyyy-MM-dd'));
      setCheckInDate(checkInDateObj);
      setActiveStartDate(checkInDateObj);
    }
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const checkOutDateObj = new Date(year, month - 1, day);
      checkOutDateObj.setHours(0, 0, 0, 0);
      console.log('=== END DATE DEBUG ===');
      console.log('Input end date:', endDate);
      console.log('Parsed date:', format(checkOutDateObj, 'yyyy-MM-dd'));
      setCheckOutDate(checkOutDateObj);
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
    
    // Add info for check-in only and check-out only dates
    if (info.is_checkin_only && info.is_checkout_only) {
      return `Booked - This date is both check-in and check-out for different bookings`;
    } else if (info.is_checkin_only) {
      return `Check-in only date - ${price}/night${notes}`;
    } else if (info.is_checkout_only) {
      return `Check-out only date - ${price}/night${notes}`;
    }
    
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
    
    console.log('=== DATE SELECTION DEBUG ===');
    console.log('Calendar value:', {
      raw: value,
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      date: value.getDate(),
      hours: value.getHours(),
      fullDate: value.toString(),
      isoString: value.toISOString()
    });
    
    const selectedDate = value;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateStr];
    
    // Don't allow selecting dates without info
    if (!dateInfo) {
      Swal.fire({
        icon: 'error',
        title: 'Date Not Available',
        text: `This room has no availability information for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      return;
    }
    
    // If this date is available for check-in or check-out, allow it to be selected
    const canSelectForCheckIn = dateInfo.status === 'available' || dateInfo.is_checkin_only;
    const canSelectForCheckOut = dateInfo.status === 'available' || dateInfo.is_checkout_only;
    
    // Full date availability check
    const isUnavailable = (!canSelectForCheckIn && !canSelectForCheckOut) ||
                         (dateInfo.booking_id && !dateInfo.is_checkin_only && !dateInfo.is_checkout_only);
      
    if (isUnavailable) {
      Swal.fire({
        icon: 'error',
        title: 'Date Not Available',
        text: `This room is not available on ${format(selectedDate, 'MMMM d, yyyy')}`,
        footer: 'Check our alternative rooms for these dates'
      });
      return;
    }

    // If clicking the same check-in date, cancel the selection
    if (checkInDate && format(selectedDate, 'yyyy-MM-dd') === format(checkInDate, 'yyyy-MM-dd') && !checkOutDate) {
      setCheckInDate(null);
      return;
    }

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection - check if this date can be used as check-in
      if (!canSelectForCheckIn) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Selection',
          text: `This date can only be used as a check-out date.`
        });
        return;
      }
      
      // Start new selection
      setCheckInDate(selectedDate);
      setCheckOutDate(null);
      console.log('Set check-in date:', format(selectedDate, 'yyyy-MM-dd'));
    } else {
      // Complete selection - check if this date can be used as check-out
      if (!canSelectForCheckOut) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Selection',
          text: `This date can only be used as a check-in date.`
        });
        return;
      }
      
      // Complete the selection
      if (selectedDate <= checkInDate) {
        // Prevent selecting same day or earlier day for checkout
        Swal.fire('Check-out date must be after check-in date');
        return;
      }
      setCheckOutDate(selectedDate);
      console.log('Set check-out date:', format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleMonthChange = ({ activeStartDate, view }) => {
    console.log('Calendar view changed:', { activeStartDate, view });
    if (view === 'month') {
      setActiveStartDate(activeStartDate);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const dateString = format(date, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateString];
    
    const isCheckIn = checkInDate && dateString === format(checkInDate, 'yyyy-MM-dd');
    const isCheckOut = checkOutDate && dateString === format(checkOutDate, 'yyyy-MM-dd');
    const isBetween = checkInDate && checkOutDate && 
      date > checkInDate && 
      date < checkOutDate;

    const isCheckinOnly = dateInfo?.is_checkin_only;
    const isCheckoutOnly = dateInfo?.is_checkout_only;
    
    let classes = ['rounded-lg', 'relative'];

    // Add range selection classes for better styling
    if (isCheckIn) classes.push('react-calendar__tile--rangeStart');
    if (isCheckOut) classes.push('react-calendar__tile--rangeEnd');
    if (isBetween) classes.push('react-calendar__tile--rangeBetween');

    // Selection styles take precedence
    if (isCheckIn || isCheckOut) {
      classes.push('react-calendar__tile--active');
    } else if (isBetween) {
      // Already handled by rangeBetween class
    } else if (dateInfo) {
      // Check if the date is both check-in and check-out for another booking
      if (isCheckinOnly && isCheckoutOnly) {
        classes.push('checkin-checkout');
      } 
      // Check if it's a check-in only date
      else if (isCheckinOnly) {
        classes.push('checkin-only');
      } 
      // Check if it's a check-out only date
      else if (isCheckoutOnly) {
        classes.push('checkout-only');
      } 
      // Otherwise, standard availability check
      else {
        const isAvailable = dateInfo.status === 'available' && !dateInfo.booking_id;
        classes.push(getStatusStyles(isAvailable ? 'available' : 'occupied'));
      }
    } else {
      classes.push('hover:bg-gray-100');
    }

    return classes.join(' ');
  };

  const tileContent = ({ date }) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateString];
    
    if (!dateInfo) return null;
    
    const isCheckinOnly = dateInfo.is_checkin_only;
    const isCheckoutOnly = dateInfo.is_checkout_only;
    
    let tooltipText = getStatusTitle(dateInfo.status, dateInfo);
    
    return (
      <div 
        title={tooltipText}
        className="w-full h-full relative"
      >
        {isCheckinOnly && !isCheckoutOnly && (
          <div className="absolute bottom-0 right-0 star-checkin">
            <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
          </div>
        )}
        {isCheckoutOnly && !isCheckinOnly && (
          <div className="absolute top-0 left-0 star-checkout">
            <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
          </div>
        )}
        {isCheckinOnly && isCheckoutOnly && (
          <>
            <div className="absolute bottom-0 right-0 star-checkin">
              <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
            </div>
            <div className="absolute top-0 left-0 star-checkout">
              <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
            </div>
          </>
        )}
      </div>
    );
  };

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate) {
      Swal.fire('Please select both check-in and check-out dates.');
      return;
    }

    // Check if the entire date range is available
    if (!isDateRangeAvailable(availabilityMap, checkInDate, checkOutDate)) {
      // Check if it's a case of checkout-star as check-in and checkin-star as checkout
      const checkInInfo = availabilityMap[format(checkInDate, 'yyyy-MM-dd')];
      const checkOutInfo = availabilityMap[format(checkOutDate, 'yyyy-MM-dd')];
      
      // If both dates are properly marked as available for these purposes, allow the booking
      const checkInValid = checkInInfo && 
                           (checkInInfo.status === 'available' || 
                           checkInInfo.is_checkin_only || 
                           checkInInfo.is_checkout_only);
                           
      const checkOutValid = checkOutInfo && 
                           (checkOutInfo.status === 'available' || 
                           checkOutInfo.is_checkout_only || 
                           checkOutInfo.is_checkin_only);
                           
      // Check dates in between
      const allMiddleDatesValid = (() => {
        const startDate = new Date(checkInDate);
        const endDate = new Date(checkOutDate);
        startDate.setDate(startDate.getDate() + 1); // Start from the day after check-in
        
        // If there are no middle dates (adjacent days), return true
        if (startDate >= endDate) return true;
        
        // Check each date in between
        const current = new Date(startDate);
        while (current < endDate) {
          const dateStr = format(current, 'yyyy-MM-dd');
          const dateInfo = availabilityMap[dateStr];
          
          // Middle dates must be fully available
          if (!dateInfo || dateInfo.status !== 'available' || dateInfo.booking_id) {
            return false;
          }
          
          current.setDate(current.getDate() + 1);
        }
        
        return true;
      })();
      
      // If all conditions are met, proceed with booking
      if (checkInValid && checkOutValid && allMiddleDatesValid) {
        // Proceed with booking
        console.log('Special case: Using checkout-starred date as check-in or checkin-starred date as checkout.');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Room Not Available',
          text: 'Some dates in your selected range are not available. Please choose different dates.'
        });
        return;
      }
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
      // Format dates in YYYY-MM-DD format for the API
      const bookingData = {
        propertyId,
        checkInDate: format(new Date(checkInDate), 'yyyy-MM-dd'),
        checkOutDate: format(new Date(checkOutDate), 'yyyy-MM-dd'),
        specialRequests,
        termsAccepted,
        numberOfGuests,
      };
      
      console.log('Selected dates:', { 
        checkIn: checkInDate, 
        checkOut: checkOutDate,
        formattedCheckIn: format(new Date(checkInDate), 'yyyy-MM-dd'),
        formattedCheckOut: format(new Date(checkOutDate), 'yyyy-MM-dd')
      });

      const response = await api.post(`/properties/${propertyId}/rooms/${roomId}/book`, bookingData);
      
      // If booking fails due to availability, show alternative rooms
      if (response.data.status === 'error' && alternativeRooms.length > 0) {
        const availableAlternatives = alternativeRooms.filter(r => r.is_available);
        if (availableAlternatives.length > 0) {
          const alternativesHtml = availableAlternatives
            .map(r => {
              // Calculate price range for the room
              const prices = Object.values(r.availability).map(a => parseFloat(a.price));
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceRange = minPrice === maxPrice ? 
                `$${minPrice.toFixed(2)}` : 
                `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
              
              return `<div class="mb-3 p-2 border rounded">
                <strong>${r.name}</strong><br>
                Room type: ${r.room_type}<br>
                Max occupancy: ${r.max_occupancy}<br>
                Price per night: ${priceRange}
              </div>`;
            })
            .join('');
            
          Swal.fire({
            title: 'Alternative Available Rooms',
            html: `<div class="text-left">
                    These rooms are available for your selected dates:<br><br>
                    ${alternativesHtml}
                  </div>`,
            showCancelButton: true,
            confirmButtonText: 'View Details',
            cancelButtonText: 'Close',
            width: '600px'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navigate to property page with current dates
              window.location.href = `/properties/${propertyId}?startDate=${format(checkInDate, 'yyyy-MM-dd')}&endDate=${format(checkOutDate, 'yyyy-MM-dd')}`;
            }
          });
          return;
        }
      }
      
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

              <div style='margin: 15px 0; padding: 10px; background: #f8fafc; border-radius: 6px;'>
                <p style='margin: 5px 0; color: #475569; font-weight: 600;'>Room Details:</p>
                ${room.description ? `<p style='margin: 8px 0; color: #64748b;'>${room.description}</p>` : ''}
                
                ${room.beds ? `
                  <div style='margin: 10px 0;'>
                    <strong style='color: #475569;'>Bed Configuration:</strong>
                    <div style='color: #64748b; margin-top: 4px;'>
                      ${(typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds)
                        .map(bed => `${bed.count} ${bed.type}`).join(', ')}
                    </div>
                  </div>
                ` : ''}

                ${room.bathroom_type ? `
                  <div style='margin: 10px 0;'>
                    <strong style='color: #475569;'>Bathroom:</strong>
                    <span style='color: #64748b; margin-left: 4px;'>${room.bathroom_type}</span>
                  </div>
                ` : ''}

                ${room.view_type ? `
                  <div style='margin: 10px 0;'>
                    <strong style='color: #475569;'>View:</strong>
                    <span style='color: #64748b; margin-left: 4px;'>${room.view_type}</span>
                  </div>
                ` : ''}

                ${room.flooring_type ? `
                  <div style='margin: 10px 0;'>
                    <strong style='color: #475569;'>Flooring:</strong>
                    <span style='color: #64748b; margin-left: 4px;'>${room.flooring_type}</span>
                  </div>
                ` : ''}

                ${room.size ? `
                  <div style='margin: 10px 0;'>
                    <strong style='color: #475569;'>Room Size:</strong>
                    <span style='color: #64748b; margin-left: 4px;'>${room.size} m²</span>
                  </div>
                ` : ''}
              </div>
              
              ${room.amenities ? `
                <div style='margin: 10px 0;'>
                  <strong style='color: #475569;'>Amenities:</strong>
                  <div style='display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;'>
                    ${(typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities)
                      .map(amenity => `<span style='background: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #64748b; font-size: 0.9em;'>${amenity}</span>`)
                      .join('')}
                  </div>
                </div>
              ` : ''}
              
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Add CSS for calendar stars */}
      <style>
        {`
          .react-calendar .react-calendar__tile {
            position: relative;
            padding-bottom: 14px;
          }
          
          .star-checkin {
            position: absolute;
            bottom: 2px;
            right: 2px;
            pointer-events: none;
            z-index: 2;
          }
          
          .star-checkout {
            position: absolute;
            top: 2px;
            left: 2px;
            pointer-events: none;
            z-index: 2;
          }
          
          .checkin-only {
            background-color: #86efac !important; /* Green background */
            color: #166534 !important;
          }
          
          .checkout-only {
            background-color: #86efac !important; /* Green background */
            color: #166534 !important;
          }
          
          .checkin-checkout {
            background-color: #fee2e2 !important; /* Red background - same as booked */
            color: #b91c1c !important;
          }
          
          /* Make sure selected dates take priority */
          .react-calendar__tile--active,
          .react-calendar__tile--active:enabled:hover,
          .react-calendar__tile--active:enabled:focus {
            background: #fef3c7 !important;
            color: #92400e !important;
          }
          
          /* Make the days between selected dates visible */
          .react-calendar__tile--rangeStart,
          .react-calendar__tile--rangeEnd {
            background: #fef3c7 !important;
            color: #92400e !important;
          }
          
          .react-calendar__tile--rangeBetween {
            background: #fffbeb !important;
            color: #92400e !important;
          }
        `}
      </style>
      
      {room && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-4">{room.name}</h1>
            <p className="text-gray-600 mb-4">{room.description}</p>
            
            {/* Calendar Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    locale="en-US"
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
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-300 rounded mr-2 relative">
                        <div className="absolute bottom-0 right-0">
                          <Star className="w-2 h-2 text-amber-500" fill="currentColor" />
                        </div>
                      </div>
                      <span className="text-sm">Check-in Only</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-300 rounded mr-2 relative">
                        <div className="absolute top-0 left-0">
                          <Star className="w-2 h-2 text-amber-500" fill="currentColor" />
                        </div>
                      </div>
                      <span className="text-sm">Check-out Only</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 rounded mr-2 relative">
                        <div className="absolute bottom-0 right-0">
                          <Star className="w-2 h-2 text-amber-500" fill="currentColor" />
                        </div>
                        <div className="absolute top-0 left-0">
                          <Star className="w-2 h-2 text-amber-500" fill="currentColor" />
                        </div>
                      </div>
                      <span className="text-sm">Booked (Check-in/Check-out)</span>
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
                        <p className="text-lg">{checkInDate ? format(new Date(checkInDate), 'MMM d, yyyy') : 'Not selected'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Check-out Date</p>
                        <p className="text-lg">{checkOutDate ? format(new Date(checkOutDate), 'MMM d, yyyy') : 'Not selected'}</p>
                      </div>
                    </div>

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

                        {checkInDate && checkOutDate ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-lg font-medium mb-4">
                              <span>Price per night</span>
                              <span>${room.price_per_night}</span>
                            </div>
                            {nightlyPrices.length > 0 && (
                              <>
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
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">Select dates to see prices and availability</p>
                          </div>
                        )}
                      </div>
                    </div>

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

              {/* Room Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium text-gray-700">Description</h4>
                      </div>
                      <p className="text-gray-600">{room.description}</p>
                    </div>

                    {room.beds && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BedDouble className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-700">Bed Configuration</h4>
                        </div>
                        <div className="text-gray-600 space-y-1">
                          {typeof room.beds === 'string' ? 
                            JSON.parse(room.beds).map((bed, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                {bed.count} {bed.type}
                              </div>
                            )) : 
                            room.beds.map((bed, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                {bed.count} {bed.type}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {room.bathroom_type && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bath className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-700">Bathroom Type</h4>
                        </div>
                        <p className="text-gray-600">{room.bathroom_type}</p>
                      </div>
                    )}

                    {room.view_type && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Mountain className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-700">View Type</h4>
                        </div>
                        <p className="text-gray-600">{room.view_type}</p>
                      </div>
                    )}

                    {room.flooring_type && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Grid className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-700">Flooring Type</h4>
                        </div>
                        <p className="text-gray-600">{room.flooring_type}</p>
                      </div>
                    )}

                    {room.size && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Maximize className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-700">Room Size</h4>
                        </div>
                        <p className="text-gray-600">{room.size} m²</p>
                      </div>
                    )}

                    {room.amenities && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sofa className="w-5 h-5 text-gray-600" />
                          <h4 className="font-medium text-gray-700">Amenities</h4>
                        </div>
                        <div className="text-gray-600 flex flex-wrap gap-2">
                          {(typeof room.amenities === 'string' ? 
                            JSON.parse(room.amenities) :
                            room.amenities
                          ).map((amenity, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded-md text-sm">{amenity}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {checkInDate && checkOutDate && !isDateRangeAvailable(availabilityMap, checkInDate, checkOutDate) ? (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium mb-2">Room Not Available</p>
                <p className="text-red-500 text-sm">This room is not available for the selected dates. Please choose different dates or check our alternative rooms below.</p>
                {alternativeRooms.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Alternative Available Rooms:</h4>
                    <div className="space-y-2">
                      {alternativeRooms.map(altRoom => (
                        <div key={altRoom.id} className="p-3 bg-white rounded border border-gray-200">
                          <p className="font-medium text-gray-800">{altRoom.name}</p>
                          <p className="text-sm text-gray-600 mb-2">${altRoom.price}/night</p>
                          <button 
                            onClick={() => navigate(`/property/${propertyId}/room/${altRoom.id}?startDate=${format(checkInDate, 'yyyy-MM-dd')}&endDate=${format(checkOutDate, 'yyyy-MM-dd')}`)} 
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            View Room →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : checkInDate && checkOutDate ? (
              <>
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
                  disabled={!termsAccepted}
                  className={`w-full py-3 px-4 rounded-lg transition-colors ${
                    termsAccepted
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Book this Room
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;