import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, ServiceData } from '../../api-services';
import { supabase } from '../../api-services/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Trash2, Plus, X, Edit2 } from 'lucide-react';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import toast from 'react-hot-toast';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';

export const AdminEditServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get('editId');
    const { user, isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [service, setService] = useState<Partial<ServiceData>>({});
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchService = async () => {
            if (!id) return;
            try {
                // 1. Fetch original service
                const data = await db.getService(id);

                // 2. If reviewing an edit, fetch and merge changes
                if (editId) {
                    const edit = await db.getServiceEdit(editId);

                    if (edit) {
                        const merged = { ...data, ...edit.changed_data };
                        setService(merged);
                        // Features are now handled directly in service.features
                    } else {
                        toast.error("Edit not found");
                        setService(data);
                    }
                } else {
                    setService(data);
                }
            } catch (error) {
                console.error('Failed to fetch service', error);
                toast.error('Error loading service');
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id, isAuthenticated, user, navigate, editId]);

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            // Upload new files
            const newImageUrls = [...(service.images || [])];
            for (const file of uploadFiles) {
                try {
                    const url = await db.uploadImage(file, 'services');
                    newImageUrls.push(url);
                } catch (err) {
                    const url = await db.uploadImage(file, 'properties'); // Fallback
                    newImageUrls.push(url);
                }
            }

            const updates: Partial<ServiceData> = {
                title: service.title,
                description: service.description,
                price: parseFloat(service.price?.toString() || '0'),
                type: service.type,
                is_promoted: service.is_promoted,
                features: service.features, // Use features directly
                images: newImageUrls,
                provider_id: service.provider_id
            };

            if (editId) {
                // Update service and delete the edit request
                await db.updateService(id, updates);
                await db.deleteServiceEdit(editId);
                toast.success('Update approved and applied');

                // Notify provider about approval/edit integration
                // We reuse service_updated or a new type. 'service_updated' works well.
                supabase.functions.invoke('send-email', {
                    body: {
                        type: 'service_updated',
                        userId: service.provider_id,
                        data: {
                            title: service.title,
                            link: `${window.location.origin}/service/${id}`
                        }
                    }
                }).catch(e => console.error('Failed to notify provider', e));

            } else {
                await db.updateService(id, updates);
                toast.success('Service updated successfully');

                // Notify provider about admin changes
                if (service.provider_id) {
                    supabase.functions.invoke('send-email', {
                        body: {
                            type: 'service_updated',
                            userId: service.provider_id,
                            data: {
                                title: service.title,
                                link: `${window.location.origin}/service/${id}`
                            }
                        }
                    }).catch(e => console.error('Failed to notify provider', e));
                }
            }

            navigate('/admin');
        } catch (error) {
            console.error('Failed to update service', error);
            toast.error('Error updating service');
        } finally {
            setSaving(false);
        }
    };

    useSaveShortcut(handleSave);

    const handleRejectEdit = async () => {
        if (!editId) return;
        if (!confirm('Reject this update request?')) return;
        const reason = prompt("Please provide a reason for rejection:");
        if (reason === null) return; // Cancelled

        try {
            await db.rejectServiceEdit(editId, reason);
            toast.success('Update rejected');
            navigate('/admin');
        } catch (e) {
            console.error(e);
            toast.error('Failed to reject update');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (confirm('Are you sure you want to DELETE this service permanently?')) {
            try {
                await db.deleteService(id);
                navigate('/admin');
            } catch (error) {
                console.error('Failed to delete', error);
                alert('Error deleting service');
            }
        }
    };

    const handleImageAdd = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            setService(prev => ({
                ...prev,
                images: [...(prev.images || []), url]
            }));
        }
    };

    const handleImageRemove = (index: number) => {
        setService(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index)
        }));
    };

    // Helper to update specific feature fields
    const updateFeature = (key: string, value: any) => {
        setService(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [key]: value
            }
        }));
    };

    // Render Features Form based on Type
    const renderFeaturesForm = () => {
        const features = service.features || {};

        // 1. Vehicle Forms (Car, Bike, Transfer)
        if (['car', 'bike', 'transfer'].includes(service.type || '')) {
            return (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b pb-2">Vehicle Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Brand</label>
                            <input
                                type="text"
                                value={features.brand || ''}
                                onChange={e => updateFeature('brand', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Model</label>
                            <input
                                type="text"
                                value={features.model || ''}
                                onChange={e => updateFeature('model', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Year</label>
                            <input
                                type="text"
                                value={features.year || ''}
                                onChange={e => updateFeature('year', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Transmission</label>
                            <select
                                value={features.transmission || ''}
                                onChange={e => updateFeature('transmission', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="">Select...</option>
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Fuel Type</label>
                            <select
                                value={features.fuel || ''}
                                onChange={e => updateFeature('fuel', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="">Select...</option>
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Seats</label>
                            <input
                                type="number"
                                value={features.seats || ''}
                                onChange={e => updateFeature('seats', Number(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // 2. Tours & Adventures
        if (service.type === 'tour') {
            const itinerary = (features.itinerary || []) as any[];

            const addItineraryItem = () => {
                updateFeature('itinerary', [...itinerary, { time: '', description: '' }]);
            };

            const updateItineraryItem = (idx: number, field: string, val: string) => {
                const newItinerary = [...itinerary];
                newItinerary[idx] = { ...newItinerary[idx], [field]: val };
                updateFeature('itinerary', newItinerary);
            };

            const removeItineraryItem = (idx: number) => {
                updateFeature('itinerary', itinerary.filter((_, i) => i !== idx));
            };

            return (
                <div className="space-y-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b pb-2">Tour Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</label>
                            <input
                                type="text"
                                placeholder="e.g. 6 hours"
                                value={features.duration || ''}
                                onChange={e => updateFeature('duration', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Group Size</label>
                            <input
                                type="text"
                                placeholder="e.g. Up to 10 people"
                                value={features.groupSize || ''}
                                onChange={e => updateFeature('groupSize', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
                            <select
                                value={features.difficulty || ''}
                                onChange={e => updateFeature('difficulty', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            >
                                <option value="">Select...</option>
                                <option value="Easy">Easy</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Hard">Hard</option>
                                <option value="Extreme">Extreme</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Languages</label>
                            <input
                                type="text"
                                placeholder="e.g. English, Russian, Turkish"
                                value={features.languages || ''}
                                onChange={e => updateFeature('languages', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Included (comma separated)</label>
                            <textarea
                                rows={2}
                                value={features.included || ''}
                                onChange={e => updateFeature('included', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Requirements / What to bring</label>
                            <textarea
                                rows={2}
                                value={features.requirements || ''}
                                onChange={e => updateFeature('requirements', e.target.value)}
                                className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    {/* Itinerary Builder */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">Itinerary Schedule</h4>
                            <button onClick={addItineraryItem} className="text-sm bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold hover:bg-teal-200 transaction-colors">
                                + Add Step
                            </button>
                        </div>
                        <div className="space-y-3">
                            {itinerary.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        placeholder="Time"
                                        value={item.time || ''}
                                        onChange={e => updateItineraryItem(idx, 'time', e.target.value)}
                                        className="w-24 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description (e.g. Pick up from hotel)"
                                        value={item.description || ''}
                                        onChange={e => updateItineraryItem(idx, 'description', e.target.value)}
                                        className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-sm"
                                    />
                                    <button onClick={() => removeItineraryItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {itinerary.length === 0 && <p className="text-sm text-slate-400 italic text-center py-2">No itinerary steps defined.</p>}
                        </div>
                    </div>
                </div>
            );
        }

        // 3. Fallback / Generic
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b pb-2">Service Details</h3>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Key Features (Generic)</label>
                    <div className="text-xs text-slate-500 mb-2">Since this is a generic type, you can edit raw JSON features below if needed, or we can add specific fields for this type.</div>
                    <textarea
                        value={JSON.stringify(features, null, 2)}
                        onChange={e => {
                            try {
                                setService(prev => ({ ...prev, features: JSON.parse(e.target.value) }));
                            } catch { }
                        }}
                        rows={6}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs"
                    />
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading service data...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Admin
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 transition-colors"
                        >
                            <Trash2 size={18} /> Delete Service
                        </button>

                        {editId && (
                            <button
                                onClick={handleRejectEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                            >
                                <X size={18} /> Reject Update
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-colors disabled:opacity-50 ${editId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 hover:bg-teal-700'
                                }`}
                        >
                            <Save size={18} /> {saving ? 'Processing...' : (editId ? 'Approve & Apply' : 'Save Changes')}
                        </button>
                    </div>
                </div>

                {editId && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl mb-6 flex items-center gap-3 text-indigo-800 dark:text-indigo-200">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                            <Edit2 size={20} />
                        </div>
                        <div>
                            <p className="font-bold">Reviewing Pending Update</p>
                            <p className="text-sm opacity-80">You are viewing the service with proposed changes applied. Click "Approve & Apply" to make them live.</p>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Service: {service.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${service.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            service.status === 'pending' || !service.status ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {service.status || 'pending'}
                        </span>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                            <input
                                type="text"
                                value={service.title || ''}
                                onChange={e => setService({ ...service, title: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                            <select
                                value={service.type || 'car'}
                                onChange={e => setService({ ...service, type: e.target.value as any })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            >
                                <option value="car">Car Rental</option>
                                <option value="bike">Bike/Scooter</option>
                                <option value="transfer">Transfer</option>
                                <option value="tour">Tour</option>
                                <option value="esim">eSIM</option>
                                <option value="visa">Visa Service</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Price (€)</label>
                            <input
                                type="number"
                                value={service.price || 0}
                                onChange={(e) => setService({ ...service, price: Number(e.target.value) })}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Provider ID (UUID)</label>
                            <input
                                type="text"
                                value={service.provider_id || ''}
                                onChange={e => setService({ ...service, provider_id: e.target.value })}
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={service.description || ''}
                            onChange={e => setService({ ...service, description: e.target.value })}
                            rows={4}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>

                    {/* Dynamic Features Form */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                        {renderFeaturesForm()}
                    </div>

                    {/* Images */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Images</label>
                            <button onClick={handleImageAdd} type="button" className="text-sm text-teal-600 font-bold hover:underline flex items-center gap-1">
                                <Plus size={16} /> Add URL
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {service.images?.map((url, idx) => (
                                <div key={idx} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => handleImageRemove(idx)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {(!service.images || service.images.length === 0) && (
                                <p className="col-span-full text-slate-400 text-sm italic">No images added.</p>
                            )}
                        </div>

                        {/* Photo Uploader */}
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload New Photos</h4>
                            <PhotoUploader files={uploadFiles} onChange={setUploadFiles} maxFiles={5} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
