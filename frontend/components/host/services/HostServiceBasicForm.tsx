import React from 'react';

interface HostServiceBasicFormProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const HostServiceBasicForm: React.FC<HostServiceBasicFormProps> = ({ formData, setFormData }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                <input 
                    name="title" 
                    value={formData.title || ''} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white" 
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea 
                    name="description" 
                    value={formData.description || ''} 
                    onChange={handleChange} 
                    required 
                    rows={4} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white resize-none" 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Price (€)</label>
                <input 
                    name="price" 
                    type="number" 
                    value={formData.price || ''} 
                    onChange={handleChange} 
                    onWheel={(e) => e.currentTarget.blur()} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white" 
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                <select 
                    name="type" 
                    value={formData.type || 'car'} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                >
                    <option value="car">Car Rental</option>
                    <option value="bike">Bike Rental</option>
                    <option value="transfer">Transfer Service</option>
                    <option value="tour">Tour & Adventure</option>
                    <option value="wellness">Wellness</option>
                </select>
            </div>
        </div>
    );
};
