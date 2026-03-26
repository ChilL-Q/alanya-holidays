import React from 'react';
import { Tag, ChevronRight } from 'lucide-react';
import { PhotoUploader } from '../../ui/PhotoUploader';
import { TransportationFields, AdventureFields, HealthCreativeFields } from './ServiceFormFields';
import { useLanguage } from '../../../context/LanguageContext';
import { ServiceCategory } from './AddServiceCategoryStep';

interface AddServiceFormStepProps {
    category: ServiceCategory;
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    files: File[];
    setFiles: (files: File[]) => void;
    itinerary: any[];
    setItinerary: React.Dispatch<React.SetStateAction<any[]>>;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const AddServiceFormStep: React.FC<AddServiceFormStepProps> = ({
    category,
    formData,
    handleChange,
    setFormData,
    files,
    setFiles,
    itinerary,
    setItinerary,
    onSubmit,
    isSubmitting
}) => {
    const { t } = useLanguage();

    const getFormTitle = () => {
        switch (category) {
            case 'transportation': return 'Vehicle Details';
            case 'adventure': return 'Activity Details';
            default: return 'Service Details';
        }
    };

    const getStatusBadgeColor = () => {
        switch (category) {
            case 'transportation': return 'bg-blue-500';
            case 'adventure': return 'bg-orange-500';
            default: return 'bg-rose-500';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {getFormTitle()}
                </h2>
                <span className={`px-3 py-1 text-white rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusBadgeColor()}`}>
                    {category}
                </span>
            </div>

            <form onSubmit={onSubmit} className="p-8 space-y-8">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Service Type</label>
                    <div className="flex flex-wrap gap-3">
                        {category === 'transportation' ? (
                            <>
                                {['car', 'bike', 'transfer'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            type: type as any,
                                            brand: '',
                                            model: ''
                                        })}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${formData.type === type
                                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700/50 dark:text-slate-400'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-medium capitalize"
                            >
                                {category === 'adventure' ? 'Tour / Activity' : 'Wellness Service'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Common Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder={category === 'transportation' ? "e.g. Fiat Egea 2023" : "e.g. Alanya Jeep Safari"}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                        />
                        {category === 'transportation' && formData.modelSelection === 'popular' && (
                            <div className="text-xs text-slate-500 mt-1">Title is auto-generated but can be customized.</div>
                        )}
                    </div>

                    {/* Description Field */}
                    {(category !== 'transportation' || formData.modelSelection === 'custom') ? (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white resize-none"
                            />
                        </div>
                    ) : (
                        <div className="md:col-span-2 p-4 bg-teal-50 dark:bg-slate-800/50 rounded-xl border border-teal-100 dark:border-slate-700/50">
                            <p className="text-sm text-teal-700 dark:text-cyan-400">
                                <span className="font-bold">Description Auto-Generated:</span> We've automatically added a professional description for the {formData.brand} {formData.model} to help your listing stand out.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base Price (€)</label>
                        <input
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            onWheel={(e) => e.currentTarget.blur()}
                            required
                            placeholder="0.00"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                        />
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photos</h3>
                        <p className="text-xs text-slate-500 mb-3">Add at least one photo. First photo will be the cover.</p>
                        <PhotoUploader files={files} onChange={setFiles} maxFiles={5} />
                    </div>

                    <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Availability (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Available From</label>
                                <input
                                    type="date"
                                    name="availableFrom"
                                    value={formData.availableFrom}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Available To</label>
                                <input
                                    type="date"
                                    name="availableTo"
                                    value={formData.availableTo}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-orange-500" />
                            Promotions (Optional)
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-orange-50 dark:bg-slate-800/50 p-4 rounded-xl border border-orange-100 dark:border-slate-700/50">
                                <label className="block text-xs font-bold text-orange-800 dark:text-slate-200 mb-1">Promotion Price (€)</label>
                                <input
                                    type="number"
                                    name="promotionPrice"
                                    value={formData.promotionPrice}
                                    onChange={handleChange}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 rounded-lg border border-orange-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 focus:ring-0 focus:border-orange-500 outline-none font-bold text-lg dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Promotion Description</label>
                                <input
                                    name="promotionDescription"
                                    value={formData.promotionDescription}
                                    onChange={handleChange}
                                    placeholder="e.g. Flash sale!"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/50" />

                {/* Specific Fields */}
                {category === 'transportation' && (
                    <TransportationFields
                        formData={formData}
                        handleChange={handleChange}
                        setFormData={setFormData}
                    />
                )}

                {category === 'adventure' && (
                    <AdventureFields
                        formData={formData}
                        handleChange={handleChange}
                        itinerary={itinerary}
                        setItinerary={setItinerary}
                        setFormData={setFormData}
                    />
                )}

                {(category === 'health' || category === 'creative') && (
                    <HealthCreativeFields
                        formData={formData}
                        handleChange={handleChange}
                        category={category}
                        t={t}
                        setFormData={setFormData}
                    />
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white font-bold py-4 rounded-xl transition-all duration-300 ease-out shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Listing Service...' : 'List Service'}
                    <ChevronRight />
                </button>
            </form>
        </div>
    );
};
