import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  TextField,
  CircularProgress,
  MenuItem,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const SearchBar = ({ 
  onSearchResults, 
  initialLocation,
  onPropertyTypeChange,
  selectedPropertyType 
}) => {
  const [location, setLocation] = useState(initialLocation || '');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(25);

  // Update location when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleSearch = async () => {
    try {
      setLoading(true);

      // First get coordinates for the location
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.length) {
        throw new Error('Location not found');
      }

      const { lat, lon } = geocodeData[0];

      // Then search properties with these coordinates
      const searchParams = {
        location,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius: radius,
        guests: parseInt(guests) || 1,
        checkIn: checkIn ? dayjs(checkIn).format('YYYY-MM-DD') : null,
        checkOut: checkOut ? dayjs(checkOut).format('YYYY-MM-DD') : null,
        propertyType: selectedPropertyType || null
      };

      console.log('Searching with params:', searchParams);

      const response = await api.get('/properties/search', { 
        params: searchParams 
      });

      console.log('Search response:', response.data);

      if (response.data.status === 'success') {
        onSearchResults({
          results: response.data.data,
          searchParams: {
            location,
            ...searchParams
          }
        });
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(error.message || 'Error performing search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: '', label: 'All Types' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'resort', label: 'Resort' },
    { value: 'guesthouse', label: 'Guesthouse' },
    { value: 'hostel', label: 'Hostel' }
  ];

  const radiusOptions = [
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
    { value: 75, label: '75 km' }
  ];

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <InputBase
            fullWidth
            placeholder="Where are you going?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            sx={{ ml: 1 }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <DatePicker
            label="Check-in"
            value={checkIn}
            onChange={setCheckIn}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <DatePicker
            label="Check-out"
            value={checkOut}
            onChange={setCheckOut}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            type="number"
            label="Guests"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            size="small"
            InputProps={{ inputProps: { min: 1 } }}
            sx={{ width: 100 }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            select
            fullWidth
            label="Property Type"
            value={selectedPropertyType}
            onChange={(e) => {
              console.log('Selected property type:', e.target.value);
              onPropertyTypeChange(e.target.value);
            }}
          >
            {propertyTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            select
            fullWidth
            label="Radius"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          >
            {radiusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <IconButton 
            onClick={handleSearch} 
            disabled={loading || !location}
            sx={{ ml: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : <SearchIcon />}
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SearchBar;
