import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput
} from ' ';

const AMENITIES = [
  'Wi-Fi', 'Parking', 'Pool', 'Gym', 'Restaurant', 'Bar',
  'Room Service', 'Spa', 'Beach Access', 'Business Center',
  'Conference Room', 'Kids Club', 'Laundry', '24/7 Front Desk'
];

const PROPERTY_TYPES = [
  'Hotel', 'Resort', 'Villa', 'Apartment', 'Guesthouse',
  'Bed & Breakfast', 'Hostel', 'Cottage', 'Chalet'
];

const PropertyForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    amenities: [],
    rating: '',
    images: [],
    ...initialData
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenitiesChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      amenities: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6">Basic Information</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="name"
            label="Property Name"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Property Type</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              label="Property Type"
            >
              {PROPERTY_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            multiline
            rows={4}
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2 }}>Location</Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="address"
            label="Street Address"
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="city"
            label="City"
            value={formData.city}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="state"
            label="State/Province"
            value={formData.state}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="country"
            label="Country"
            value={formData.country}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="postalCode"
            label="Postal Code"
            value={formData.postalCode}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2 }}>Amenities</Typography>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Property Amenities</InputLabel>
            <Select
              multiple
              value={formData.amenities}
              onChange={handleAmenitiesChange}
              input={<OutlinedInput label="Property Amenities" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {AMENITIES.map((amenity) => (
                <MenuItem key={amenity} value={amenity}>
                  {amenity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            Continue to Rooms
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PropertyForm;
