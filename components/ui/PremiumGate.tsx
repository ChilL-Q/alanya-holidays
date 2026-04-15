import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { subscriptionsService } from '../../api-services/api/subscriptions';
import toast from 'react-hot-toast';

interface PremiumGateProps {
    children: React.ReactNode;
    isPremium: boolean;
    isLoading?: boolean;
}

const FEATURES = [
    'AI-powered personalized trip itineraries',
    'Minute-by-minute day plans',
    'Budget & pace customization',
    'Access to verified local consultants',
    'PDF export & share',
];

export const PremiumGate: React.FC<PremiumGateProps> = ({ children, isPremium, isLoading }) => {
    const [upgrading, setUpgrading] = React.useState(false);

    const handleUpgrade = async (plan: 'monthly' | 'annual') => {
        setUpgrading(true);
        try {
            const { url } = await subscriptionsService.createSubscriptionCheckout(plan);
            window.location.href = url;
        } catch (err) {
            console.error('Checkout error:', err);
            toast.error('Failed to start checkout. Please try again.');
        } finally {
            setUpgrading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-8 text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-3xl font-black mb-2">Unlock Premium</h2>
                    <p className="text-blue-100 text-lg">
                        Get your personalized AI travel itinerary & access to local consultants
                    </p>
                </div>

                <div className="p-8">
                    {/* Features */}
                    <ul className="space-y-3 mb-8 text-left">
                        {FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                    <Check size={12} className="text-teal-600 dark:text-teal-400" />
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => handleUpgrade('monthly')}
                            disabled={upgrading}
                            className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group disabled:opacity-50"
                        >
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">$9.99</p>
                            <p className="text-xs text-slate-400">per month</p>
                        </button>
                        <button
                            onClick={() => handleUpgrade('annual')}
                            disabled={upgrading}
                            className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-600 transition-all text-left relative disabled:opacity-50"
                        >
                            <span className="absolute -top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Save 33%
                            </span>
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Annual</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">$79.99</p>
                            <p className="text-xs text-slate-400">per year</p>
                        </button>
                    </div>

                    <p className="text-xs text-slate-400 text-center">
                        Cancel anytime · Secure payment via Stripe
                    </p>
                </div>
            </div>
        </div>
    );
};
