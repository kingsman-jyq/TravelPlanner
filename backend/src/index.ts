import express, { Request, Response } from 'express';
import { supabase } from './lib/supabaseClient';
import { generateTravelPlan } from './lib/qwenClient';
import { authMiddleware } from './middleware/auth';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Cookie parser middleware
app.use(cookieParser());

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// --- PUBLIC ENDPOINTS ---
app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

// --- AUTH ENDPOINTS ---

// Signup a new user
app.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ data });
});

// Signin an existing user
app.post('/auth/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  // Set httpOnly cookies for access_token and refresh_token
  if (data && data.session) {
    res.cookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in * 1000, // Convert to milliseconds
    });
    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    });
  }

  res.status(200).json({ data });
});

// Logout a user
app.post('/auth/logout', async (req: Request, res: Response) => {
  res.cookie('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
  res.cookie('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
  res.status(200).json({ message: 'Logged out successfully.' });
});

// --- PROTECTED API ENDPOINTS ---

// Generate a new travel plan
app.post('/api/plan-trip', authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  const { destination, duration, budget, travelers, preferences } = req.body;

  // Basic validation
  if (!destination || !duration || !budget || !travelers || !preferences) {
    return res.status(400).json({ error: 'Missing required travel parameters.' });
  }

  try {
    // 1. Generate plan from AI
    const aiPlan = await generateTravelPlan(req.body);

    // 2. Save the main trip to the database
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: req.user.id,
        destination: destination,
        budget: budget,
        preferences: preferences,
        // You might want to add start_date and end_date later
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // 3. Save the itinerary items
    const itineraryItemsToInsert = aiPlan.itinerary.flatMap((day: any) => 
      day.activities.map((activity: any) => ({
        trip_id: tripData.id,
        day: day.day,
        start_time: activity.start_time,
        end_time: activity.end_time,
        activity_type: activity.activity_type,
        description: activity.description,
        location_name: activity.location_name,
        address: activity.address,
      }))
    );

    const { error: itemsError } = await supabase
      .from('itinerary_items')
      .insert(itineraryItemsToInsert);

    if (itemsError) throw itemsError;

    // 4. Return the generated plan to the user
    res.status(201).json({ trip_id: tripData.id, ...aiPlan });

  } catch (error) {
    console.error('Error in plan-trip endpoint:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to create travel plan: ${message}` });
  }
});

// Get all trips for the authenticated user
app.get('/api/trips', authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching trips:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to fetch trips: ${message}` });
  }
});

// Get a single trip with its itinerary
app.get('/api/trips/:id', authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  const { id } = req.params;

  try {
    // 1. Fetch the main trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (tripError) throw tripError;
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });

    // 2. Fetch the itinerary items for the trip
    const { data: items, error: itemsError } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', id)
      .order('day', { ascending: true })
      .order('start_time', { ascending: true });

    if (itemsError) throw itemsError;

    // 3. Reconstruct the response to match the AI plan structure
    const groupedByDay = items.reduce((acc, item) => {
      const day = item.day || 1;
      if (!acc[day]) {
        acc[day] = {
          day: day,
          theme: `Day ${day} in ${trip.destination}`,
          activities: [],
        };
      }
      acc[day].activities.push({
        time: `${item.start_time} - ${item.end_time}`,
        start_time: item.start_time,
        end_time: item.end_time,
        activity_type: item.activity_type,
        description: item.description,
        location_name: item.location_name,
        address: item.address,
      });
      return acc;
    }, {});

    const reconstructedPlan = {
      trip_id: trip.id,
      trip_name: `Trip to ${trip.destination}`,
      budget_summary: `Budget: $${trip.budget}`,
      itinerary: Object.values(groupedByDay),
      estimated_cost: {
        total: trip.budget,
      },
    };

    res.status(200).json(reconstructedPlan);

  } catch (error) {
    console.error('Error fetching single trip:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to fetch trip details: ${message}` });
  }
});

// Delete a trip
app.delete('/api/trips/:id', authMiddleware, async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated.' });
  }

  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .match({ id: id, user_id: req.user.id });

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting trip:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: `Failed to delete trip: ${message}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
