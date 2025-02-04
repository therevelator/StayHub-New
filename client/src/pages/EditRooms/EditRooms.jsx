import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RoomForm from "../../components/Room/RoomForm";
import RoomPriceManager from "../../components/RoomPriceManager/RoomPriceManager";
import api from "../../services/api";

const EditRooms = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get(`/properties/${id}/rooms`);
        console.log('Fetched rooms:', response.data);
        setRooms(response.data);
      } catch (err) {
        setError('Failed to fetch rooms');
        console.error('Error fetching rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [id]);

  const handleAddRoom = async (roomData) => {
    try {
      console.log('Adding room with data:', roomData);
      const response = await api.post(`/properties/${id}/rooms`, roomData);
      console.log('Add room response:', response.data);
      setRooms([...rooms, response.data.room]); // Access the room from response.data.room
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add room');
      console.error('Error adding room:', err);
    }
  };

  const handleUpdateRoom = async (roomId, roomData) => {
    try {
      console.log('Updating room', roomId, 'with data:', roomData);
      const response = await api.put(`/properties/${id}/rooms/${roomId}`, roomData);
      console.log('Update room response:', response.data);
      setRooms(rooms.map(room => room.id === roomId ? response.data.room : room)); // Access the room from response.data.room
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room');
      console.error('Error updating room:', err);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`/properties/${id}/rooms/${roomId}`);
      setRooms(rooms.filter(room => room.id !== roomId));
    } catch (err) {
      setError('Failed to delete room');
      console.error('Error deleting room:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Rooms</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Room</h2>
            <RoomForm 
              onSubmit={(data) => {
                console.log('Add room form submitted with data:', data);
                return handleAddRoom(data);
              }} 
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Existing Rooms</h2>
            {rooms.map(room => (
              <div key={room.id} className="mb-4 p-4 border rounded">
                <h3 className="font-semibold">{room.name}</h3>
                <p>Type: {room.room_type}</p>
                <p>Status: {room.status}</p>
                <p>Default Price: ${room.price_per_night}</p>
                
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Room Settings</h4>
                  <RoomForm
                    initialData={room}
                    onSubmit={(data) => {
                      console.log('Update room form submitted with data:', data);
                      return handleUpdateRoom(room.id, data);
                    }}
                  />
                </div>

                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Price Management</h4>
                  <RoomPriceManager
                    propertyId={id}
                    roomId={room.id}
                    defaultPrice={room.price_per_night}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRooms;
