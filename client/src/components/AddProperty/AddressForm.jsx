import { useState } from 'react';
import { TextField, Grid, Alert, Fade } from ' ';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import LoadingButton from '@mui/lab/LoadingButton';

const AddressForm = ({ formData, setFormData, errors }) => {
  const [addressFound, setAddressFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleAddressSearch = async () => {
    const address = `${formData.location.street}, ${formData.location.city}, ${formData.location.country}`;
    
    if (!address.trim()) {
      setSearchError('Please enter an address to search');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setAddressFound(false);

    try {
      const geocodingUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}`;
      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry;
        
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              lat,
              lng
            }
          }
        }));
        
        setAddressFound(true);
      } else {
        setSearchError('Address not found. Please check the address and try again.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchError('Failed to search address. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Street Address"
          name="street"
          value={formData.location.street}
          onChange={(e) => 
            setFormData(prev => ({
              ...prev,
              location: { ...prev.location, street: e.target.value }
            }))
          }
          error={Boolean(errors?.location?.street)}
          helperText={errors?.location?.street}
          InputProps={{
            endAdornment: addressFound && (
              <CheckCircleIcon color="success" sx={{ ml: 1 }} />
            )
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          name="city"
          value={formData.location.city}
          onChange={(e) => 
            setFormData(prev => ({
              ...prev,
              location: { ...prev.location, city: e.target.value }
            }))
          }
          error={Boolean(errors?.location?.city)}
          helperText={errors?.location?.city}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="State/Province"
          name="state"
          value={formData.location.state}
          onChange={(e) => 
            setFormData(prev => ({
              ...prev,
              location: { ...prev.location, state: e.target.value }
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Country"
          name="country"
          value={formData.location.country}
          onChange={(e) => 
            setFormData(prev => ({
              ...prev,
              location: { ...prev.location, country: e.target.value }
            }))
          }
          error={Boolean(errors?.location?.country)}
          helperText={errors?.location?.country}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Postal Code"
          name="postalCode"
          value={formData.location.postalCode}
          onChange={(e) => 
            setFormData(prev => ({
              ...prev,
              location: { ...prev.location, postalCode: e.target.value }
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <LoadingButton
          variant="contained"
          onClick={handleAddressSearch}
          loading={searching}
          loadingPosition="start"
          startIcon={addressFound ? <CheckCircleIcon /> : <SearchIcon />}
          color={addressFound ? "success" : "primary"}
          fullWidth
        >
          {addressFound ? 'Address Found' : 'Verify Address'}
        </LoadingButton>
      </Grid>

      {searchError && (
        <Grid item xs={12}>
          <Fade in={Boolean(searchError)}>
            <Alert severity="error" onClose={() => setSearchError(null)}>
              {searchError}
            </Alert>
          </Fade>
        </Grid>
      )}

      {addressFound && (
        <Grid item xs={12}>
          <Fade in={addressFound}>
            <Alert 
              icon={<LocationOnIcon />}
              severity="success"
              onClose={() => setAddressFound(false)}
            >
              Address found! Coordinates: {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}
            </Alert>
          </Fade>
        </Grid>
      )}
    </Grid>
  );
};

export default AddressForm; 