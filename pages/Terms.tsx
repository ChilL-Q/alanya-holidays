import React from 'react';

export const Terms: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p>Last updated: January 2026</p>
                    <h3>1. Acceptance of Term</h3>
                    <p>
                        By accessing and using Alanya Holidays, you agree to be bound by these Terms of Service.
                    </p>
                    <h3>2. Booking and Zero Fees</h3>
                    <p>
                        Our platform charges 0% guest service fees. The price you see listed is the price you pay for the accommodation.
                    </p>
                    <h3>3. Cancellation Policy</h3>
                    <p>
                        Cancellation policies vary by property. Please review the specific cancellation policy for your selected property before booking.
                    </p>
                    <h3>4. User Conduct</h3>
                    <p>
                        Users agree to use our platform responsibly and to respect the properties and hosts.
                    </p>
                </div>
            </div>
        </div>
    );
};
