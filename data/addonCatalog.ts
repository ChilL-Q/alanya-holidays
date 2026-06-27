import { Zap, BadgeCheck, CalendarRange, Newspaper, Languages, LucideIcon } from 'lucide-react';
import { AddonType } from '../types/models';

export type PurchasableAddonType = Exclude<AddonType, 'instant_booking'>;

export interface AddonCatalogEntry {
    type: AddonType;
    name: string;
    description: string;
    priceLabel: string;
    billing: 'one_time' | 'seasonal';
    purchasable: boolean; // instant_booking is deferred (booking-logic track)
    icon: LucideIcon;
    accent: string; // tailwind text/bg accent token
}

export const ADDON_CATALOG: AddonCatalogEntry[] = [
    {
        type: 'verified_badge',
        name: 'Verified Badge',
        description: 'Display the trust-building "Verified" badge on your listing across the site.',
        priceLabel: 'One-time €49',
        billing: 'one_time',
        purchasable: true,
        icon: BadgeCheck,
        accent: 'blue',
    },
    {
        type: 'seasonal_placement',
        name: 'Seasonal Placement',
        description: 'Featured placement during peak-season campaigns and homepage spotlights.',
        priceLabel: '€99 / 90 days',
        billing: 'seasonal',
        purchasable: true,
        icon: CalendarRange,
        accent: 'rose',
    },
    {
        type: 'sponsored_article',
        name: 'Sponsored Article',
        description: 'A dedicated editorial piece about your business, promoted on the blog.',
        priceLabel: 'One-time €149',
        billing: 'one_time',
        purchasable: true,
        icon: Newspaper,
        accent: 'indigo',
    },
    {
        type: 'ai_localization',
        name: 'AI Translation & Localization',
        description: 'Auto-translate your listing into additional languages for a wider audience.',
        priceLabel: 'One-time €29',
        billing: 'one_time',
        purchasable: true,
        icon: Languages,
        accent: 'teal',
    },
    {
        type: 'instant_booking',
        name: 'Instant Booking',
        description: 'Let travellers reserve and confirm instantly — no manual approval step. Coming soon.',
        priceLabel: 'Coming soon',
        billing: 'one_time',
        purchasable: false,
        icon: Zap,
        accent: 'amber',
    },
];
