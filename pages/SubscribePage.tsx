import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, ArrowLeft, Loader2, Star, Sparkles } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { subscriptionsService, SubscriptionTier } from '../api-services/api/subscriptions';
import toast from 'react-hot-toast';

interface TierConfig {
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    badgeLabel: string;
    badgeColor: string;
    highlights: string[];
}

const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
    voyager: {
        name: 'Voyager',
        monthlyPrice: 49,
        annualPrice: 449,
        badgeLabel: 'Most Popular',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        highlights: [
            'Featured placement in directory',
            '"Recommended" badge on profile',
            'Priority search ranking',
            '50 photos + video support',
            'WhatsApp booking button',
            'Dofollow backlink',
            'Basic analytics dashboard',
        ],
    },
    signature: {
        name: 'Signature',
        monthlyPrice: 199,
        annualPrice: 1999,
        badgeLabel: 'Best Value',
        badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
        highlights: [
            'Everything in Voyager',
            'Homepage exposure',
            '"Verified Premium" badge',
            'AI multilingual descriptions (EN/TR/RU/DE/AR)',
            'Instagram spotlight post',
            'Advanced analytics + competitor insights',
            'Dedicated account manager',
        ],
    },
};

function annualSavings(monthly: number, annual: number): number {
    return monthly * 12 - annual;
}

export const SubscribePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const tierParam = searchParams.get('tier') as SubscriptionTier | null;

    if (!tierParam || !TIER_CONFIG[tierParam]) {
        navigate('/list-business', { replace: true });
        return null;
    }

    const tier = tierParam;
    const config = TIER_CONFIG[tier];
    const plan = isAnnual ? 'annual' : 'monthly';
    const price = isAnnual ? config.annualPrice : config.monthlyPrice;
    const savings = annualSavings(config.monthlyPrice, config.annualPrice);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const { url } = await subscriptionsService.createSubscriptionCheckout(plan, tier);
            window.location.href = url;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            if (message.includes('already has an active subscription')) {
                toast.error('You already have an active subscription. Manage it from your profile.');
            } else {
                toast.error('Failed to start checkout. Please try again.');
            }
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead
                title={`Subscribe to ${config.name}`}
                description={`Get ${config.name} listing on Alanya Holidays and reach thousands of travelers.`}
                type="website"
            />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-24">
                <div className="max-w-lg mx-auto px-4">
                    {/* Back link */}
                    <Link
                        to="/list-business"
                        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        View all plans
                    </Link>

                    {/* Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-teal-200 dark:border-teal-800/50 ring-1 ring-teal-100 dark:ring-teal-900/30 overflow-hidden">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${config.badgeColor}`}>
                                {tier === 'voyager' ? <Star size={12} /> : <Sparkles size={12} />}
                                {config.badgeLabel}
                            </span>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                {config.name} Plan
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                List your business with premium features
                            </p>
                        </div>

                        {/* Billing toggle */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center justify-center">
                                <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        onClick={() => setIsAnnual(false)}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                            !isAnnual
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setIsAnnual(true)}
                                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                                            isAnnual
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        Annual
                                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                            Save {Math.round((savings / (config.monthlyPrice * 12)) * 100)}%
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mt-5">
                                <div className="text-4xl font-bold text-slate-900 dark:text-white">
                                    ${price.toLocaleString()}
                                    <span className="text-base font-normal text-slate-500 dark:text-slate-400 ml-1">
                                        {isAnnual ? '/year' : '/month'}
                                    </span>
                                </div>
                                {isAnnual && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                                        Save ${savings.toLocaleString()} vs monthly billing
                                    </p>
                                )}
                                {!isAnnual && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Billed monthly
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
                            <ul className="space-y-3">
                                {config.highlights.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check size={18} className="shrink-0 mt-0.5 text-green-500" strokeWidth={2.5} />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA */}
                        <div className="p-6">
                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Redirecting to checkout…
                                    </>
                                ) : (
                                    `Subscribe to ${config.name}`
                                )}
                            </button>
                            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                                Secure checkout via Stripe · Cancel anytime
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
