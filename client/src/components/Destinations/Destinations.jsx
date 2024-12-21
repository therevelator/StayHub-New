import { Container, Grid, Card, CardMedia, CardContent, Typography } from ' ';

const destinations = [
  {
    name: 'Bucharest',
    image: '/images/bucharest.jpg',
    description: 'Capital city with vibrant nightlife'
  },
  {
    name: 'Brasov',
    image: '/images/brasov.jpg',
    description: 'Medieval charm in Transylvania'
  },
  {
    name: 'Mamaia',
    image: '/images/mamaia.jpg',
    description: 'Popular beach resort'
  },
  {
    name: 'Cluj-Napoca',
    image: '/images/cluj.jpg',
    description: 'Cultural hub of Transylvania'
  },
  {
    name: 'Sibiu',
    image: '/images/sibiu.jpg',
    description: 'Historic city with German heritage'
  }
];

const Destinations = () => {
  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Trending destinations
      </Typography>
      
      <Grid container spacing={3}>
        {destinations.map((destination) => (
          <Grid item xs={12} sm={6} md={4} key={destination.name}>
            <Card sx={{ height: '100%', cursor: 'pointer' }}>
              <CardMedia
                component="img"
                height="250"
                image={destination.image}
                alt={destination.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {destination.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {destination.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Destinations;
