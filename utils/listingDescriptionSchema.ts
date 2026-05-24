import { z } from 'zod';

export const listingDescriptionsSchema = z.object({
    en: z.string().optional(),
    tr: z.string().optional(),
    ru: z.string().optional(),
    ar: z.string().optional(),
});

export type ValidatedDescriptions = z.infer<typeof listingDescriptionsSchema>;
