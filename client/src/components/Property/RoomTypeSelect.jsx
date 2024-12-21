import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box
} from ' ';

const ROOM_TYPES = [
  'single room',
  'double room',
  'triple room',
  'quadruple room',
  'multi room',
  'apartment',
  'penthouse',
  'studio apartment',
  'deluxe suite',
  'executive suite',
  'family room',
  'connecting rooms',
  'accessible room',
  'presidential suite',
  'other'
];

const RoomTypeSelect = ({ value, onChange }) => {
  const [customType, setCustomType] = useState('');

  const handleChange = (event) => {
    const selectedType = event.target.value;
    if (selectedType === 'other') {
      setCustomType('');
    }
    onChange(selectedType === 'other' ? customType : selectedType);
  };

  const handleCustomTypeChange = (event) => {
    const newValue = event.target.value;
    setCustomType(newValue);
    onChange(newValue);
  };

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id="room-type-label">Room Type</InputLabel>
        <Select
          labelId="room-type-label"
          id="room-type"
          value={ROOM_TYPES.includes(value) ? value : 'other'}
          label="Room Type"
          onChange={handleChange}
        >
          {ROOM_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {value === 'other' && (
        <TextField
          fullWidth
          margin="normal"
          label="Custom Room Type"
          value={customType}
          onChange={handleCustomTypeChange}
          placeholder="Enter custom room type"
        />
      )}
    </Box>
  );
};

export default RoomTypeSelect;
