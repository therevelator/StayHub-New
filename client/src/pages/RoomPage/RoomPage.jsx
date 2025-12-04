'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, differenceInDays } from 'date-fns';
import {
  BedDouble,
  Bath,
  Mountain,
  Maximize,
  Home,
  Sofa,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  Coffee,
  Wifi,
  Car,
  Wind,
  Tv,
  MapPin
} from 'lucide-react';
import Swal from 'sweetalert2';
import './RoomPage.css';

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomId, propertyId } = useParams();
  const [room, setRoom] = useState(null);
  const [property, setProperty] = useState(null);
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showTerms, setShowTerms] = useState(false);

  // Get URL search params
  const [searchParams] = useSearchParams();

  const isRoomFullyAvailable = (availability) => {
    if (!availability) return false;
    return Object.values(availability).every(info =>
      info.status === 'available' && !info.booking_id
    );
  };

  const isDateRangeAvailable = (availability, startDate, endDate) => {
    if (!startDate || !endDate || !availability) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }

    return dates.every((date, index) => {
      const info = availability[date];
      if (!info) return false;

      const isStartDate = index === 0;
      const isEndDate = index === dates.length - 1;

      if (isStartDate) {
        // Can check in if fully available or is a booking end (canCheckIn)
        return info.status === 'available' || info.canCheckIn;
      }

      if (isEndDate) {
        // Can check out if fully available or is a booking start (canCheckOut)
        return info.status === 'available' || info.canCheckOut;
      }

      // Middle dates must be fully available
      return info.status === 'available' && !info.booking_id;
    });
  };

  const fetchAvailability = async (date) => {
    try {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      firstDay.setHours(0, 0, 0, 0);
      lastDay.setHours(0, 0, 0, 0);

      const startDateStr = format(firstDay, 'yyyy-MM-dd');
      const endDateStr = format(lastDay, 'yyyy-MM-dd');

      const availabilityResponse = await api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, {
        params: { startDate: startDateStr, endDate: endDateStr }
      });

      const { requested_room, other_rooms } = availabilityResponse.data.data;

      if (requested_room?.availability) {
        const bookingIds = new Set();
        const dateMap = {};

        Object.entries(requested_room.availability).forEach(([dateStr, info]) => {
          dateMap[dateStr] = { ...info };
          if (info.booking_id) bookingIds.add(info.booking_id);
        });

        const bookings = {};
        bookingIds.forEach(id => {
          bookings[id] = { dates: [], checkInDate: null, checkOutDate: null };
        });

        Object.entries(dateMap).forEach(([dateStr, info]) => {
          if (info.booking_id && bookings[info.booking_id]) {
            bookings[info.booking_id].dates.push(dateStr);
          }
        });

        Object.values(bookings).forEach(booking => {
          if (booking.dates.length > 0) {
            booking.dates.sort();
            booking.checkInDate = booking.dates[0];
            const lastOccupiedDate = new Date(booking.dates[booking.dates.length - 1]);
            const checkoutDate = new Date(lastOccupiedDate);
            checkoutDate.setDate(checkoutDate.getDate() + 1);
            booking.checkOutDate = format(checkoutDate, 'yyyy-MM-dd');
          }
        });

        // Reset flags
        Object.values(dateMap).forEach(info => {
          info.canCheckIn = false;
          info.canCheckOut = false;
          info.isBookingStart = false;
          info.isBookingEnd = false;
        });

        Object.values(bookings).forEach(booking => {
          // Booking Start Date: User can Check-out (morning free), but NOT Check-in (night taken)
          if (dateMap[booking.checkInDate]) {
            dateMap[booking.checkInDate].isBookingStart = true;
            dateMap[booking.checkInDate].canCheckOut = true;
          }

          // Booking End Date: User can Check-in (afternoon free), but NOT Check-out (morning taken by this booking)
          // Note: Booking End Date might not be in dateMap if it's outside the fetched range or not occupied
          // We need to ensure it exists in dateMap if we want to render it
          if (!dateMap[booking.checkOutDate]) {
            // If it's not in map (e.g. next month or just not returned as 'occupied'), 
            // we might assume it's available. But for rendering the "split", we need to know.
            // For now, only mark if it exists.
          } else {
            dateMap[booking.checkOutDate].isBookingEnd = true;
            dateMap[booking.checkOutDate].canCheckIn = true;
          }
        });

        // Also mark fully available days as canCheckIn/canCheckOut
        Object.values(dateMap).forEach(info => {
          if (info.status === 'available' && !info.booking_id) {
            info.canCheckIn = true;
            info.canCheckOut = true;
          }
        });

        requested_room.availability = dateMap;
      }

      const availability = requested_room?.availability || {};
      setAvailabilityMap(availability);

      setRoom(prev => ({
        ...prev,
        ...requested_room,
        is_fully_available: isRoomFullyAvailable(availability)
      }));

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('RoomPage: Starting fetchData');
        setLoading(true);

        // Fetch room details
        console.log(`RoomPage: Fetching room ${roomId}`);
        const roomResponse = await api.get(`/properties/${propertyId}/rooms/${roomId}`);
        console.log('RoomPage: Room response:', roomResponse);

        if (!roomResponse.data?.data) {
          throw new Error('Room data not found');
        }

        const roomData = roomResponse.data.data;

        if (roomData.amenities && typeof roomData.amenities === 'string') {
          try {
            const parsedAmenities = JSON.parse(roomData.amenities);
            if (Array.isArray(parsedAmenities)) {
              roomData.amenities = parsedAmenities;
            }
          } catch (e) {
            console.log('Error parsing room amenities:', e);
          }
        }

        setRoom(roomData);

        // Fetch property details for name and location
        try {
          console.log('RoomPage: Fetching property');
          const propertyResponse = await api.get(`/properties/${propertyId}`);
          if (propertyResponse.data?.data) {
            setProperty(propertyResponse.data.data);
          }
        } catch (e) {
          console.log('Error fetching property:', e);
        }

        console.log('RoomPage: Fetching availability');
        await fetchAvailability(activeStartDate);
        console.log('RoomPage: Availability fetched');
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to fetch room details');
      } finally {
        console.log('RoomPage: Finally block, setting loading false');
        setLoading(false);
      }
    };

    if (propertyId && roomId) {
      fetchData();
    }
  }, [propertyId, roomId, activeStartDate]);

  // Calculate total price when dates change
  useEffect(() => {
    if (checkInDate && checkOutDate && room?.price_per_night) {
      const nights = differenceInDays(checkOutDate, checkInDate);
      setTotalNights(nights);
      setTotalPrice(nights * room.price_per_night);
    } else {
      setTotalNights(0);
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, room?.price_per_night]);

  const handleMonthChange = ({ activeStartDate }) => {
    setActiveStartDate(activeStartDate);
  };

  const handleDateClick = (value) => {
    if (!value) return;

    const selectedDate = value;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateStr];

    if (!dateInfo) {
      // If no info, assume available (or handle as error)
      // For safety, let's assume if it's not in map, we can't book it
      Swal.fire({
        icon: 'error',
        title: 'Date Not Available',
        text: `No availability information for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      return;
    }

    const canSelectForCheckIn = dateInfo.canCheckIn;
    const canSelectForCheckOut = dateInfo.canCheckOut;

    if (!canSelectForCheckIn && !canSelectForCheckOut) {
      Swal.fire({
        icon: 'error',
        title: 'Date Not Available',
        text: `This room is not available on ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      return;
    }

    if (checkInDate && format(selectedDate, 'yyyy-MM-dd') === format(checkInDate, 'yyyy-MM-dd') && !checkOutDate) {
      setCheckInDate(null);
      return;
    }

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Selecting Check-in
      if (!canSelectForCheckIn) {
        Swal.fire({
          icon: 'info',
          title: 'Check-out Only',
          text: `This date can only be used as a check-out date.`
        });
        return;
      }
      setCheckInDate(selectedDate);
      setCheckOutDate(null);
    } else {
      // Selecting Check-out
      if (!canSelectForCheckOut) {
        Swal.fire({
          icon: 'info',
          title: 'Check-in Only',
          text: `This date can only be used as a check-in date.`
        });
        return;
      }
      if (selectedDate <= checkInDate) {
        // If clicking before check-in, treat as new check-in
        if (canSelectForCheckIn) {
          setCheckInDate(selectedDate);
          setCheckOutDate(null);
          return;
        }
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Date',
          text: 'Check-out date must be after check-in date'
        });
        return;
      }
      setCheckOutDate(selectedDate);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';

    const dateString = format(date, 'yyyy-MM-dd');
    const dateInfo = availabilityMap[dateString];

    const isCheckIn = checkInDate && dateString === format(checkInDate, 'yyyy-MM-dd');
    const isCheckOut = checkOutDate && dateString === format(checkOutDate, 'yyyy-MM-dd');
    const isBetween = checkInDate && checkOutDate && date > checkInDate && date < checkOutDate;

    let classes = ['calendar-tile'];

    // User Selection States
    if (isCheckIn) classes.push('tile-selection-start');
    if (isCheckOut) classes.push('tile-selection-end');
    if (isBetween) classes.push('tile-selection-between');

    // Booking States (Backgrounds)
    if (dateInfo) {
      if (dateInfo.isBookingStart) classes.push('tile-booked-start');
      if (dateInfo.isBookingEnd) classes.push('tile-booked-end');
      if (dateInfo.booking_id && !dateInfo.isBookingStart) classes.push('tile-booked-full');
    }

    return classes.join(' ');
  };

  const tileContent = ({ date }) => {
    return null; // Clean up indicators, rely on background styles
  };

  const handleBooking = async () => {
    if (!checkInDate || !checkOutDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Dates',
        text: 'Please select both check-in and check-out dates.'
      });
      return;
    }

    if (!isDateRangeAvailable(availabilityMap, checkInDate, checkOutDate)) {
      Swal.fire({
        icon: 'error',
        title: 'Room Not Available',
        text: 'Some dates in your selected range are not available.'
      });
      return;
    }

    if (numberOfGuests > room.max_occupancy) {
      Swal.fire({
        icon: 'error',
        title: 'Too Many Guests',
        text: `Maximum occupancy is ${room.max_occupancy} guests.`
      });
      return;
    }

    if (!termsAccepted) {
      Swal.fire({
        icon: 'warning',
        title: 'Terms Required',
        text: 'Please accept the terms and conditions.'
      });
      return;
    }

    try {
      const bookingData = {
        propertyId,
        checkInDate: format(new Date(checkInDate), 'yyyy-MM-dd'),
        checkOutDate: format(new Date(checkOutDate), 'yyyy-MM-dd'),
        specialRequests,
        termsAccepted,
        numberOfGuests,
      };

      const response = await api.post(`/properties/${propertyId}/rooms/${roomId}/book`, bookingData);

      Swal.fire({
        icon: 'success',
        title: 'Booking Confirmed! 🎉',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Reference:</strong> ${response.data.data.bookingReference}</p>
            <p class="mb-2"><strong>Room:</strong> ${room.name}</p>
            <p class="mb-2"><strong>Check-in:</strong> ${format(checkInDate, 'MMMM d, yyyy')}</p>
            <p class="mb-2"><strong>Check-out:</strong> ${format(checkOutDate, 'MMMM d, yyyy')}</p>
            <p class="mb-2"><strong>Guests:</strong> ${numberOfGuests}</p>
            <p class="mt-4 text-lg font-bold">Total: $${totalPrice.toFixed(2)}</p>
          </div>
        `,
        confirmButtonColor: '#2A9D8F'
      }).then(() => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Error booking the room:', error);
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: error.response?.data?.message || 'Unable to complete your booking.',
        confirmButtonColor: '#E76F51'
      });
    }
  };

  // Get room images with fallback
  const getRoomImages = () => {
    if (room?.images && Array.isArray(room.images) && room.images.length > 0) {
      return room.images;
    }
    // Fallback placeholder images
    return [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'
    ];
  };

  const images = getRoomImages();

  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    const lowerAmenity = amenity?.toLowerCase() || '';
    if (lowerAmenity.includes('wifi')) return <Wifi className="w-4 h-4" />;
    if (lowerAmenity.includes('tv')) return <Tv className="w-4 h-4" />;
    if (lowerAmenity.includes('air') || lowerAmenity.includes('ac')) return <Wind className="w-4 h-4" />;
    if (lowerAmenity.includes('parking')) return <Car className="w-4 h-4" />;
    if (lowerAmenity.includes('coffee') || lowerAmenity.includes('breakfast')) return <Coffee className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-page-container">
      {/* Hero Image Gallery */}
      <div className="hero-gallery">
        <div className="hero-main-image">
          <img
            src={images[selectedImageIndex]}
            alt={room?.name || 'Room'}
            className="hero-img"
          />
          <div className="hero-overlay">
            <button
              onClick={() => navigate(`/property/${propertyId}`)}
              className="back-button"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Property
            </button>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className="gallery-nav gallery-nav-prev"
                onClick={() => setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                className="gallery-nav gallery-nav-next"
                onClick={() => setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="image-counter">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="hero-thumbnails">
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`thumbnail ${idx === selectedImageIndex ? 'thumbnail-active' : ''}`}
                onClick={() => setSelectedImageIndex(idx)}
              >
                <img src={img} alt={`View ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Room Info Bar */}
      <div className="room-info-bar">
        <div className="room-info-content">
          <div className="room-info-left">
            <h1 className="room-title">{room?.name}</h1>
            {property && (
              <p className="room-property">
                <MapPin className="w-4 h-4" />
                {property.name} • {property.city}, {property.country}
              </p>
            )}
          </div>
          <div className="room-info-right">
            <div className="room-price-display">
              <span className="price-amount">${room?.price_per_night}</span>
              <span className="price-period">/ night</span>
            </div>
            <div className="room-meta">
              <span className="meta-item">
                <Users className="w-4 h-4" />
                {room?.max_occupancy} guests
              </span>
              <span className="meta-item">
                <BedDouble className="w-4 h-4" />
                {room?.room_type}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="room-content">
        {/* Left Column - Room Details */}
        <div className="room-details">
          {/* Description */}
          <section className="detail-section">
            <h2 className="section-title">
              <Home className="w-5 h-5" />
              About this room
            </h2>
            <p className="room-description">{room?.description}</p>
          </section>

          {/* Bed Configuration */}
          {room?.beds && (
            <section className="detail-section">
              <h2 className="section-title">
                <BedDouble className="w-5 h-5" />
                Bed Configuration
              </h2>
              <div className="beds-grid">
                {(typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds).map((bed, idx) => (
                  <div key={idx} className="bed-item">
                    <BedDouble className="w-8 h-8 text-primary-500" />
                    <span className="bed-count">{bed.count}x</span>
                    <span className="bed-type">{bed.type}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Room Features */}
          <section className="detail-section">
            <h2 className="section-title">
              <Sparkles className="w-5 h-5" />
              Room Features
            </h2>
            <div className="features-grid">
              {room?.bathroom_type && (
                <div className="feature-item">
                  <Bath className="w-5 h-5 text-primary-500" />
                  <span>{room.bathroom_type} Bathroom</span>
                </div>
              )}
              {room?.view_type && (
                <div className="feature-item">
                  <Mountain className="w-5 h-5 text-primary-500" />
                  <span>{room.view_type}</span>
                </div>
              )}
              {room?.size && (
                <div className="feature-item">
                  <Maximize className="w-5 h-5 text-primary-500" />
                  <span>{room.size} m²</span>
                </div>
              )}
              {room?.flooring_type && (
                <div className="feature-item">
                  <Home className="w-5 h-5 text-primary-500" />
                  <span>{room.flooring_type} Flooring</span>
                </div>
              )}
            </div>
          </section>

          {/* Amenities */}
          {room?.amenities && (
            <section className="detail-section">
              <h2 className="section-title">
                <Sofa className="w-5 h-5" />
                Amenities
              </h2>
              <div className="amenities-grid">
                {(typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities).map((amenity, idx) => (
                  <div key={idx} className="amenity-tag">
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Booking Card */}
        <div className="booking-sidebar">
          <div className="booking-card">
            <div className="booking-header">
              <h3>Book Your Stay</h3>
              <p className="booking-price">
                <span className="price-big">${room?.price_per_night}</span>
                <span className="price-night">/ night</span>
              </p>
            </div>

            {/* Calendar */}
            <div className="calendar-container">
              <Calendar
                onChange={handleDateClick}
                onActiveStartDateChange={handleMonthChange}
                activeStartDate={activeStartDate}
                value={checkInDate || checkOutDate ? [checkInDate, checkOutDate].filter(Boolean) : null}
                tileClassName={tileClassName}
                tileContent={tileContent}
                minDate={new Date()}
                locale="en-US"
                className="custom-calendar"
                prevLabel={<ChevronLeft className="w-5 h-5" />}
                nextLabel={<ChevronRight className="w-5 h-5" />}
              />

              {/* Calendar Legend */}
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-dot legend-available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot legend-booked"></div>
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot legend-selected"></div>
                  <span>Selected</span>
                </div>
              </div>
            </div>

            {/* Selected Dates */}
            <div className="dates-display">
              <div className="date-box">
                <label>Check-in</label>
                <span className={checkInDate ? 'date-selected' : 'date-empty'}>
                  {checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'Select date'}
                </span>
              </div>
              <div className="date-separator">→</div>
              <div className="date-box">
                <label>Check-out</label>
                <span className={checkOutDate ? 'date-selected' : 'date-empty'}>
                  {checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'Select date'}
                </span>
              </div>
            </div>

            {/* Guests */}
            <div className="guests-input">
              <label>
                <Users className="w-4 h-4" />
                Guests
              </label>
              <div className="guests-control">
                <button
                  onClick={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
                  disabled={numberOfGuests <= 1}
                >
                  -
                </button>
                <span>{numberOfGuests}</span>
                <button
                  onClick={() => setNumberOfGuests(Math.min(room?.max_occupancy || 10, numberOfGuests + 1))}
                  disabled={numberOfGuests >= (room?.max_occupancy || 10)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            {checkInDate && checkOutDate && (
              <div className="price-breakdown">
                <div className="breakdown-row">
                  <span>${room?.price_per_night} × {totalNights} nights</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="breakdown-total">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div className="special-requests">
              <label>Special Requests (optional)</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requests?"
                rows={3}
              />
            </div>

            {/* Terms */}
            <div className="terms-section">
              <button
                className="terms-toggle"
                onClick={() => setShowTerms(!showTerms)}
              >
                View Terms & Conditions
                <ChevronRight className={`w-4 h-4 transition-transform ${showTerms ? 'rotate-90' : ''}`} />
              </button>

              {showTerms && (
                <div className="terms-content">
                  <h4>1. Booking & Payment</h4>
                  <p>Full payment required at booking. Rates are per room, per night.</p>

                  <h4>2. Cancellation</h4>
                  <p>Free cancellation up to 48 hours before check-in.</p>

                  <h4>3. Check-in/out</h4>
                  <p>Check-in: 3:00 PM • Check-out: 11:00 AM</p>
                </div>
              )}

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>I accept the terms and conditions</span>
              </label>
            </div>

            {/* Book Button */}
            <button
              className={`book-button ${(!checkInDate || !checkOutDate || !termsAccepted) ? 'book-button-disabled' : ''}`}
              onClick={handleBooking}
              disabled={!checkInDate || !checkOutDate || !termsAccepted}
            >
              {!checkInDate || !checkOutDate
                ? 'Select dates to book'
                : !termsAccepted
                  ? 'Accept terms to book'
                  : `Book Now • $${totalPrice.toFixed(2)}`
              }
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Rooms */}
      {alternativeRooms.length > 0 && checkInDate && checkOutDate && !isDateRangeAvailable(availabilityMap, checkInDate, checkOutDate) && (
        <div className="alternative-rooms">
          <h2>Alternative Available Rooms</h2>
          <div className="alt-rooms-grid">
            {alternativeRooms.filter(r => r.is_available).map(altRoom => (
              <div key={altRoom.id} className="alt-room-card">
                <h3>{altRoom.name}</h3>
                <p className="alt-room-type">{altRoom.room_type} • Max {altRoom.max_occupancy} guests</p>
                <p className="alt-room-price">${altRoom.price}/night</p>
                <button
                  onClick={() => navigate(`/property/${propertyId}/room/${altRoom.id}?startDate=${format(checkInDate, 'yyyy-MM-dd')}&endDate=${format(checkOutDate, 'yyyy-MM-dd')}`)}
                  className="alt-room-btn"
                >
                  View Room
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;