import React from 'react';

interface ServiceBasicDetailsFormProps {
    service: any;
    setService: React.Dispatch<React.SetStateAction<any>>;
}

export const ServiceBasicDetailsForm: React.FC<ServiceBasicDetailsFormProps> = ({ service, setService }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                    <input
                        type="text"
                        value={service.title || ''}
                        onChange={e => setService({ ...service, title: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <select
                        value={service.type || 'car'}
                        onChange={e => setService({ ...service, type: e.target.value as 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer' | 'wellness' | 'creative' })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                        <option value="car">Car Rental</option>
                        <option value="bike">Bike/Scooter</option>
                        <option value="transfer">Transfer</option>
                        <option value="tour">Tour</option>
                        <option value="esim">eSIM</option>
                        <option value="visa">Residency &amp; Legal Service</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Price (€)</label>
                    <input
                        type="number"
                        value={service.price || 0}
                        onChange={(e) => setService({ ...service, price: Number(e.target.value) })}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Provider ID (UUID)</label>
                    <input
                        type="text"
                        value={service.provider_id || ''}
                        onChange={e => setService({ ...service, provider_id: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-slate-800/50 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <input
                        type="checkbox"
                        id="is_promoted"
                        checked={service.is_promoted || false}
                        onChange={e => setService({ ...service, is_promoted: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor="is_promoted" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Promote this Service
                        <span className="block text-xs font-normal text-slate-500">Service will appear with a badge</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                    value={service.description || ''}
                    onChange={e => setService({ ...service, description: e.target.value })}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
            </div>
        </div>
    );
};
