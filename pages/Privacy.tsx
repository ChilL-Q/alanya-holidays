import React from 'react';

export const Privacy: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">Privacy Policy</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-500">Last updated: January 2026</p>
                    <p className="lead text-xl text-slate-700 dark:text-slate-300">
                        At Alanya Holidays, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how specific data is collected, used, and protected.
                    </p>

                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to us:</p>
                    <ul>
                        <li><strong>Personal Information:</strong> Name, email address, phone number, and government ID (for legal reporting requirements in Turkey).</li>
                        <li><strong>Booking Details:</strong> Dates of stay, property preferences, and special requests.</li>
                        <li><strong>Payment Information:</strong> We do not store credit card details. All payments are processed through secure third-party payment providers.</li>
                    </ul>

                    <h3>2. How We Use Information</h3>
                    <p>We use your information to:</p>
                    <ul>
                        <li>Facilitate bookings and communicate with you about your trip.</li>
                        <li>Comply with Turkish local laws regarding short-term rentals (KBS Identification System).</li>
                        <li>Improve our platform and customer service.</li>
                        <li>Send you promotional emails (only if you opt-in).</li>
                    </ul>

                    <h3>3. Data Sharing</h3>
                    <p>
                        We do not sell your personal data. We only share information with:
                        <ul>
                            <li><strong>Hosts:</strong> To coordinate your check-in and stay.</li>
                            <li><strong>Legal Authorities:</strong> As required by Turkish law for guest registration.</li>
                        </ul>
                    </p>

                    <h3>4. Data Security</h3>
                    <p>
                        We implement strict security measures to protect your personal information against unauthorized access, alteration, or disclosure. Our website uses SSL encryption for all data transmission.
                    </p>

                    <h3>5. Your Rights</h3>
                    <p>
                        You have the right to access, correct, or delete your personal information. Please contact us at service.dep.hq@gmail.com for any privacy-related requests.
                    </p>
                </div>
            </div>
        </div>
    );
};
