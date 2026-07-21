import { z } from 'zod';

export const itineraryItemSchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string().optional(),
  link: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const itineraryDaySchema = z.object({
  day: z.number(),
  title: z.string(),
  items: z.array(itineraryItemSchema),
});

export const planTripResponseSchema = z.object({
  itinerary: z.array(itineraryDaySchema),
});

