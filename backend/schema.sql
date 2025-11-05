-- schema.sql
-- This script defines the database schema for the Travel Planner application.
-- To use it, navigate to the "SQL Editor" in your Supabase project dashboard,
-- paste the content of this file, and click "Run".

-- Table for storing user's travel plans.
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    preferences TEXT,
    estimated_cost JSONB, -- New column for estimated total cost
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for storing individual items within a travel plan (e.g., attractions, restaurants).
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    day INT,
    start_time TIME,
    end_time TIME,
    activity_type TEXT, -- e.g., 'sightseeing', 'dining', 'transport'
    description TEXT NOT NULL,
    location_name TEXT,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    estimated_cost NUMERIC, -- New column for estimated cost of this item
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for storing travel expenses.
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    description TEXT,
    expense_date TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for 'trips' table
-- Users can see their own trips.
CREATE POLICY "Allow users to view their own trips" ON trips
FOR SELECT USING (auth.uid() = user_id);

-- Users can create trips for themselves.
CREATE POLICY "Allow users to create their own trips" ON trips
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips.
CREATE POLICY "Allow users to update their own trips" ON trips
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trips.
CREATE POLICY "Allow users to delete their own trips" ON trips
FOR DELETE USING (auth.uid() = user_id);

-- Policies for 'itinerary_items' table
-- Users can see itinerary items for trips they own.
CREATE POLICY "Allow users to view itinerary items for their trips" ON itinerary_items
FOR SELECT USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = itinerary_items.trip_id AND trips.user_id = auth.uid()));

-- Users can insert itinerary items for trips they own.
CREATE POLICY "Allow users to insert itinerary items for their trips" ON itinerary_items
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM trips WHERE trips.id = itinerary_items.trip_id AND trips.user_id = auth.uid()));

-- Users can update itinerary items for trips they own.
CREATE POLICY "Allow users to update itinerary items for their trips" ON itinerary_items
FOR UPDATE USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = itinerary_items.trip_id AND trips.user_id = auth.uid()));

-- Users can delete itinerary items for trips they own.
CREATE POLICY "Allow users to delete itinerary items for their trips" ON itinerary_items
FOR DELETE USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = itinerary_items.trip_id AND trips.user_id = auth.uid()));

-- Policies for 'expenses' table
-- Users can see their own expenses.
CREATE POLICY "Allow users to view their own expenses" ON expenses
FOR SELECT USING (auth.uid() = user_id);

-- Users can create expenses for themselves.
CREATE POLICY "Allow users to create their own expenses" ON expenses
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses.
CREATE POLICY "Allow users to update their own expenses" ON expenses
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own expenses.
CREATE POLICY "Allow users to delete their own expenses" ON expenses
FOR DELETE USING (auth.uid() = user_id);
