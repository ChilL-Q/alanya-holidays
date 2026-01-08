import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Youtube, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    const { t } = useLanguage();

    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* 1. Brand & Socials */}
                    <div>
                        <Link to="/" className="flex items-center gap-2 group mb-6">
                            <img src="/logo.png" alt="Alanya Holidays" className="w-10 h-10 object-contain rounded-full bg-white/10 p-0.5" />
                            <span className="font-serif text-2xl text-white tracking-tight">
                                Alanya<span className="text-accent group-hover:text-accent-hover transition-colors">Holidays</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Ethical vacation rental platform offering 0% guest fees and authentic Turkish hospitality.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-accent hover:text-white transition-colors">
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>

                    {/* 2. Company */}
                    <div>
                        <h3 className="text-accent font-semibold mb-6">{t('footer.company')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/about" className="hover:text-accent transition-colors">{t('footer.about')}</Link></li>
                            <li><Link to="/" className="hover:text-accent transition-colors">{t('footer.rentals')}</Link></li>
                            <li><Link to="/experiences" className="hover:text-accent transition-colors">{t('footer.experiences')}</Link></li>
                            <li><Link to="/contact" className="hover:text-accent transition-colors">{t('footer.contact')}</Link></li>
                        </ul>
                    </div>

                    {/* 3. Services */}
                    <div>
                        <h3 className="text-accent font-semibold mb-6">{t('footer.services_title')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/services" className="hover:text-accent transition-colors">{t('footer.tours')}</Link></li>
                            <li><Link to="/services" className="hover:text-accent transition-colors">{t('footer.cars')}</Link></li>
                            <li><Link to="/services" className="hover:text-accent transition-colors">{t('footer.visa')}</Link></li>
                            <li><Link to="/services" className="hover:text-accent transition-colors">{t('footer.sim')}</Link></li>
                        </ul>
                    </div>

                    {/* 4. Support & Contact Info */}
                    <div>
                        <h3 className="text-accent font-semibold mb-6">{t('footer.help')}</h3>
                        <ul className="space-y-3 text-sm mb-6">
                            <li><Link to="/help" className="hover:text-accent transition-colors">{t('footer.faqs')}</Link></li>
                            <li><Link to="/privacy" className="hover:text-accent transition-colors">{t('footer.privacy')}</Link></li>
                            <li><Link to="/terms" className="hover:text-accent transition-colors">{t('footer.terms')}</Link></li>
                        </ul>

                        <div className="space-y-3 pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <Mail size={16} className="text-accent" />
                                <span>service.dep.hq@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <Phone size={16} className="text-accent" />
                                <span>+14389294208</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-slate-400">
                                <MapPin size={16} className="text-accent mt-1" />
                                <span>Kesefli Mah. Alanya, Turkiye</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>{t('footer.copyright')}</p>
                    <p>Designed by GR Rocky</p>
                </div>
            </div>
        </footer>
    );
};
