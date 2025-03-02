import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import api from '../../services/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/owner/bookings');
      if (response.data.status === 'success') {
        setBookings(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await api.put(`/owner/bookings/${bookingId}/status`, {
        status: newStatus
      });
      
      if (response.data.status === 'success') {
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        ));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const filteredBookings = bookings.filter(booking => 
    filter === 'all' ? true : booking.status === filter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Property Bookings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All Bookings</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
      </Box>

      <Grid container spacing={3}>
        {filteredBookings.map((booking) => (
          <Grid item xs={12} key={booking.id}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="textSecondary">
                      Guest
                    </Typography>
                    <Typography variant="body1">
                      {booking.guest_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="textSecondary">
                      Dates
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(booking.check_in), 'PP')} - {format(new Date(booking.check_out), 'PP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            sx={{ mr: 1 }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {filteredBookings.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="textSecondary" align="center">
              No bookings found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Bookings;
