import React, { useState, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/20/solid';

console.log('Loading BRAND NEW Room Form Component - Version 3.0 - NEW LOCATION');

const NewRoomForm = ({ room, onUpdate, onDelete }) => {
  console.log('NewRoomForm rendering with props:', { room, hasUpdate: !!onUpdate, hasDelete: !!onDelete });
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Standard Room',
    description: '',
  });

  useEffect(() => {
    console.log('NewRoomForm useEffect triggered with room:', room);
    if (room) {
      setFormData({
        ...room,
        name: room.name || '',
        type: room.type || 'Standard Room',
        description: room.description || '',
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('NewRoomForm handleChange:', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('NewRoomForm Submit Handler - Version 3.0');
    console.log('Submitting form data:', formData);
    onUpdate(formData);
  };

  return (
    <div style={{ 
      border: '4px dashed #00ff00',
      padding: '20px',
      margin: '20px',
      borderRadius: '8px',
      backgroundColor: '#f0fff0'
    }}>
      <div style={{ 
        backgroundColor: '#00ff00',
        color: 'black',
        padding: '10px',
        marginBottom: '20px',
        borderRadius: '4px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        🏨 BRAND NEW ROOM FORM - VERSION 3.0 - NEW LOCATION 🏨
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Room Name:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{ 
              width: '100%',
              padding: '8px',
              border: '2px solid #00ff00',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Room Type:
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            style={{ 
              width: '100%',
              padding: '8px',
              border: '2px solid #00ff00',
              borderRadius: '4px'
            }}
          >
            <option value="Standard Room">Standard Room</option>
            <option value="Deluxe Room">Deluxe Room</option>
            <option value="Suite">Suite</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Description:
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{ 
              width: '100%',
              padding: '8px',
              border: '2px solid #00ff00',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button
            type="submit"
            style={{ 
              flex: '1',
              padding: '12px',
              backgroundColor: '#00ff00',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {room ? '💾 Update Room' : '➕ Add New Room'}
          </button>
          
          {room && (
            <button
              type="button"
              onClick={onDelete}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#ff0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <TrashIcon style={{ width: '20px', height: '20px' }} />
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewRoomForm;
