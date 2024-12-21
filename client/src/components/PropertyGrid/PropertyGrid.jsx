import React from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, Box } from ' ';
import { useNavigate } from 'react-router-dom';

const PropertyGrid = ({ properties }) => {
  const navigate = useNavigate();

  return (
    <Grid container spacing={3}>
      {properties.map((property) => (
        <Grid item xs={12} sm={6} md={4} key={property.id}>
          <Card 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate(`/properties/${property.id}`)}
          >
            <CardMedia
              component="img"
              height="200"
              image={property.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
              alt={property.name}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {property.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {property.city}, {property.country}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                  ${property.price} / night
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {property.property_type}
                </Typography>
              </Box>
              {property.distance && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {property.distance}km away
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PropertyGrid; 