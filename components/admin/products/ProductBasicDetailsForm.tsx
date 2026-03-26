import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface ProductBasicDetailsFormProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ProductBasicDetailsForm: React.FC<ProductBasicDetailsFormProps> = ({ formData, handleChange }) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <ShoppingBag size={20} className="text-teal-500 dark:text-cyan-400 " />
                Product Details
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                        placeholder="Product Name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                        placeholder="Describe the product..."
                    />
                </div>
            </div>
        </div>
    );
};
