import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Sparkles, Star, Building2, ArrowRight } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';

interface Feature {
    label: string;
    included: boolean;
}

interface Tier {
    id: string;
    name: string;
    badge?: string;
    badgeColor?: string;
    monthlyPrice?: number;
    annualPrice?: number;
    description: string;
    ctaLabel: string;
    ctaTo: string;
    ctaPrimary: boolean;
    features: Feature[];
}

const tiers: Tier[] = [
    {
        id: 'explorer',
        name: 'Explorer',
        monthlyPrice: 0,
        annualPrice: 0,
        description: 'Get discovered by travelers looking for local businesses in Alanya.',
        ctaLabel: 'Get Started',
        ctaTo: '/register',
        ctaPrimary: false,
        features: [
            { label: 'Business name & description', included: true },
            { label: '1 category listing', included: true },
            { label: 'Contact info & website link', included: true },
            { label: '5 photos', included: true },
            { label: 'Basic map pin', included: true },
            { label: 'Customer reviews', included: true },
            { label: 'Social media links', included: true },
            { label: 'Mobile-friendly profile', included: true },
            { label: 'Featured placement', included: false },
            { label: 'Priority ranking', included: false },
            { label: 'Video support', included: false },
            { label: 'WhatsApp booking button', included: false },
            { label: 'Analytics dashboard', included: false },
            { label: 'Dofollow backlink', included: false },
            { label: 'Homepage exposure', included: false },
            { label: 'AI multilingual descriptions', included: false },
            { label: 'Concierge support', included: false },
            { label: 'Dedicated account manager', included: false },
        ],
    },
    {
        id: 'voyager',
        name: 'Voyager',
        badge: 'Most Popular',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        monthlyPrice: 59,
        annualPrice: 499,
        description: 'Stand out from the crowd with featured placement and premium tools.',
        ctaLabel: 'Upgrade to Voyager',
        ctaTo: '/subscribe?tier=voyager',
        ctaPrimary: true,
        features: [
            { label: 'Everything in Explorer', included: true },
            { label: 'Featured placement in directory', included: true },
            { label: '"Recommended" badge on profile', included: true },
            { label: 'Priority search ranking', included: true },
            { label: '50 photos', included: true },
            { label: 'Video support', included: true },
            { label: 'WhatsApp booking button', included: true },
            { label: 'Direct booking link', included: true },
            { label: 'Seasonal promotions banner', included: true },
            { label: 'Basic analytics dashboard', included: true },
            { label: 'Dofollow backlink', included: true },
            { label: 'Faster approval (< 24h)', included: true },
            { label: 'Homepage exposure', included: false },
            { label: 'AI multilingual descriptions', included: false },
            { label: 'Concierge support', included: false },
            { label: 'Dedicated account manager', included: false },
        ],
    },
    {
        id: 'signature',
        name: 'Signature',
        badge: 'Best Value',
        badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
        monthlyPrice: 199,
        annualPrice: 1999,
        description: 'Maximum visibility and premium features for established businesses.',
        ctaLabel: 'Go Signature',
        ctaTo: '/subscribe?tier=signature',
        ctaPrimary: true,
        features: [
            { label: 'Everything in Voyager', included: true },
            { label: 'Homepage exposure', included: true },
            { label: '"Verified Premium" badge', included: true },
            { label: 'Priority lead routing', included: true },
            { label: 'Travel guide feature inclusion', included: true },
            { label: 'Instagram spotlight post', included: true },
            { label: 'AI multilingual descriptions (EN/TR/RU/DE/AR)', included: true },
            { label: 'Concierge support', included: true },
            { label: 'Multiple location profiles', included: true },
            { label: 'Advanced analytics + competitor insights', included: true },
            { label: 'Premium media uploads', included: true },
            { label: 'Drone / video showcase slot', included: true },
            { label: 'Newsletter inclusion', included: true },
            { label: 'Dedicated account manager', included: true },
            { label: 'API access', included: false },
            { label: 'Co-marketing campaigns', included: false },
            { label: 'Exclusive territory rights', included: false },
        ],
    },
    {
        id: 'partner',
        name: 'Destination Partner',
        badge: 'Enterprise',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        description: 'Tailored partnerships for hotels, resorts, and large operators.',
        ctaLabel: 'Contact Sales',
        ctaTo: '/contact',
        ctaPrimary: false,
        features: [
            { label: 'Everything in Signature', included: true },
            { label: 'Custom terms & pricing', included: true },
            { label: 'White-glove onboarding', included: true },
            { label: 'API access', included: true },
            { label: 'Co-marketing campaigns', included: true },
            { label: 'Exclusive territory rights', included: true },
            { label: 'Quarterly business reviews', included: true },
            { label: 'Priority product roadmap input', included: true },
        ],
    },
];

function formatPrice(price: number, isAnnual: boolean): string {
    if (price === 0) return 'Free';
    return isAnnual ? `$${price.toLocaleString()}/year` : `$${price}/month`;
}

function annualSavings(monthly: number, annual: number): number {
    return monthly * 12 - annual;
}

export const ListingTiersPage: React.FC = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <>
            <SEOHead
                title="List Your Business"
                description="List your business on Alanya Holidays and reach thousands of travelers. Choose from Explorer, Voyager, Signature, or Destination Partner plans."
                type="website"
                keywords={[
                    'list business Alanya',
                    'business directory Turkey',
                    'partner with Alanya Holidays',
                    'local business listing',
                ]}
            />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-24">
                {/* Hero */}
                <div className="max-w-4xl mx-auto px-4 text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white mb-4">
                        List Your Business
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Reach thousands of travelers searching for the best local experiences in Alanya.
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                !isAnnual
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                                isAnnual
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Annual
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">
                                Save up to 30%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
                        {tiers.map((tier) => {
                            const isFree = (tier.monthlyPrice ?? 0) === 0 && (tier.annualPrice ?? 0) === 0;
                            const isCustom = tier.monthlyPrice === undefined;
                            const savings = !isFree && !isCustom && tier.monthlyPrice && tier.annualPrice
                                ? annualSavings(tier.monthlyPrice, tier.annualPrice)
                                : 0;

                            return (
                                <div
                                    key={tier.id}
                                    className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                                        tier.ctaPrimary
                                            ? 'border-teal-200 dark:border-teal-800/50 ring-1 ring-teal-100 dark:ring-teal-900/30'
                                            : 'border-slate-100 dark:border-slate-800/50'
                                    }`}
                                >
                                    {/* Badge */}
                                    {tier.badge && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${tier.badgeColor}`}>
                                                {tier.id === 'voyager' && <Star size={12} />}
                                                {tier.id === 'signature' && <Sparkles size={12} />}
                                                {tier.id === 'partner' && <Building2 size={12} />}
                                                {tier.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Header */}
                                    <div className="p-6 pb-4 text-center border-b border-slate-100 dark:border-slate-800/50">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                            {tier.name}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 min-h-[40px]">
                                            {tier.description}
                                        </p>

                                        <div className="flex flex-col items-center">
                                            {isCustom ? (
                                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                                    Custom
                                                </span>
                                            ) : (
                                                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                                    {formatPrice(isAnnual ? (tier.annualPrice ?? 0) : (tier.monthlyPrice ?? 0), isAnnual)}
                                                </span>
                                            )}
                                            {!isFree && !isCustom && (
                                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    {isAnnual
                                                        ? `Billed annually`
                                                        : `Billed monthly`
                                                    }
                                                </span>
                                            )}
                                            {isAnnual && savings > 0 && (
                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                                                    Save ${savings.toLocaleString()}/year
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="flex-1 p-6">
                                        <ul className="space-y-3">
                                            {tier.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    {feature.included ? (
                                                        <Check
                                                            size={18}
                                                            className="shrink-0 mt-0.5 text-green-500"
                                                            strokeWidth={2.5}
                                                        />
                                                    ) : (
                                                        <X
                                                            size={18}
                                                            className="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600"
                                                            strokeWidth={2.5}
                                                        />
                                                    )}
                                                    <span
                                                        className={`text-sm leading-snug ${
                                                            feature.included
                                                                ? 'text-slate-700 dark:text-slate-300'
                                                                : 'text-slate-400 dark:text-slate-600'
                                                        }`}
                                                    >
                                                        {feature.label}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* CTA */}
                                    <div className="p-6 pt-0">
                                        <Link
                                            to={tier.ctaTo}
                                            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                                tier.ctaPrimary
                                                    ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg'
                                                    : tier.id === 'partner'
                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {tier.ctaLabel}
                                            {tier.ctaPrimary && <ArrowRight size={16} />}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom trust section */}
                <div className="max-w-3xl mx-auto px-4 mt-20 text-center">
                    <div className="flex flex-wrap justify-center gap-8 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            <span className="text-sm">No credit card required for Explorer</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            <span className="text-sm">Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            <span className="text-sm">Instant activation</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
