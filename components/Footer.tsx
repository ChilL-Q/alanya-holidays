import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const FooterLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
    <li>
        <Link to={to} className="hover:text-teal-400 hover:translate-x-1 inline-block transition-all duration-300">
            {label}
        </Link>
    </li>
);

export const Footer: React.FC = () => {
    const { t } = useLanguage();

    const [email, setEmail] = React.useState('');
    const [subscribed, setSubscribed] = React.useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    return (
        <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 border-t border-slate-800/50 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand & Newsletter & Socials */}
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
                            {[
                                { icon: <Instagram size={18} />, href: '#' },
                                { icon: <Facebook size={18} />, href: '#' },
                                { icon: <Twitter size={18} />, href: '#' },
                                { icon: <Youtube size={18} />, href: '#' },
                            ].map(({ icon, href }, i) => (
                                <a key={i} href={href} className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-teal-500 hover:border-teal-500 hover:text-white transition-all duration-300 hover:-translate-y-1">
                                    {icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('footer.company')}</h3>
                        <ul className="space-y-3 mt-4 text-sm">
                            <FooterLink to="/about" label={t('footer.about')} />
                            <FooterLink to="/forum" label={t('nav.forum') || 'Forum'} />
                            <FooterLink to="/events" label={t('nav.events') || 'Events'} />
                            <FooterLink to="/members" label={t('nav.members') || 'Members'} />
                            <FooterLink to="/list-property" label={t('nav.list_business')} />
                            <FooterLink to="/contact" label={t('footer.contact')} />
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('footer.services_title')}</h3>
                        <ul className="space-y-3 mt-4 text-sm">
                            <FooterLink to="/services" label={t('services.transport.title')} />
                            <FooterLink to="/services/experiences" label={t('footer.experiences')} />
                            <FooterLink to="/services/health" label={t('services.health.title')} />
                            <FooterLink to="/services/spa-wellness" label={t('services.spa.title')} />
                            <FooterLink to="/services/hair-beauty" label={t('services.hair.title')} />
                            <FooterLink to="/services/visa" label={t('services.visa.title')} />
                            <FooterLink to="/services/connectivity" label={t('services.connectivity.title')} />
                            <FooterLink to="/services/creative" label={t('services.creative.title')} />
                        </ul>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('shop')}</h3>
                        <ul className="space-y-3 mt-4 text-sm">
                            <FooterLink to="/shop" label={t('shop.view_all_products')} />
                            <FooterLink to="/shop?category=souvenir" label={t('shop.category.souvenir')} />
                            <FooterLink to="/shop?category=textile" label={t('shop.category.textile')} />
                            <FooterLink to="/shop?category=food" label={t('shop.category.food')} />
                            <FooterLink to="/shop?category=jewelry" label={t('shop.category.jewelry')} />
                            <FooterLink to="/shop?category=art" label={t('shop.category.art')} />
                        </ul>
                    </div>

                    {/* Need help? */}
                    <div>
                        <h3 className="text-white font-semibold mb-6 tracking-wide">{t('footer.help')}</h3>
                        <ul className="space-y-3 mt-4 text-sm mb-8">
                            <FooterLink to="/help" label={t('footer.faqs')} />
                            <FooterLink to="/privacy" label={t('footer.privacy')} />
                            <FooterLink to="/terms" label={t('footer.terms')} />
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
                        <span className="border border-slate-700 px-2 py-1 rounded text-xs">VISA</span>
                        <span className="border border-slate-700 px-2 py-1 rounded text-xs">Mastercard</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
