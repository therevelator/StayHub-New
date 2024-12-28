'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BookingModal from '../../../../../client/src/components/BookingModal/BookingModal';
import api from '../../../../../client/src/services/api';

const RoomPage = () => {
  const { propertyId, roomId } = useParams();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await api.get(`/properties/rooms/${roomId}/availability`);
        setAvailableDates(response.data.availableDates);
      } catch (error) {
        console.error('Error fetching available dates:', error);
        setAvailableDates([]);
      }
    };

    fetchAvailableDates();
  }, [roomId]);

  const handleBookClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookingModalOpen(true);
  };

  return (
    <div>
      {/* ... existing room details ... */}
      
      <form onSubmit={(e) => e.preventDefault()}>
        <button
          type="button"
          onClick={handleBookClick}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors mt-4"
        >
          Book this Room
        </button>
      </form>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        roomId={roomId}
        availableDates={availableDates}
      />
    </div>
  );
};

export default RoomPage; 