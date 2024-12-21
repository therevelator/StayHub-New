import { Grid, Container, Typography, Box, CircularProgress } from ' ';
import PropertyCard from './PropertyCard';
import { styled } from ' /styles';
import { useNavigate } from 'react-router-dom';

const NoResults = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
}));

const PropertyGrid = ({ properties, loading, error, searchLocation }) => {
  const navigate = useNavigate();

  const handlePropertyClick = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <NoResults>
        <Typography variant="h6">{error}</Typography>
      </NoResults>
    );
  }

  if (!properties?.length) {
    return (
      <NoResults>
        <Typography variant="h6">
          No properties found {searchLocation ? `in ${searchLocation}` : ''}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Try expanding your search radius or try a different location
        </Typography>
      </NoResults>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {searchLocation && (
        <Typography variant="h5" gutterBottom>
          Properties in {searchLocation}
        </Typography>
      )}
      <Grid container spacing={3}>
        {properties.map((property) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={property.id}>
            <PropertyCard 
              property={property} 
              onClick={() => handlePropertyClick(property.id)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PropertyGrid;
