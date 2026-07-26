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

  const formatBeds = (room) => {
    try {
      const beds = Array.isArray(room.beds)
        ? room.beds
        : typeof room.beds === 'string'
          ? JSON.parse(room.beds)
          : [];
      return beds.map((bed) => `${bed.count} ${bed.type}`).join(', ');
    } catch (error) {
      return '';
    }
  };

  return (
    <div>
      <div className="admin-rooms__head">
        <div>
          <h2 className="admin-rooms__title">Rooms</h2>
          <p className="admin-panel__desc" style={{ marginBottom: 0 }}>
            {rooms?.length ? `${rooms.length} room${rooms.length > 1 ? 's' : ''}` : 'Add the rooms guests can book'}
          </p>
        </div>
        <button type="button" onClick={handleAddRoom} disabled={disabled} className="af-btn af-btn--primary">
          <PlusIcon className="h-5 w-5" />
          Add Room
        </button>
      </div>

      {rooms && rooms.length > 0 ? (
        <div>
          {rooms.map((room) => {
            const beds = formatBeds(room);
            return (
              <div key={room.id || `temp-${rooms.indexOf(room)}`} className="admin-room-card">
                <div className="min-w-0">
                  <h3 className="admin-room-card__title truncate">{room.name}</h3>
                  <p className="admin-room-card__meta">
                    {room.room_type} • Max {room.max_occupancy} guests
                    {beds ? ` • ${beds}` : ''}
                  </p>
                  <p className="admin-room-card__meta">
                    <span className="admin-room-card__price">${room.price_per_night}</span> / night
                  </p>
                </div>
                <div className="admin-room-card__actions">
                  <button
                    type="button"
                    onClick={() => handleOpenCalendar(room)}
                    disabled={disabled}
                    title="Room calendar"
                    className="admin-icon-btn"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="sr-only">Room calendar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditRoom(room)}
                    disabled={disabled}
                    data-testid={`edit-room-${room.id}`}
                    aria-label={`Edit room ${room.name}`}
                    title="Edit room"
                    className="admin-icon-btn"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit {room.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRoomDelete(room.id)}
                    disabled={disabled}
                    title="Delete room"
                    className="admin-icon-btn admin-icon-btn--danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete room</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty">
          <p className="admin-empty__title">No rooms added yet</p>
          <p className="admin-empty__desc">Add rooms to your property to start accepting bookings.</p>
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