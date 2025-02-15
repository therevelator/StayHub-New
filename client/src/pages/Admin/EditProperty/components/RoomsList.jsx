import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import RoomForm from '../../../../components/Room/RoomForm';
import RoomCalendar from '../../../../components/Room/RoomCalendar';
import propertyService from '../../../../services/propertyService';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const RoomsList = ({ propertyId, rooms, onRoomSubmit, onRoomDelete, disabled }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsDialogOpen(true);
  };

  const handleEditRoom = async (room) => {
    try {
      console.log('[RoomsList] Editing room:', room);
      
      // If we have a propertyId, fetch fresh data from server
      if (propertyId) {
        const roomData = await propertyService.getRoom(propertyId, room.id);
        console.log('[RoomsList] Fetched room data:', roomData);
        setEditingRoom(roomData);
      } else {
        // For new properties, use the local room data
        console.log('[RoomsList] Using local room data for new property');
        setEditingRoom(room);
      }
      
      setIsDialogOpen(true);
    } catch (error) {
      console.error('[RoomsList] Error preparing room for edit:', error);
      toast.error('Failed to load room data');
    }
  };

  const handleOpenCalendar = (room) => {
    if (!propertyId) {
      toast.error('Please save the property first to manage room availability');
      return;
    }
    setSelectedRoom(room);
    setIsCalendarOpen(true);
  };

  const handleCloseCalendar = () => {
    setSelectedRoom(null);
    setIsCalendarOpen(false);
  };

  const handleSubmit = async (roomData) => {
    try {
      console.log('[RoomsList] Submitting room data:', roomData);
      const dataToSubmit = {
        ...roomData,
        // Ensure the ID is included if editing
        ...(editingRoom && { id: editingRoom.id })
      };
      console.log('[RoomsList] Formatted data for submission:', dataToSubmit);
      
      await onRoomSubmit(dataToSubmit);
      
      // Only close the dialog and reset state after successful submission
      setIsDialogOpen(false);
      setEditingRoom(null);
    } catch (error) {
      console.error('[RoomsList] Error submitting room:', error);
      // Keep the dialog open on error
      throw error; // Re-throw to be handled by the parent
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingRoom(null);
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
              <li key={room.id || `temp-${rooms.indexOf(room)}`}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {room.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {room.room_type} • Max Occupancy: {room.max_occupancy}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Price per Night: ${room.price_per_night}
                    </p>
                    {room.beds && (
                      <p className="mt-1 text-sm text-gray-500">
                        Beds: {(() => {
                          try {
                            const beds = Array.isArray(room.beds) 
                              ? room.beds 
                              : typeof room.beds === 'string' 
                                ? JSON.parse(room.beds) 
                                : [];
                            return beds.map(bed => `${bed.count} ${bed.type}`).join(', ') || 'No bed information';
                          } catch (error) {
                            console.error('Error parsing beds:', error);
                            return 'No bed information';
                          }
                        })()} 
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => handleOpenCalendar(room)}
                      disabled={disabled}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span className="sr-only">Room calendar</span>
                    </button>
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
                      onClick={() => onRoomDelete(room.id)}
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
          onClose={handleClose}
        />
      )}

      {isCalendarOpen && selectedRoom && (
        <RoomCalendar
          propertyId={propertyId}
          room={selectedRoom}
          onClose={handleCloseCalendar}
        />
      )}
    </div>
  );
};

RoomsList.propTypes = {
  propertyId: PropTypes.string, // Make propertyId optional for new properties
  rooms: PropTypes.array,
  onRoomSubmit: PropTypes.func.isRequired,
  onRoomDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default RoomsList; 