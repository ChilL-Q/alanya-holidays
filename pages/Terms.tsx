import React from 'react';

export const Terms: React.FC = () => {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">Terms of Service</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-500">Last updated: January 2026</p>

                    <p className="lead text-xl text-slate-700 dark:text-slate-300">
                        Please read these Terms of Service carefully before using our platform. By booking with Alanya Holidays, you agree to these terms.
                    </p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By accessing and using Alanya Holidays, you agree to be bound by these Terms of Service and all applicable laws and regulations governing vacation rentals in Turkey.
                    </p>

                    <h3>2. Zero Fees Policy</h3>
                    <p>
                        <strong>For Guests:</strong> We charge 0% service fees. The price you see is the final price for the accommodation, mostly paid on arrival unless otherwise specified.
                    </p>

                    <h3>3. Booking & Cancellations</h3>
                    <ul>
                        <li><strong>Booking Confirmation:</strong> A booking is confirmed once you receive a confirmation email.</li>
                        <li><strong>Cancellation:</strong> Policies vary by property (Flexible, Moderate, or Strict). Please review the specific policy on the property page.</li>
                        <li><strong>Refunds:</strong> Refunds are processed according to the specific cancellation policy of the booked property.</li>
                    </ul>

                    <h3>4. Guest Responsibilities</h3>
                    <p>Users agree to:</p>
                    <ul>
                        <li>Provide accurate information (ID/Passport) for legal registration.</li>
                        <li>Respect the property and neighbors (quiet hours usually 11 PM - 8 AM).</li>
                        <li>Report any damages immediately to the host or our support team.</li>
                    </ul>

                    <h3>5. Liability</h3>
                    <p>
                        Alanya Holidays acts as a platform connecting guests and hosts. We are not liable for direct damages arising from the use of the property, though we will assist in mediating disputes.
                    </p>

                    <h3>6. Governing Law</h3>
                    <p>
                        These terms are governed by the laws of the Republic of Turkey. Any disputes shall be resolved in the courts of Alanya.
                    </p>
                </div>
            </div>
        </div>
    );
};
