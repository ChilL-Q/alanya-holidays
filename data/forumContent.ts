import {
    Plane, Waves, UtensilsCrossed, Compass, Laptop, Building2,
    Landmark, CalendarDays, ShoppingBag, LifeBuoy, MessagesSquare,
    type LucideIcon,
} from 'lucide-react';

/** Map a stored category icon name to a lucide component. */
export const categoryIcons: Record<string, LucideIcon> = {
    Plane,
    Waves,
    UtensilsCrossed,
    Compass,
    Laptop,
    Building2,
    Landmark,
    CalendarDays,
    ShoppingBag,
    LifeBuoy,
};

export const getCategoryIcon = (name?: string | null): LucideIcon =>
    (name && categoryIcons[name]) || MessagesSquare;

interface AccentStyle {
    /** Gradient used for solid (image-less) category cards and icon chips. */
    gradient: string;
    /** Soft chip background for badges / icon tiles on light surfaces. */
    chipBg: string;
    chipText: string;
    /** Solid badge used over imagery. */
    badge: string;
}

const DEFAULT_ACCENT: AccentStyle = {
    gradient: 'from-teal-500 to-cyan-600',
    chipBg: 'bg-teal-50 dark:bg-teal-900/30',
    chipText: 'text-teal-600 dark:text-teal-300',
    badge: 'bg-teal-600',
};

export const accentStyles: Record<string, AccentStyle> = {
    sky:     { gradient: 'from-sky-500 to-blue-600',       chipBg: 'bg-sky-50 dark:bg-sky-900/30',       chipText: 'text-sky-600 dark:text-sky-300',       badge: 'bg-sky-600' },
    cyan:    { gradient: 'from-cyan-500 to-teal-600',      chipBg: 'bg-cyan-50 dark:bg-cyan-900/30',      chipText: 'text-cyan-600 dark:text-cyan-300',      badge: 'bg-cyan-600' },
    orange:  { gradient: 'from-orange-500 to-amber-600',   chipBg: 'bg-orange-50 dark:bg-orange-900/30',  chipText: 'text-orange-600 dark:text-orange-300',  badge: 'bg-orange-600' },
    emerald: { gradient: 'from-emerald-500 to-green-600',  chipBg: 'bg-emerald-50 dark:bg-emerald-900/30',chipText: 'text-emerald-600 dark:text-emerald-300',badge: 'bg-emerald-600' },
    violet:  { gradient: 'from-violet-500 to-purple-600',  chipBg: 'bg-violet-50 dark:bg-violet-900/30',  chipText: 'text-violet-600 dark:text-violet-300',  badge: 'bg-violet-600' },
    blue:    { gradient: 'from-blue-500 to-indigo-600',    chipBg: 'bg-blue-50 dark:bg-blue-900/30',      chipText: 'text-blue-600 dark:text-blue-300',      badge: 'bg-blue-600' },
    amber:   { gradient: 'from-amber-500 to-orange-600',   chipBg: 'bg-amber-50 dark:bg-amber-900/30',    chipText: 'text-amber-600 dark:text-amber-300',    badge: 'bg-amber-600' },
    rose:    { gradient: 'from-rose-500 to-pink-600',      chipBg: 'bg-rose-50 dark:bg-rose-900/30',      chipText: 'text-rose-600 dark:text-rose-300',      badge: 'bg-rose-600' },
    teal:    { gradient: 'from-teal-500 to-cyan-600',      chipBg: 'bg-teal-50 dark:bg-teal-900/30',      chipText: 'text-teal-600 dark:text-teal-300',      badge: 'bg-teal-600' },
    indigo:  { gradient: 'from-indigo-500 to-violet-600',  chipBg: 'bg-indigo-50 dark:bg-indigo-900/30',  chipText: 'text-indigo-600 dark:text-indigo-300',  badge: 'bg-indigo-600' },
};

export const getAccent = (key?: string | null): AccentStyle =>
    (key && accentStyles[key]) || DEFAULT_ACCENT;

/** Hero background + fallback thread imagery (local assets — CSP blocks remote). */
export const FORUM_HERO_IMAGE = '/images/home/cleopatra_beach.png';
export const THREAD_FALLBACK_IMAGE = '/images/hero-bg.jpg';

export interface ForumEvent {
    title: string;
    date: string;
    location: string;
    attendees: number;
    image: string;
}

export const FORUM_EVENTS: ForumEvent[] = [
    {
        title: 'Digital Nomad Beach Meetup',
        date: 'June 10, 2026',
        location: 'Cleopatra Beach',
        attendees: 45,
        image: '/images/home/cleopatra_beach.png',
    },
    {
        title: 'Sunset Boat Tour & BBQ',
        date: 'June 15, 2026',
        location: 'Alanya Harbor',
        attendees: 32,
        image: '/images/experiences/water_sports_hero.png',
    },
    {
        title: 'Language Exchange Night',
        date: 'June 18, 2026',
        location: 'The Local Pub, Alanya',
        attendees: 28,
        image: '/images/home/turkish_cuisine.png',
    },
];

export interface ForumContributor {
    name: string;
    title: string;
    posts: number;
    quote: string;
}

export const FORUM_CONTRIBUTORS: ForumContributor[] = [
    { name: 'AlanyaExplorer', title: 'Top Contributor', posts: 1247, quote: 'Living in Alanya for 5 years. I know every beach, every hidden cafe, and every shortcut.' },
    { name: 'SunnySideUp', title: 'Community Leader', posts: 2156, quote: 'Digital nomad turned local. Organizing meetups and helping newcomers settle in.' },
    { name: 'TurkishFoodie', title: 'Verified Local', posts: 876, quote: 'Born and raised in Alanya. Restaurant owner passionate about sharing our food culture.' },
    { name: 'BeachBumNomad', title: 'Rising Star', posts: 234, quote: 'Moved here 3 months ago. Sharing my fresh perspective as a new expat.' },
    { name: 'PropertyQueen', title: 'Real Estate Expert', posts: 567, quote: 'Real estate consultant specializing in foreign investments. Here to help you navigate the market.' },
    { name: 'HistoryBuff', title: 'Cultural Ambassador', posts: 445, quote: 'Archaeology PhD student. Exploring ancient sites and sharing their stories.' },
];
