export interface ItineraryItem {
  time: string;
  title: string;
  description: string;
  location?: string;
  link?: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  items: ItineraryItem[];
}

export interface TripParams {
  duration: number;
  companion: string;
  interests: string[];
  pace: string;
  budget: string;
}

export interface SavedItinerary {
  id: string;
  user_id: string;
  title: string;
  params: TripParams;
  itinerary: ItineraryDay[];
  created_at: string;
}
