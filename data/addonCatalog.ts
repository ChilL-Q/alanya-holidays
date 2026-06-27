import { Zap, BadgeCheck, CalendarRange, Newspaper, Languages, LucideIcon } from 'lucide-react';
import { AddonType } from '../types/models';

export interface AddonCatalogEntry {
    type: AddonType;
    name: string;
    description: string;
    priceLabel: string;
    billing: 'one_time' | 'recurring' | 'seasonal';
    icon: LucideIcon;
    accent: string; // tailwind text/bg accent token
}

export const ADDON_CATALOG: AddonCatalogEntry[] = [
    {
        type: 'instant_booking',
        name: 'Instant Booking',
        description: 'Let travellers reserve and confirm instantly — no manual approval step.',
        priceLabel: 'From €19/mo',
        billing: 'recurring',
        icon: Zap,
        accent: 'amber',
    },
    {
        type: 'verified_badge',
        name: 'Verified Badge',
        description: 'Display the trust-building "Verified" badge on your listing across the site.',
        priceLabel: 'One-time €49',
        billing: 'one_time',
        icon: BadgeCheck,
        accent: 'blue',
    },
    {
        type: 'seasonal_placement',
        name: 'Seasonal Placement',
        description: 'Featured placement during peak-season campaigns and homepage spotlights.',
        priceLabel: 'From €99 / campaign',
        billing: 'seasonal',
        icon: CalendarRange,
        accent: 'rose',
    },
    {
        type: 'sponsored_article',
        name: 'Sponsored Article',
        description: 'A dedicated editorial piece about your business, promoted on the blog.',
        priceLabel: 'From €149',
        billing: 'one_time',
        icon: Newspaper,
        accent: 'indigo',
    },
    {
        type: 'ai_localization',
        name: 'AI Translation & Localization',
        description: 'Auto-translate your listing into additional languages for a wider audience.',
        priceLabel: 'From €29/mo',
        billing: 'recurring',
        icon: Languages,
        accent: 'teal',
    },
];
