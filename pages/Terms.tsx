import React from 'react';
import { LegalLayout } from '../components/LegalLayout';
import { FileCheck, CreditCard, Ban, Gavel, Scale, AlertCircle } from 'lucide-react';

export const Terms: React.FC = () => {
    const sections = [
        { id: 'acceptance', title: '1. Acceptance of Terms' },
        { id: 'fees', title: '2. Zero Fees Policy' },
        { id: 'bookings', title: '3. Booking & Cancellations' },
        { id: 'responsibilities', title: '4. Guest Responsibilities' },
        { id: 'liability', title: '5. Liability' },
        { id: 'governing', title: '6. Governing Law' },
    ];

    return (
        <LegalLayout
            title="Terms of Service"
            lastUpdated="January 14, 2026"
            sections={sections}
        >
            <p className="lead text-xl text-slate-700 dark:text-slate-300 border-l-4 border-accent pl-6 italic mb-12">
                Please read these Terms of Service carefully using our platform. By booking with Alanya Holidays, you agree to these legal terms.
            </p>

            <section id="acceptance" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <FileCheck size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">1. Acceptance of Terms</h2>
                </div>
                <p>
                    By accessing, browsing, and using Alanya Holidays, you agree to be bound by these Terms of Service and all applicable laws and regulations governing vacation rentals in the Republic of Turkey. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
            </section>

            <section id="fees" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <CreditCard size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">2. Zero Fees Policy</h2>
                </div>
                <p>
                    Alanya Holidays operates on a <strong>Guest-First model</strong>.
                </p>
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-6 rounded-xl not-prose my-6 flex gap-4">
                    <div className="text-green-600 dark:text-green-400 mt-1">
                        <Scale size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">We charge 0% Guest Service Fees</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Unlike other major platforms that charge 15-20% on top of the rental price, the price you see on Alanya Holidays is the host's price. What you see is what you pay.
                        </p>
                    </div>
                </div>
            </section>

            <section id="bookings" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Gavel size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">3. Booking & Cancellations</h2>
                </div>
                <ul className="space-y-4">
                    <li>
                        <strong>Booking Confirmation:</strong> A booking is officially confirmed only once you receive a confirmation email and a valid voucher code.
                    </li>
                    <li>
                        <strong>Cancellation Policies:</strong> Policies vary by property (Flexible, Moderate, or Strict). The specific policy is clearly displayed on each property's page before booking.
                    </li>
                    <li>
                        <strong>Refunds:</strong> Refunds are processed according to the specific cancellation policy of the booked property. Processing times may vary between 5-10 business days depending on your bank.
                    </li>
                </ul>
            </section>

            <section id="responsibilities" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <AlertCircle size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">4. Guest Responsibilities</h2>
                </div>
                <p>Users of our platform agree to:</p>
                <ul>
                    <li>Provide accurate ID/Passport information for legal registration (Police/Jandarma).</li>
                    <li>Respect the property, furniture, and amenities.</li>
                    <li>Adhere to community quiet hours (generally 11 PM - 8 AM).</li>
                    <li>Report any damages immediately to the host or our support team.</li>
                </ul>
            </section>

            <section id="liability" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Ban size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">5. Liability</h2>
                </div>
                <p>
                    Alanya Holidays acts as an intermediary platform connecting guests and hosts. We verify listings for existence and basic standards, but we are not liable for:
                    <ul>
                        <li>Direct damages arising from the use of the property.</li>
                        <li>Personal injuries occurring on the premises.</li>
                        <li>Theft or loss of personal belongings.</li>
                    </ul>
                    However, we will actively assist in mediating disputes and hold a host guarantee fund for extreme cases.
                </p>
            </section>

            <section id="governing" className="scroll-mt-28 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-accent">
                        <Scale size={20} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">6. Governing Law</h2>
                </div>
                <p>
                    These terms are governed by the laws of the Republic of Turkey. Any disputes shall be resolved in the courts of Alanya, Antalya.
                </p>
            </section>
        </LegalLayout>
    );
};

