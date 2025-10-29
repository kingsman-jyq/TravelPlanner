import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  IconButton,
  Typography,
  Button,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import ItineraryDisplay from '../components/ItineraryDisplay';
import MapComponent from '../components/MapComponent';
import Header from '../components/Header'; // Import the new Header component
import api from '../services/api'; // Import the api service

import { useLocation } from 'react-router-dom';

export default function PlannerPage() {
  const location = useLocation();
  const { isListening, transcript, startListening, hasSupport } = useSpeechRecognition();

  // Form state
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(7);
  const [budget, setBudget] = useState(1000);
  const [travelers, setTravelers] = useState('2 adults');
  const [preferences, setPreferences] = useState('culture, food');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1); // New state for selected day

  // Effect to load a saved trip if a tripId is passed in state
  useEffect(() => {
    const tripId = location.state?.tripId;
    if (tripId) {
      const fetchTripDetails = async () => {
        setLoading(true);
        setViewOnly(true);
        try {
          const response = await api.get(`/api/trips/${tripId}`);
          setItinerary(response.data);
          // Set selectedDay to 1 when a new itinerary is loaded
          if (response.data?.itinerary?.length > 0) {
            setSelectedDay(1);
          }
        } catch (err) {
          setError('Failed to load trip details. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchTripDetails();
    }
  }, [location.state?.tripId]);

  // Effect to clear itinerary and reset viewOnly when no tripId is present
  useEffect(() => {
    if (!location.state?.tripId) {
      setItinerary(null);
      setViewOnly(false);
      setSelectedDay(1); // Reset selected day
    }
  }, [location.state?.tripId]);

  const [userInput, setUserInput] = useState('');


  const handleParseInput = async (text: string) => {
    if (!text) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/parse-user-input', { text });
      const { destination, duration, budget, travelers, preferences } = response.data;
      if (destination) setDestination(destination);
      if (duration) setDuration(duration);
      if (budget) setBudget(budget);
      if (travelers) setTravelers(travelers);
      if (preferences) setPreferences(preferences);
    } catch (err) {
      setError('Failed to parse your request. Please try again or fill the form manually.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle speech recognition result
  useEffect(() => {
    if (!viewOnly && transcript) {
      setUserInput(transcript);
      handleParseInput(transcript); // Automatically parse after speech recognition
    }
  }, [transcript, viewOnly]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setItinerary(null);

    try {
      const response = await api.post('/api/plan-trip', {
        destination,
        duration,
        budget,
        travelers,
        preferences,
      });
      setItinerary(response.data);
      // Set selectedDay to 1 when a new itinerary is generated
      if (response.data?.itinerary?.length > 0) {
        setSelectedDay(1);
      }
    } catch (err) {
      setError('Failed to generate travel plan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {viewOnly ? 'Trip Details' : 'Create a New Trip'}
        </Typography>
        {!viewOnly && (
          <Box>
            <TextField
              fullWidth
              label="Tell us your travel plans with your voice or by typing..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={startListening} disabled={!hasSupport || isListening} edge="end">
                      <MicIcon color={isListening ? 'secondary' : 'action'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button onClick={() => handleParseInput(userInput)} variant="outlined" sx={{ mb: 4 }} disabled={loading}>
              Parse My Request
            </Button>

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Duration (days)" type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Budget (CNY)" type="number" value={budget} onChange={(e) => setBudget(parseInt(e.target.value, 10))} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Travelers" value={travelers} onChange={(e) => setTravelers(e.target.value)} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Preferences (e.g., nature, history, food)"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Generate Plan'}
              </Button>
            </Box>
          </Box>
        )}
        
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {itinerary && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ItineraryDisplay itinerary={itinerary} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>Map View</Typography>
                {itinerary.itinerary && itinerary.itinerary.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                    {itinerary.itinerary.map((dayItem) => (
                      <Button
                        key={dayItem.day}
                        variant={selectedDay === dayItem.day ? 'contained' : 'outlined'}
                        onClick={() => setSelectedDay(dayItem.day)}
                        size="small"
                      >
                        Day {dayItem.day}
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
              <MapComponent itinerary={itinerary} selectedDay={selectedDay} />
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
