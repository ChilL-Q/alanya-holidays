import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, ServiceData } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Trash2, Plus, X, Edit2 } from 'lucide-react';
import { PhotoUploader } from '../../components/ui/PhotoUploader';
import toast from 'react-hot-toast';

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
    const [featuresText, setFeaturesText] = useState('');
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
                        setFeaturesText(JSON.stringify(merged.features || {}, null, 2));
                        // Also set upload files if any? (Not easily done as they are files not URLs yet in the edit... wait. 
                        // The edit stores URLs if they were uploaded. 
                        // Hosts upload images first, then submit URL. So logic matches.)
                    } else {
                        toast.error("Edit not found");
                        setService(data);
                        setFeaturesText(JSON.stringify(data.features || {}, null, 2));
                    }
                } else {
                    setService(data);
                    setFeaturesText(JSON.stringify(data.features || {}, null, 2));
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
            // Parse features JSON
            let parsedFeatures = {};
            try {
                parsedFeatures = JSON.parse(featuresText);
            } catch (e) {
                toast.error('Invalid JSON in Features field');
                setSaving(false);
                return;
            }

            // Upload new files
            const newImageUrls = [...(service.images || [])];
            for (const file of uploadFiles) {
                try {
                    const url = await db.uploadImage(file, 'services');
                    newImageUrls.push(url);
                } catch (err) {
                    // console.log("Service bucket failed, trying property bucket");
                    const url = await db.uploadImage(file, 'properties'); // Fallback
                    newImageUrls.push(url);
                }
            }

            const updates: Partial<ServiceData> = {
                title: service.title,
                description: service.description,
                price: parseFloat(service.price?.toString() || '0'),
                type: service.type,
                features: parsedFeatures,
                images: newImageUrls,
                provider_id: service.provider_id
            };

            if (editId) {
                // Update service and delete the edit request
                await db.updateService(id, updates);
                await db.deleteServiceEdit(editId);
                toast.success('Update approved and applied');
            } else {
                await db.updateService(id, updates);
                toast.success('Service updated successfully');
            }

            navigate('/admin');
        } catch (error) {
            console.error('Failed to update service', error);
            toast.error('Error updating service');
        } finally {
            setSaving(false);
        }
    };

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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
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

                    {/* Features JSON */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Features (JSON)</label>
                            <span className="text-xs text-slate-500">Edit raw JSON for features</span>
                        </div>
                        <textarea
                            value={featuresText}
                            onChange={e => setFeaturesText(e.target.value)}
                            rows={8}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-300 font-mono text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
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
