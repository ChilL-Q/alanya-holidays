import React from 'react';

export const Privacy: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">Privacy Policy</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p>Last updated: January 2026</p>
                    <p>
                        At Alanya Holidays, we take your privacy seriously. This Privacy Policy outlines how we collect, use, and protect your personal information.
                    </p>
                    <h3>1. Information We Collect</h3>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support.
                    </p>
                    <h3>2. How We Use Information</h3>
                    <p>
                        We use your information to facilitate bookings, improve our services, and communicate with you about your trip.
                    </p>
                    <h3>3. Data Security</h3>
                    <p>
                        We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or disclosure.
                    </p>
                    <p>
                        For any questions regarding this policy, please contact us at service.dep.hq@gmail.com.
                    </p>
                </div>
            </div>
        </div>
    );
};
