import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Download, Zap, Smartphone, Globe, Check, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { yesimService, YesimPlan } from '../api-services/api/yesim';
import { toast } from 'react-hot-toast';
import { EsimModal } from '../components/services/EsimModal';

export const Esim: React.FC = () => {
    const { t } = useLanguage();
    const { formatPrice, convertPrice } = useCurrency();
    const [plans, setPlans] = useState<YesimPlan[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<YesimPlan | null>(null);

    useEffect(() => {
        const isMountedRef = { current: true };
        const loadPlans = async () => {
            try {
                const data = await yesimService.getPlans();
                if (isMountedRef.current) {
                    setPlans(data.slice(0, 6));
                }
            } catch (error) {
                // ignore unmount
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };
        loadPlans();
        return () => { isMountedRef.current = false; };
    }, []);

    const loadPlans = async () => {
        try {
            const data = await yesimService.getPlans();
            setPlans(data.slice(0, 6));
        } catch (error) {
            console.error('Failed to load plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan: YesimPlan) => {
        setSelectedPlan(plan);
        setShowModal(true);
    };

    const handleConfirmPurchase = () => {
        if (!selectedPlan) return;

        // Use partner ID in redirect
        const partnerId = '2737'; // Your Yesim partner ID or 'ref' code

        // Map plan type to correct Yesim URL
        let destination = 'country/turkey';
        if (selectedPlan.plan_type === 'global') {
            destination = 'regions/global-esim';
        }

        const redirectUrl = `https://yesim.app/${destination}/?ref=${partnerId}`;

        setShowModal(false);
        window.open(redirectUrl, '_blank');

        toast.success('Redirecting to secure checkout...', {
            icon: '🛍️'
        });
    };

    return (
        <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-24">
                    <div className="md:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-slate-800/50 text-teal-700 dark:text-cyan-400 dark:text-slate-200 text-sm font-bold mb-6">
                            <Wifi size={16} />
                            <span>Instant Connectivity</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-serif text-slate-900 dark:text-white mb-6 leading-tight">
                            Stay Connected with <span className="text-teal-600 dark:text-cyan-400 dark:text-slate-200">eSIM</span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-lg">
                            {t('esim.hero.subtitle')}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {[
                                { icon: Zap, label: 'Instant Activation' },
                                { icon: Globe, label: 'Global Coverage' },
                                { icon: Smartphone, label: 'No Physical SIM' },
                                { icon: Check, label: 'Keep Your Number' }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-800/80 rounded-lg shadow-sm">
                                        <feature.icon size={20} className="text-teal-500 dark:text-cyan-400 " />
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{feature.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-1/2 flex justify-center">
                        <div className="relative w-72 h-[580px] bg-slate-900 rounded-[3.5rem] border-[8px] border-slate-800 shadow-2xl p-4 flex flex-col items-center transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                            {/* Phone Notch */}
                            <div className="absolute top-0 w-36 h-7 bg-slate-800 rounded-b-xl z-20"></div>

                            {/* Screen Content */}
                            <div className="w-full h-full bg-slate-800 rounded-[2.5rem] overflow-hidden relative">
                                <img
                                    src="https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800&q=80"
                                    alt="Alanya Map"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

                                <div className="p-6 relative z-10 text-white h-full flex flex-col justify-end pb-12">
                                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-teal-500 dark:bg-cyan-600 rounded-full flex items-center justify-center">
                                                    <Wifi size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-300">Current Plan</p>
                                                    <p className="font-bold">Turkey Holiday</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-300">Data Left</p>
                                                <p className="font-bold text-teal-300">4.2 GB</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                            <div className="bg-teal-400 dark:bg-cyan-600 h-full w-[70%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How it Works Section */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white mb-4">How it Works</h2>
                        <p className="text-slate-600 dark:text-slate-400">Get connected in three simple steps</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-slate-200 dark:bg-slate-800/50 -translate-y-1/2 z-0"></div>

                        {[
                            { step: '01', title: 'Pick a Plan', desc: 'Choose the data bundle that fits your needs in Turkey.', icon: Smartphone },
                            { step: '02', title: 'Quick Checkout', desc: 'Complete your purchase securely on our partner site.', icon: Zap },
                            { step: '03', title: 'Scan & Connect', desc: 'Scan the QR code and enjoy instant high-speed data.', icon: Wifi }
                        ].map((item, idx) => (
                            <div key={idx} className="relative z-10 bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50 text-center group hover:shadow-md transition-shadow">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-slate-800/50 text-teal-600 dark:text-cyan-400 dark:text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                                    <item.icon size={32} />
                                </div>
                                <span className="block text-4xl font-bold text-slate-100 dark:text-slate-300 absolute top-4 right-8">{item.step}</span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compatibility Helper */}
                <div className="mb-24 bg-teal-50 dark:bg-slate-800/50 rounded-3xl p-10 border border-teal-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center gap-10">
                    <div className="md:w-2/3">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Is Your Device Ready?</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            eSIM works on most modern smartphones including iPhone (XS and newer), Samsung (S20 and newer), and Google Pixel (3 and newer).
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {['iPhone XS+', 'Samsung S20+', 'Google Pixel 3+', 'iPad Pro+', 'Apple Watch+'].map((tag) => (
                                <span key={tag} className="px-4 py-2 bg-white dark:bg-slate-800/80 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="md:w-1/3 flex justify-center">
                        <div className="text-center">
                            <div className="mb-4 text-teal-600 dark:text-cyan-400 dark:text-slate-200 font-bold text-lg">Dial *#06#</div>
                            <p className="text-sm text-slate-500 max-w-[200px]">
                                If you see an EID number in the list, your device is eSIM compatible.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Affiliate Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <a
                        href="https://holafly.sjv.io/MKnq6Y"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden bg-white dark:bg-slate-800/80 rounded-3xl p-8 shadow-lg border border-slate-100 dark:border-slate-800/50 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Globe size={80} className="text-slate-900 dark:text-white" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Holafly eSIM</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xs">
                                Unlimited data plans for Alanya and 160+ countries.
                            </p>
                            <span className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 dark:text-slate-200 font-bold group-hover:gap-3 transition-all">
                                Visit Holafly <Zap size={18} />
                            </span>
                        </div>
                    </a>

                    <a
                        href="https://yesim.app/?ref=2737"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden bg-teal-600 dark:bg-cyan-600 rounded-3xl p-8 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
                            <Wifi size={80} className="text-white" />
                        </div>
                        <div className="relative z-10 text-white">
                            <h3 className="text-2xl font-bold mb-2">Yesim Mobile</h3>
                            <p className="text-teal-50 mb-6 max-w-xs">
                                Flexible pay-as-you-go data and VPN services for international travel.
                            </p>
                            <span className="inline-flex items-center gap-2 text-white font-bold group-hover:gap-3 transition-all">
                                Explore Yesim <Zap size={18} />
                            </span>
                        </div>
                    </a>
                </div>

                {/* Plans Section */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold font-serif text-slate-900 dark:text-white mb-8 text-center">Popular Turkey Bundles</h2>

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader className="animate-spin text-teal-600 dark:text-cyan-400 " size={48} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {plans.map((plan) => (
                                <div key={plan.id} className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-800/50 hover:border-teal-500 dark:hover:border-teal-500 transition-all duration-300 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-teal-50 dark:bg-slate-800/50 rounded-bl-2xl">
                                        <span className="font-bold text-teal-600 dark:text-cyan-400 dark:text-slate-200">{plan.days} Days</span>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatPrice(convertPrice(parseFloat(plan.price), 'EUR'))}</span>
                                            <span className="text-slate-500 dark:text-slate-400">/ {plan.data}GB</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Check size={16} className="text-teal-500 dark:text-cyan-400 " />
                                            <span>High-speed 4G/LTE</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Check size={16} className="text-teal-500 dark:text-cyan-400 " />
                                            <span>Instant Delivery</span>
                                        </li>
                                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <Check size={16} className="text-teal-500 dark:text-cyan-400 " />
                                            <span>Works in {plan.countries_included}</span>
                                        </li>
                                    </ul>

                                    <button
                                        onClick={() => handlePlanSelect(plan)}
                                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={20} />
                                        Get eSIM Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {selectedPlan && (
                <EsimModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    plan={{
                        id: selectedPlan.id,
                        name: selectedPlan.name,
                        price: formatPrice(convertPrice(parseFloat(selectedPlan.price), 'EUR')),
                        data: selectedPlan.data,
                        days: selectedPlan.days
                    }}
                    onConfirm={handleConfirmPurchase}
                />
            )}
        </div>
    );
};
