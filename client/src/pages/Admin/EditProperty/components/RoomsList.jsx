import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import RoomForm from '../../../../components/Room/RoomForm';

const RoomsList = ({ propertyId, rooms, onRoomSubmit, onRoomDelete, disabled }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsDialogOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (roomData) => {
    try {
      if (editingRoom) {
        await onRoomSubmit({ ...roomData, id: editingRoom.id });
      } else {
        await onRoomSubmit(roomData);
      }
      setIsDialogOpen(false);
      setEditingRoom(null);
    } catch (error) {
      console.error('Error submitting room:', error);
    }
  };

  const handleDelete = async (roomId) => {
    try {
      await onRoomDelete(roomId);
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Rooms</h2>
        <button
          type="button"
          onClick={handleAddRoom}
          disabled={disabled}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Room
        </button>
      </div>

      {rooms && rooms.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {rooms.map((room) => (
              <li key={room.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {room.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {room.type} • Max Occupancy: {room.maxOccupancy}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Base Price: ${room.basePrice} • Tax Rate: {room.taxRate}%
                    </p>
                    {room.beds && (
                      <p className="mt-1 text-sm text-gray-500">
                        Beds: {Array.isArray(room.beds) 
                          ? room.beds.map(bed => `${bed.count} ${bed.type}`).join(', ')
                          : 'No bed information'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => handleEditRoom(room)}
                      disabled={disabled}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="sr-only">Edit room</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(room.id)}
                      disabled={disabled}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Delete room</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <p className="text-sm text-gray-500">No rooms added yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add rooms to your property to start accepting bookings
          </p>
        </div>
      )}

      {isDialogOpen && (
        <RoomForm
          room={editingRoom}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsDialogOpen(false);
            setEditingRoom(null);
          }}
          disabled={disabled}
        />
      )}
    </div>
  );
};

RoomsList.propTypes = {
  propertyId: PropTypes.string.isRequired,
  rooms: PropTypes.array,
  onRoomSubmit: PropTypes.func.isRequired,
  onRoomDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default RoomsList; 