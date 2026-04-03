import { z } from 'zod';

export const propertySchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().optional(),
    price_per_night: z.number().positive("Price must be positive"),
    location: z.string().min(2, "Location is required"),
    address: z.string().optional(),
    type: z.enum(['villa', 'apartment', 'hotel', 'room']),
    max_guests: z.number().int().min(1),
    bedrooms: z.number().int().min(0),
    beds: z.number().int().min(1),
    bathrooms: z.number().int().min(1),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).min(1, "At least one image is required"),
    host_id: z.string().uuid("Invalid host ID"),
    cleaning_fee: z.number().nonnegative("Cleaning fee must be positive").optional(),
});

export const bookingSchema = z.object({
    item_id: z.string().uuid("Invalid item ID"),
    user_id: z.string().uuid("Invalid user ID"),
    check_in: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid check-in date"),
    check_out: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid check-out date"),
    total_price: z.number().positive("Total price must be positive"),
    guests: z.number().int().min(1),
    message: z.string().max(500).optional(),
    payment_method: z.enum(['card', 'cash', 'bank', 'crypto', 'swift']).default('card'),
    item_type: z.enum(['property', 'service', 'product'])
});

export const serviceSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    price: z.number().positive(),
    type: z.enum(['car', 'bike', 'tour', 'transfer', 'visa', 'esim', 'wellness', 'creative']),
    provider_id: z.string().uuid(),
    features: z.any().default({}),
    images: z.array(z.string()).default([])
});
