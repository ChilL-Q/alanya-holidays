import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { Car, Bike, FileText, Wifi, Map } from 'lucide-react';

export const AddService: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        type: 'car' as const,
        features: '' // Will parse to JSON
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            await db.createService({
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                type: formData.type,
                provider_id: user.id,
                features: { note: formData.features }, // Simple storage for now
                images: []
            });
            setSuccess(true);
            setFormData({ title: '', description: '', price: '', type: 'car', features: '' });
        } catch (error) {
            console.error(error);
            alert('Error adding service');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Add New Service</h1>
                <p className="text-slate-500 mb-8">List a car, bike, visa service, or tour.</p>

                {success && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
                        Service added successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Service Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['car', 'bike', 'visa', 'esim', 'tour', 'transfer'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type as any })}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === type
                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <span className="capitalize">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Fiat 500 Automatic"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price</label>
                            <input
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                placeholder="0.00"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            {/* Placeholder for future expansion */}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Features (Optional Note)</label>
                        <input
                            name="features"
                            value={formData.features}
                            onChange={handleChange}
                            placeholder="e.g. Automatic, Diesel, 5 Seats"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-500/30 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Create Service'}
                    </button>
                </form>
            </div>
        </div>
    );
};
