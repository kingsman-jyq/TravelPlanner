import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header'; // Import the Header component

export default function MyTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.get('/api/trips');
        setTrips(response.data);
      } catch (err) {
        setError('Failed to fetch your trips. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const handleDelete = async (id) => {
    // Optional: Add a confirmation dialog here
    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return;
    }

    try {
      await api.delete(`/api/trips/${id}`);
      setTrips(trips.filter((trip) => trip.id !== id));
    } catch (err) {
      setError('Failed to delete trip. Please try again.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading trips...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Header /> {/* Add the Header component */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            My Trips
          </Typography>
          <Button component={Link} to="/" variant="contained">
            + New Trip
          </Button>
        </Box>
        {trips.length === 0 ? (
          <Typography>You haven't planned any trips yet.</Typography>
        ) : (
          <Grid container spacing={3}>
            {trips.map((trip) => (
              <Grid item key={trip.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      {trip.destination}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      Budget: ${trip.budget}
                    </Typography>
                    <Typography variant="body2">
                      Preferences: {trip.preferences}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={Link} to="/" state={{ tripId: trip.id }}>View Details</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(trip.id)}>Delete</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
