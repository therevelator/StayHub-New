'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { heroImage, roomImage } from '../../services/countryImages';
import {
  MapPin,
  Star,
  Users,
  BedDouble,
  Bath,
  Wifi,
  Car,
  Coffee,
  Wind,
  Tv,
  CheckCircle,
  Clock,
  Shield,
  Home,
  Image as ImageIcon,
  UtensilsCrossed,
  Dumbbell,
  Waves,
  ParkingCircle
} from 'lucide-react';
import './PropertyDetails.css';

// Sensible defaults so the amenities section never looks empty.
const DEFAULT_AMENITIES = ['Free WiFi', 'Air Conditioning', 'Parking', 'Breakfast', 'Flat-screen TV', '24/7 Reception'];

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [roomAvailability, setRoomAvailability] = useState({});

  const fetchRoomAvailability = async (roomId, startDate, endDate) => {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, {
        params: { startDate, endDate }
      });
      return response.data.data.requested_room;
    } catch (error) {
      console.error(`Error fetching availability for room ${roomId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (property?.rooms && startDate && endDate) {
      const fetchAllRoomsAvailability = async () => {
        const availabilityPromises = property.rooms.map(room =>
          fetchRoomAvailability(room.id, startDate, endDate)
        );

        const availabilityResults = await Promise.all(availabilityPromises);
        const availabilityMap = {};

        availabilityResults.forEach((result, index) => {
          if (result) {
            availabilityMap[property.rooms[index].id] = result;
          }
        });

        setRoomAvailability(availabilityMap);
      };

      fetchAllRoomsAvailability();
    }
  }, [property, searchParams]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${propertyId}`);
        let propertyData = response.data.data;

        if (propertyData) {
          if (propertyData.rooms && Array.isArray(propertyData.rooms)) {
            propertyData.rooms = propertyData.rooms.map(room => {
              const { base_price, ...roomWithoutBasePrice } = room;
              return roomWithoutBasePrice;
            });
          }
        }

        if (propertyData && propertyData.rooms) {
          try {
            const roomPromises = propertyData.rooms.map(async (room) => {
              try {
                const roomResponse = await api.get(`/properties/${propertyId}/rooms/${room.id}`);
                const roomData = roomResponse.data.data;
                if (roomData) {
                  const { base_price, ...roomWithoutBasePrice } = roomData;
                  return roomWithoutBasePrice;
                }
                return roomResponse.data.data;
              } catch (roomErr) {
                console.error(`Error fetching room ${room.id}:`, roomErr);
                return {
                  ...room,
                  beds: [],
                  amenities: [],
                  images: []
                };
              }
            });

            propertyData.rooms = await Promise.all(roomPromises);
          } catch (e) {
            console.error('Error fetching room details:', e);
          }
        }

        setProperty(propertyData);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.message || 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (!property) return null;

  const getRoomPrice = (room) => {
    return room.price_per_night ? parseFloat(room.price_per_night) : 0;
  };

  const handleBookRoom = (roomId) => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const queryParams = new URLSearchParams();

    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    navigate(`/property/${propertyId}/room/${roomId}?${queryParams.toString()}`);
  };

  const getFullAddress = () => {
    if (!property) return '';
    const parts = [
      property.street || property.location?.street,
      property.city || property.location?.city,
      property.country || property.location?.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getAmenityIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('wifi') || n.includes('internet')) return <Wifi className="w-5 h-5" />;
    if (n.includes('park')) return <ParkingCircle className="w-5 h-5" />;
    if (n.includes('coffee') || n.includes('breakfast')) return <Coffee className="w-5 h-5" />;
    if (n.includes('ac') || n.includes('air') || n.includes('condition')) return <Wind className="w-5 h-5" />;
    if (n.includes('tv') || n.includes('television')) return <Tv className="w-5 h-5" />;
    if (n.includes('kitchen') || n.includes('restaurant') || n.includes('dining')) return <UtensilsCrossed className="w-5 h-5" />;
    if (n.includes('gym') || n.includes('fitness')) return <Dumbbell className="w-5 h-5" />;
    if (n.includes('pool') || n.includes('spa') || n.includes('sea') || n.includes('beach')) return <Waves className="w-5 h-5" />;
    if (n.includes('bath')) return <Bath className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  // Amenity label from a string or object; falls back to a sensible default set.
  const amenityLabel = (a) =>
    (typeof a === 'string' ? a : a?.name || a?.amenity || a?.label || '').trim();

  const amenityList = (() => {
    const raw = Array.isArray(property.amenities) ? property.amenities.map(amenityLabel).filter(Boolean) : [];
    return (raw.length ? raw : DEFAULT_AMENITIES).slice(0, 8);
  })();

  const heroSrc = heroImage(property, 1600, 700);
  const reviewCount = property.total_reviews ?? property.review_count ?? 0;

  return (
    <div className="property-page-container">
      {/* Hero Section */}
      <div className="property-hero">
        <img
          src={heroSrc}
          alt={property.name}
          className="hero-background"
          onError={(e) => { e.currentTarget.src = heroImage(property, 1600, 700, { fallbackOnly: true }); }}
        />
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-rating">
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              <span>{Number(property.star_rating || 4.5).toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
            </div>
            <h1 className="hero-title">{property.name}</h1>
            <div className="hero-location">
              <MapPin className="w-5 h-5" />
              {getFullAddress()}
            </div>
          </div>
          <button className="view-photos-btn">
            <ImageIcon className="w-5 h-5" />
            View Photos
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="property-content">
        {/* Left Column */}
        <div className="content-left">
          {/* About Section */}
          <div className="section-card">
            <h2 className="section-title">
              <Home className="w-6 h-6" />
              About this property
            </h2>
            <p className="property-description">
              {property.description || 'Experience luxury and comfort at its finest. This property offers stunning views, modern amenities, and exceptional service to make your stay unforgettable.'}
            </p>
          </div>

          {/* Amenities Section */}
          <div className="section-card">
            <h2 className="section-title">
              <Star className="w-6 h-6" />
              Popular Amenities
            </h2>
            <div className="amenities-grid">
              {amenityList.map((amenity, idx) => (
                <div key={idx} className="amenity-item">
                  {getAmenityIcon(amenity)}
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="content-right">
          {/* Quick Info Card */}
          <div className="quick-info-card">
            <h3 className="quick-info-title">
              <Clock className="w-5 h-5" />
              Quick Info
            </h3>
            <div className="info-row">
              <span className="info-label">Check-in</span>
              <span className="info-value">3:00 PM</span>
            </div>
            <div className="info-row">
              <span className="info-label">Check-out</span>
              <span className="info-value">11:00 AM</span>
            </div>
            <div className="info-row">
              <span className="info-label">Cancellation</span>
              <span className="info-value">Free up to 48h</span>
            </div>
          </div>

          {/* Highlights Card */}
          <div className="highlights-card">
            <div className="highlight-item">
              <div className="highlight-icon">
                <Shield className="w-6 h-6" />
              </div>
              <div className="highlight-content">
                <h4>Secure Booking</h4>
                <p>Your payment information is safe with us</p>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <Star className="w-6 h-6" />
              </div>
              <div className="highlight-content">
                <h4>Top Rated</h4>
                <p>Among the highest rated in this area</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Section */}
      <div className="rooms-section">
        <div className="rooms-header">
          <h2>Available Rooms</h2>
          <p>Choose the perfect room for your stay</p>
        </div>

        <div className="rooms-grid">
          {property.rooms?.map((room) => {
            const price = getRoomPrice(room);

            return (
              <div key={room.id} className="room-card">
                <div className="room-image-wrapper">
                  <img
                    src={roomImage(room, 800, 600)}
                    alt={room.name}
                    className="room-image"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = roomImage(room, 800, 600, { fallbackOnly: true }); }}
                  />
                  <span className="room-type-badge">{room.room_type}</span>
                </div>

                <div className="room-card-content">
                  <h3 className="room-name">{room.name}</h3>
                  <div className="room-occupancy">
                    <Users className="w-4 h-4" />
                    Max {room.max_occupancy} guests
                  </div>

                  <div className="room-features-row">
                    <div className="room-feature">
                      <BedDouble className="w-4 h-4" />
                      <span>Beds</span>
                    </div>
                    <div className="room-feature">
                      <Bath className="w-4 h-4" />
                      <span>Bath</span>
                    </div>
                    <div className="room-feature">
                      <Wifi className="w-4 h-4" />
                      <span>Wifi</span>
                    </div>
                  </div>

                  <div className="room-card-footer">
                    <div className="room-price-tag">
                      <span className="price-val">${price.toFixed(0)}</span>
                      <span className="price-label">per night</span>
                    </div>
                    <button
                      onClick={() => handleBookRoom(room.id)}
                      className="view-room-btn"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
