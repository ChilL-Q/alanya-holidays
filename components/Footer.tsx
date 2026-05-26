import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    const { t } = useLanguage();

    const [email, setEmail] = React.useState('');
    const [subscribed, setSubscribed] = React.useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail('');
            // In a real app, you would send this to an API
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    return (
        <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 border-t border-slate-800/50 relative overflow-hidden">
            {/* Subtle Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* 1. Brand & Socials & Newsletter */}
                    <div className="space-y-8">
                        <div>
                            <Link to="/" className="flex items-center gap-2 group mb-6">
                                <img src="/logo.png" alt="Alanya Holidays" className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5" />
                                <span className="font-serif text-2xl text-white tracking-tight">
                                    Alanya<span className="text-teal-500 font-light transition-colors group-hover:text-teal-400">Holidays</span>
                                </span>
                            </Link>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {t('footer.description')}
                            </p>
                        </div>

                        {/* Newsletter */}
                        <div>
                            <h4 className="text-white font-medium mb-3 text-sm tracking-wide">{t('footer.subscribe_title')}</h4>
                            {subscribed ? (
                                <div className="text-teal-400 text-sm font-medium animate-in fade-in">
                                    {t('footer.subscribe_success')}
                                </div>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex gap-2">
                                    <input
                                        type="email"
                                        id="newsletter-email"
                                        name="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('footer.email_placeholder')}
                                        required
                                        className="bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full transition-all"
                                    />
                                    <button type="submit" className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-teal-500/20 active:translate-y-0">
                                        {t('footer.join_button')}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <a href="#" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-teal-500 hover:border-teal-500 hover:text-white transition-all duration-300 hover:-translate-y-1">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-teal-500 hover:border-teal-500 hover:text-white transition-all duration-300 hover:-translate-y-1">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-teal-500 hover:border-teal-500 hover:text-white transition-all duration-300 hover:-translate-y-1">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-teal-500 hover:border-teal-500 hover:text-white transition-all duration-300 hover:-translate-y-1">
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>

                    {/* 2. Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('footer.company')}</h3>
                        <ul className="space-y-3 mt-4 text-sm">
                            <li><Link to="/about" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.about')}</Link></li>
                            <li><Link to="/stays" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('nav.stays')}</Link></li>
                            <li><Link to="/list-property" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.listYourRental')}</Link></li>
                            <li><Link to="/contact" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* 3. Services */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('footer.services_title')}</h3>
                        <ul className="space-y-3 mt-4 text-sm">
                            <li><Link to="/services" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('services.transport.title')}</Link></li>
                            <li><Link to="/services/experiences" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.experiences')}</Link></li>
                            <li><Link to="/services/health" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('services.health.title')}</Link></li>
                            <li><Link to="/services/visa" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('services.visa.title')}</Link></li>
                            <li><Link to="/services/connectivity" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('services.connectivity.title')}</Link></li>
                        </ul>
                    </div>

                    {/* 4. Shop */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('shop')}</h3>
                        <ul className="space-y-3 mt-4 text-sm">
                            <li><Link to="/shop" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('shop.view_all_products')}</Link></li>
                            <li><Link to="/shop?category=souvenir" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('shop.category.souvenir')}</Link></li>
                            <li><Link to="/shop?category=textile" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('shop.category.textile')}</Link></li>
                            <li><Link to="/shop?category=food" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('shop.category.food')}</Link></li>
                            <li><Link to="/shop?category=jewelry" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('shop.category.jewelry')}</Link></li>
                            <li><Link to="/shop?category=art" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('shop.category.art')}</Link></li>
                        </ul>
                    </div>

                    {/* 5. Support & Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('footer.help')}</h3>
                        <ul className="space-y-3 mt-4 text-sm mb-8">
                            <li><Link to="/help" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.faqs')}</Link></li>
                            <li><Link to="/privacy" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.privacy')}</Link></li>
                            <li><Link to="/terms" className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">{t('footer.terms')}</Link></li>
                        </ul>

                        <div className="space-y-4 pt-6 border-t border-slate-800/50">
                            <div className="flex items-center gap-3 text-sm hover:text-teal-400 transition-colors cursor-pointer group">
                                <Mail size={16} className="text-teal-500 group-hover:scale-110 transition-transform" />
                                <span>contact@alanyaholidays.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm hover:text-teal-400 transition-colors cursor-pointer group">
                                <Phone size={16} className="text-teal-500 group-hover:scale-110 transition-transform" />
                                <span>+14389294208</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm group cursor-default">
                                <MapPin size={16} className="text-teal-500 mt-1" />
                                <span>Kesefli Mah. Alanya, Turkiye</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                <p>{t('footer.copyright')}</p>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <div className="flex gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        {/* Simple CSS shapes or SVGs for payment methods could go here, or text */}
                        <span className="border border-slate-700 px-2 py-1 rounded text-xs">VISA</span>
                        <span className="border border-slate-700 px-2 py-1 rounded text-xs">Mastercard</span>
                    </div>

                </div>
            </div>
        </footer>
    );
};
