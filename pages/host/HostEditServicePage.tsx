import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, ServiceData } from '../../api-services';
import { ArrowLeft, CheckCircle2, Save, Trash2 } from 'lucide-react';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import toast from 'react-hot-toast';

import { HostServiceBasicForm } from '../../components/host/services/HostServiceBasicForm';
import { HostServiceFeaturesForm } from '../../components/host/services/HostServiceFeaturesForm';

type ServiceCategory = 'transportation' | 'adventure' | null;

export const HostEditServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [category, setCategory] = useState<ServiceCategory>(null);
    const [originalService, setOriginalService] = useState<ServiceData | null>(null);

    const [formData, setFormData] = useState<any>({
        title: '', description: '', price: '', type: 'car',
        vehicleType: 'sedan', brand: '', model: '', year: new Date().getFullYear().toString(),
        transmission: 'automatic', fuel: 'petrol', seats: '4',
        subcategory: 'water', duration: '', difficulty: 'medium', groupSize: '',
        included: '', languages: '', requirements: '', availableFrom: '', availableTo: ''
    });

    const [files, setFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [itinerary, setItinerary] = useState<any[]>([]);

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                const data = await db.getService(id);
                setOriginalService(data);

                const features = data.features || {};
                const cat: ServiceCategory = ['car', 'bike', 'transfer'].includes(data.type) ? 'transportation' : 'adventure';
                
                setCategory(cat);
                setExistingImages(data.images || []);

                setFormData({
                    title: data.title, description: data.description, price: data.price.toString(), type: data.type,
                    vehicleType: features.vehicleType || 'sedan', brand: features.brand || '', model: features.model || '',
                    year: features.year || new Date().getFullYear().toString(), transmission: features.transmission || 'automatic',
                    fuel: features.fuel || 'petrol', seats: features.seats?.toString() || '4',
                    subcategory: features.subcategory || 'water', duration: features.duration || '',
                    difficulty: features.difficulty || 'medium', groupSize: features.groupSize || '',
                    included: features.included || '', languages: features.languages || '', requirements: features.requirements || '',
                    availableFrom: features.availableFrom || '', availableTo: features.availableTo || '',
                });

                setItinerary(features.itinerary || [{ time: '09:00', description: 'Start' }]);
            } catch (err) {
                toast.error("Failed to load service");
                navigate('/host/services');
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id, navigate]);

    useEffect(() => {
        setCategory(['car', 'bike', 'transfer'].includes(formData.type) ? 'transportation' : 'adventure');
    }, [formData.type]);

    const handleRemoveExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || !id) return;

        setSubmitting(true);
        try {
            const uploadedUrls = [];
            for (const file of files) {
                uploadedUrls.push(await db.uploadImage(file, 'services'));
            }
            const finalImages = [...existingImages, ...uploadedUrls];

            let features: any = {};
            if (category === 'transportation') {
                features = {
                    vehicleType: formData.vehicleType, brand: formData.brand, model: formData.model,
                    year: formData.year, transmission: formData.transmission, fuel: formData.fuel, seats: formData.seats
                };
            } else {
                features = {
                    subcategory: formData.subcategory, duration: formData.duration, difficulty: formData.difficulty,
                    groupSize: formData.groupSize, included: formData.included, languages: formData.languages,
                    requirements: formData.requirements, itinerary: itinerary.filter(i => i.description)
                };
            }

            if (formData.availableFrom) features.availableFrom = formData.availableFrom;
            if (formData.availableTo) features.availableTo = formData.availableTo;

            const updates: Partial<ServiceData> = {
                title: formData.title, description: formData.description, price: Number(formData.price),
                type: formData.type, features, images: finalImages
            };

            const needsApproval =
                formData.title !== originalService?.title ||
                formData.type !== originalService?.type ||
                finalImages.length !== (originalService?.images?.length || 0) ||
                !finalImages.every((img, i) => img === originalService?.images?.[i]);

            if (needsApproval) {
                await db.requestServiceUpdate(id, updates);
                setSuccess(true);
            } else {
                await db.updateService(id, updates);
                toast.success('Service updated successfully');
                navigate('/host/services');
            }
        } catch (error) {
            toast.error('Failed to submit changes');
        } finally {
            setSubmitting(false);
        }
    };

    useSaveShortcut(handleSubmit);

    if (loading) return <div className="min-h-screen pt-32 text-center">Loading...</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-20 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-slate-800/80 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800/50 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Changes Submitted</h2>
                    <p className="text-slate-500 mb-8">Sent for Admin approval. Live version remains unchanged until accepted.</p>
                    <button onClick={() => navigate('/host/services')} className="w-full bg-slate-900 text-white font-semibold py-3 flex justify-center rounded-xl">Back to My Services</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/host/services')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800/90 rounded-full">
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Service</h1>
                        <p className="text-slate-500">{originalService?.title}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        
                        <HostServiceBasicForm formData={formData} setFormData={setFormData} />

                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photos</h3>
                            {existingImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    {existingImages.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => handleRemoveExistingImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <PhotoUploader files={files} onChange={setFiles} maxFiles={5} />
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800/50" />
                        
                        <HostServiceFeaturesForm 
                            formData={formData} 
                            setFormData={setFormData}
                            category={category}
                            itinerary={itinerary}
                            setItinerary={setItinerary}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                        >
                            {submitting ? 'Saving...' : 'Submit Changes'}
                            <Save />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
