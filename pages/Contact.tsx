import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { messagesService } from '../api-services/api/misc';
import { db } from '../api-services';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/seo/SEOHead';

export const Contact: React.FC = () => {
    return (
        <>
            <SEOHead
                title="Contact Us"
                description="Get in touch with Alanya Holidays support. We're here to help with bookings, inquiries, and any questions about your vacation in Turkey."
                type="website"
                keywords={['contact Alanya Holidays', 'support', 'customer service', 'Turkey']}
            />
            <div className="pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">Contact Us</h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We're here to help with any questions about your booking or our services.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm text-center transform hover:scale-105 transition-all">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-teal-600 dark:text-cyan-400 dark:text-slate-200 mb-6 mx-auto">
                            <Phone size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Phone</h3>
                        <p className="text-slate-600 dark:text-slate-400">+14389294208</p>
                        <p className="text-sm text-slate-500 mt-1">Mon-Sun 9:00-22:00</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm text-center transform hover:scale-105 transition-all">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-teal-600 dark:text-cyan-400 dark:text-slate-200 mb-6 mx-auto">
                            <Mail size={24} />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Email Us</h3>
                        <p className="text-slate-600 dark:text-slate-400">contact@alanyaholidays.com</p>
                        <p className="text-sm text-slate-500 mt-1">Response within 24h</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-sm text-center transform hover:scale-105 transition-all">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-teal-600 dark:text-cyan-400 dark:text-slate-200 mb-6 mx-auto">
                            <MapPin size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Office</h3>
                        <p className="text-slate-600 dark:text-slate-400">Kesefli Mah. Alanya, Turkiye</p>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800/80 rounded-3xl p-8 md:p-12 shadow-lg border border-slate-100 dark:border-slate-800/50">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">Send us a Message</h2>
                    <ContactForm />
                </div>
            </div>
        </div>
        </>
    );
};

const ContactForm: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const serviceId = searchParams.get('service');
    const category = searchParams.get('category');

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    React.useEffect(() => {
        // Pre-fill user data if available
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }

        const prefillSubject = async () => {
            if (serviceId) {
                try {
                    const service = await db.getService(serviceId);
                    if (service) {
                        setFormData(prev => ({ ...prev, subject: `Inquiry: ${service.title}` }));
                    }
                } catch (e) {
                    console.error('Failed to pre-fill service', e);
                }
            } else if (category) {
                setFormData(prev => ({ ...prev, subject: `Inquiry: ${category.charAt(0).toUpperCase() + category.slice(1)} Services` }));
            }
        };
        prefillSubject();
    }, [serviceId, category, user]);

    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            // @ts-ignore - sendMessage in misc.ts definitely takes 1 arg
            await messagesService.sendMessage(formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="text-center py-12 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-slate-600">We'll get back to you shortly.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 text-teal-600 dark:text-cyan-400 font-medium hover:text-teal-700 dark:text-cyan-400 "
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                    <input
                        required
                        readOnly={!!user}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/50 outline-none transition-all ${user
                            ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed text-slate-500'
                            : 'bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500'
                            }`}
                        value={formData.name}
                        onChange={e => !user && setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                    <input
                        required
                        type="email"
                        readOnly={!!user}
                        className={`w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/50 outline-none transition-all ${user
                            ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed text-slate-500'
                            : 'bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500'
                            }`}
                        value={formData.email}
                        onChange={e => !user && setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                <input
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="What is this about?"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Your message here..."
                />
            </div>
            <button
                disabled={status === 'loading'}
                className="w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
            </button>
        </form>
    );
};
