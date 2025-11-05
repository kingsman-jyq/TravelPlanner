interface Activity {
  start_time: string;
  end_time: string;
  activity_type: string;
  description: string;
  location_name: string;
  address: string;
  estimated_cost?: number;
}

interface ItineraryDay {
  day: number;
  theme: string;
  activities: Activity[];
}

interface EstimatedCost {
  flights?: number;
  accommodation?: number;
  transportation?: number;
  activities?: number;
  food?: number;
  total: number;
}

export interface Itinerary {
  trip_id: string;
  trip_name?: string;
  budget_summary?: string;
  itinerary: ItineraryDay[];
  estimated_cost: EstimatedCost;
}