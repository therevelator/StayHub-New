import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox
} from ' ';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useAuth } from '../../context/AuthContext';

const RulesAndPolicies = ({ formData, onChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleTimeChange = (field, value) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TimePicker
          label="Check-in Time"
          value={formData.checkInTime}
          onChange={(newValue) => handleTimeChange('checkInTime', newValue)}
        />
        <TimePicker
          label="Check-out Time"
          value={formData.checkOutTime}
          onChange={(newValue) => handleTimeChange('checkOutTime', newValue)}
        />
      </Box>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Cancellation Policy</InputLabel>
        <Select
          value={formData.cancellationPolicy}
          label="Cancellation Policy"
          onChange={(e) => onChange({ ...formData, cancellationPolicy: e.target.value })}
        >
          <MenuItem value="flexible">Flexible</MenuItem>
          <MenuItem value="moderate">Moderate</MenuItem>
          <MenuItem value="strict">Strict</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Pet Policy</InputLabel>
        <Select
          value={formData.petPolicy}
          label="Pet Policy"
          onChange={(e) => onChange({ ...formData, petPolicy: e.target.value })}
        >
          <MenuItem value="pets">Pets Allowed</MenuItem>
          <MenuItem value="no_pets">No Pets</MenuItem>
          <MenuItem value="case_by_case">Case by Case</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Event Policy</InputLabel>
        <Select
          value={formData.eventPolicy}
          label="Event Policy"
          onChange={(e) => onChange({ ...formData, eventPolicy: e.target.value })}
        >
          <MenuItem value="events">Events Allowed</MenuItem>
          <MenuItem value="no_events">No Events</MenuItem>
          <MenuItem value="case_by_case">Case by Case</MenuItem>
        </Select>
      </FormControl>

      {isAdmin && (
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isActive || false}
              onChange={(e) => onChange({ ...formData, isActive: e.target.checked })}
              name="isActive"
            />
          }
          label="Property Active"
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  );
};

export default RulesAndPolicies; 