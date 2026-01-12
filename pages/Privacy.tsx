import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { Shield, Lock, Eye, Server, RefreshCw } from 'lucide-react';

export const Privacy: React.FC = () => {
    const sections = [
        { id: 'collection', title: '1. Information We Collect' },
        { id: 'usage', title: '2. How We Use Information' },
        { id: 'sharing', title: '3. Data Sharing' },
        { id: 'security', title: '4. Data Security' },
        { id: 'rights', title: '5. Your Rights' },
        { id: 'cookies', title: '6. Cookies & Tracking' },
    ];

    return (
        <LegalLayout
            title="Privacy Policy"
            lastUpdated="January 14, 2026"
            sections={sections}
        >
            <p className="lead text-xl text-slate-700 dark:text-slate-300 border-l-4 border-accent pl-6 italic mb-12">
                At Alanya Holidays, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how specific data is collected, used, and protected.
            </p>

            <section id="collection" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Eye size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">1. Information We Collect</h2>
                </div>
                <p>We collect information you provide directly to us when you use our services:</p>
                <div className="grid md:grid-cols-2 gap-6 not-prose mt-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Personal Information</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Name, email address, phone number, and government ID (strictly for legal reporting requirements in Turkey).</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Booking Details</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Dates of stay, property preferences, special requests, and companion details.</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Payment Information</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">We do not store credit card details. All payments are processed through secure third-party payment providers (Stripe/Iyzico).</p>
                    </div>
                </div>
            </section>

            <section id="usage" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <RefreshCw size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">2. How We Use Information</h2>
                </div>
                <p>We use your information to provide, analyze, and improve our services.</p>
                <ul className="space-y-2">
                    <li><strong>Service Delivery:</strong> To facilitate bookings, send confirmations, and communicate with you about your trip.</li>
                    <li><strong>Legal Compliance:</strong> To comply with Turkish local laws regarding short-term rentals, specifically the <strong>KBS (Kimlik Bildirim Sistemi)</strong>.</li>
                    <li><strong>Support:</strong> To provide customer service and resolve issues.</li>
                    <li><strong>Marketing:</strong> To send you promotional emails (only if you explicitly opt-in).</li>
                </ul>
            </section>

            <section id="sharing" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Server size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">3. Data Sharing</h2>
                </div>
                <p>We respect your data. We do not sell your personal data to advertisers. We only share information with:</p>
                <ul>
                    <li><strong>Hosts:</strong> Minimal necessary information to coordinate your check-in and stay.</li>
                    <li><strong>Legal Authorities:</strong> As strictly required by Turkish law for guest registration (Jandarma/Police notification systems).</li>
                    <li><strong>Service Providers:</strong> Targeted 3rd parties who help us operate our business (e.g., cloud hosting, email delivery).</li>
                </ul>
            </section>

            <section id="security" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Lock size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">4. Data Security</h2>
                </div>
                <p>
                    We implement industry-standard security measures to protect your personal information against unauthorized access, alteration, or disclosure.
                    Our website uses strong <strong>SSL encryption</strong> for all data transmission. Database access is strictly limited to authorized personnel.
                </p>
            </section>

            <section id="rights" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Shield size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">5. Your Rights</h2>
                </div>
                <p>
                    You have the right to access, correct, or delete your personal information held by us.
                    You may also object to the processing of your data or request data portability.
                </p>
                <div className="bg-accent/10 p-6 rounded-xl border border-accent/20 not-prose">
                    <p className="text-slate-800 dark:text-slate-200 font-medium mb-2">Have a privacy request?</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Contact our Data Protection Officer directly.</p>
                    <a href="mailto:privacy@alanyaholidays.com" className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        privacy@alanyaholidays.com
                    </a>
                </div>
            </section>
        </LegalLayout>
    );
};

