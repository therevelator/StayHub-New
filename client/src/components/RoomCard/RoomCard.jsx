import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoomCard = ({ room, checkIn, checkOut }) => {
  const navigate = useNavigate();

  const handleRoomClick = () => {
    navigate(`/rooms/${room.id}`, {
      state: {
        checkIn: checkIn,
        checkOut: checkOut
      }
    });
  };

  return (
    <div 
      onClick={handleRoomClick}
      className="cursor-pointer border rounded-lg p-4 hover:shadow-lg transition-shadow"
    >
      <h3 className="text-lg font-semibold">{room.name}</h3>
      {/* ... rest of your room card content ... */}
    </div>
  );
};

export default RoomCard; 