import React from 'react';
import { ListingTier } from '../../types/models';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Sparkles, Building2, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';

interface TierSelectionModalProps {
    isOpen: boolean;
    currentTier: ListingTier;
    onSelectTier: (tier: ListingTier) => void;
}

interface TierOption {
    id: ListingTier;
    name: string;
    price: string;
    description: string;
    features: string[];
    badge?: string;
    badgeColor?: string;
    highlight: boolean;
}

const TIER_OPTIONS: TierOption[] = [
    {
        id: 'explorer',
        name: 'Explorer',
        price: 'Free',
        description: 'Get discovered by travelers.',
        features: ['Business name & description', '5 photos', 'Contact info & website', 'Basic map pin'],
        highlight: false,
    },
    {
        id: 'voyager',
        name: 'Voyager',
        price: '$49/mo',
        description: 'Stand out with featured placement.',
        features: ['Everything in Explorer', 'Featured placement', '"Recommended" badge', '50 photos', 'Priority ranking', 'WhatsApp button'],
        badge: 'Most Popular',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        highlight: true,
    },
    {
        id: 'signature',
        name: 'Signature',
        price: '$199/mo',
        description: 'Maximum visibility for established businesses.',
        features: ['Everything in Voyager', 'Homepage exposure', '"Verified Premium" badge', '100 photos', 'AI multilingual descriptions', 'Concierge support'],
        badge: 'Best Value',
        badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
        highlight: false,
    },
    {
        id: 'partner',
        name: 'Destination Partner',
        price: 'Custom',
        description: 'Tailored for hotels & large operators.',
        features: ['Everything in Signature', 'Custom terms & pricing', 'White-glove onboarding', 'Co-marketing campaigns', 'Exclusive territory rights'],
        badge: 'Enterprise',
        badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        highlight: false,
    },
];

export const TierSelectionModal: React.FC<TierSelectionModalProps> = ({
    isOpen,
    currentTier,
    onSelectTier,
}) => {
    const navigate = useNavigate();

    const handleSelect = (tier: TierOption) => {
        if (tier.id === 'partner') {
            navigate('/contact');
            return;
        }

        // Always call onSelectTier to close modal and update tier state
        onSelectTier(tier.id);

        // Navigate to Stripe for paid tiers (when not already on that tier)
        if (tier.id !== 'explorer' && currentTier !== tier.id) {
            navigate(`/subscribe?tier=${tier.id}`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => onSelectTier(currentTier)} title="Choose Your Listing Plan" maxWidth="4xl" hideCloseButton={false}>
            <div className="pt-2 pb-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                    Select the plan that fits your business. You can upgrade anytime.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {TIER_OPTIONS.map((tier) => {
                        const isCurrentPlan = currentTier === tier.id;
                        const isPaid = tier.id !== 'explorer' && tier.id !== 'partner';

                        return (
                            <div
                                key={tier.id}
                                className={`relative flex flex-col rounded-xl border p-4 transition-all ${
                                    tier.highlight
                                        ? 'border-teal-300 dark:border-teal-700 ring-1 ring-teal-200 dark:ring-teal-800/50 bg-teal-50/30 dark:bg-teal-900/10'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                                } ${isCurrentPlan ? 'ring-2 ring-teal-500' : ''}`}
                            >
                                {tier.badge && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.badgeColor}`}>
                                            {tier.id === 'voyager' ? <Star size={11} /> : tier.id === 'signature' ? <Sparkles size={11} /> : tier.id === 'partner' ? <Building2 size={11} /> : null}
                                            {tier.badge}
                                        </span>
                                    </div>
                                )}
                                {isCurrentPlan && (
                                    <div className="absolute -top-2.5 right-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-600 text-white">
                                            Current
                                        </span>
                                    </div>
                                )}

                                <div className="mb-3 mt-1">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{tier.name}</h3>
                                    <div className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">{tier.price}</div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tier.description}</p>
                                </div>

                                <ul className="space-y-1.5 mb-4 flex-1">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-1.5">
                                            <Check size={13} className="shrink-0 mt-0.5 text-green-500" strokeWidth={2.5} />
                                            <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSelect(tier)}
                                    className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                                        isCurrentPlan
                                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                                            : tier.highlight
                                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {isCurrentPlan
                                        ? 'Continue with this plan'
                                        : tier.id === 'explorer'
                                        ? 'Get Started Free'
                                        : tier.id === 'partner'
                                        ? 'Contact Sales'
                                        : isPaid && currentTier !== tier.id
                                        ? <>Upgrade <ArrowRight size={12} /></>
                                        : 'Select'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5">
                    Not sure? Start with Explorer for free and upgrade anytime.
                </p>
            </div>
        </Modal>
    );
};
