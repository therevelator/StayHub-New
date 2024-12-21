import { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  IconButton,
  Divider,
  TextField,
  MenuItem,
} from ' ';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PersonIcon from '@mui/icons-material/Person';

const PeopleSelector = ({ value, onChange }) => {
  return (
    <TextField
      select
      label="Guests"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      fullWidth
      size="small"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
        <MenuItem key={num} value={num}>
          {num} {num === 1 ? 'Guest' : 'Guests'}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default PeopleSelector;
