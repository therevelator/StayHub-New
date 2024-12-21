import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  TextField,
  Button,
  Chip,
  Paper
} from ' ';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Close';

const DEFAULT_ROOM_AMENITIES = [
  'TV',
  'Air Conditioning',
  'Desk',
  'Wardrobe',
  'Safe',
  'Mini Bar',
  'Coffee Machine',
  'Hair Dryer'
];

const RoomAmenities = ({ amenities = [], onChange }) => {
  const [newAmenity, setNewAmenity] = useState('');
  const [error, setError] = useState('');

  const handleToggle = (amenity) => {
    const updatedAmenities = amenities.includes(amenity)
      ? amenities.filter(a => a !== amenity)
      : [...amenities, amenity];
    onChange(updatedAmenities);
  };

  const handleAddCustomAmenity = () => {
    if (!newAmenity.trim()) return;

    if (amenities.includes(newAmenity.trim())) {
      setError('This amenity already exists');
      return;
    }

    onChange([...amenities, newAmenity.trim()]);
    setNewAmenity('');
    setError('');
  };

  const handleRemoveAmenity = (amenity) => {
    onChange(amenities.filter(a => a !== amenity));
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Room Amenities
      </Typography>

      <Box sx={{ mb: 3 }}>
        {DEFAULT_ROOM_AMENITIES.map((amenity) => (
          <FormControlLabel
            key={amenity}
            control={
              <Checkbox
                checked={amenities.includes(amenity)}
                onChange={() => handleToggle(amenity)}
              />
            }
            label={amenity}
            sx={{ width: '200px' }}
          />
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        {amenities
          .filter(amenity => !DEFAULT_ROOM_AMENITIES.includes(amenity))
          .map((amenity) => (
            <Chip
              key={amenity}
              label={amenity}
              onDelete={() => handleRemoveAmenity(amenity)}
              color="primary"
              variant="outlined"
              sx={{ m: 0.5 }}
            />
          ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Add custom room amenity"
          value={newAmenity}
          onChange={(e) => {
            setNewAmenity(e.target.value);
            setError('');
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomAmenity();
            }
          }}
          error={Boolean(error)}
          helperText={error}
        />
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={handleAddCustomAmenity}
          disabled={!newAmenity.trim()}
        >
          Add
        </Button>
      </Box>
    </Paper>
  );
};

export default RoomAmenities; 