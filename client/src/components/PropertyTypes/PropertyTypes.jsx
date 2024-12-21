import { Box, Container, Grid, Card, CardMedia, CardContent, Typography } from ' ';

const propertyTypes = [
  {
    type: 'Hotels',
    image: '/images/hotel.jpg',
    description: 'Hotels description'
  },
  {
    type: 'Apartments',
    image: '/images/apartment.jpg',
    description: 'Apartments description'
  },
  {
    type: 'Resorts',
    image: '/images/resort.jpg',
    description: 'Resorts description'
  },
  {
    type: 'Villas',
    image: '/images/villa.jpg',
    description: 'Villas description'
  }
];

const PropertyTypes = () => {
  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Browse by property type
      </Typography>
      
      <Grid container spacing={3}>
        {propertyTypes.map((property) => (
          <Grid item xs={12} sm={6} md={3} key={property.type}>
            <Card sx={{ height: '100%', cursor: 'pointer' }}>
              <CardMedia
                component="img"
                height="200"
                image={property.image}
                alt={property.type}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {property.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {property.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PropertyTypes;
