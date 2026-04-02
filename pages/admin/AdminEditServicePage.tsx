import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, ServiceData } from '../../api-services';
import { supabase } from '../../api-services/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Trash2, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSaveShortcut } from '../../hooks/useSaveShortcut';
import { getAppUrl } from '../../utils/appUrl';

import { ServiceBasicDetailsForm } from '../../components/admin/services/ServiceBasicDetailsForm';
import { ServiceFeaturesForm } from '../../components/admin/services/ServiceFeaturesForm';
import { ServiceMediaForm } from '../../components/admin/services/ServiceMediaForm';

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
                const data = await db.getService(id);
                if (editId) {
                    const edit = await db.getServiceEdit(editId);
                    if (edit) {
                        const merged = { ...data, ...edit.changed_data };
                        setService(merged);
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
            const newImageUrls = [...(service.images || [])];
            for (const file of uploadFiles) {
                try {
                    const url = await db.uploadImage(file, 'services');
                    newImageUrls.push(url);
                } catch {
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
                features: service.features,
                images: newImageUrls,
                provider_id: service.provider_id
            };

            if (editId) {
                await db.updateService(id, updates);
                await db.deleteServiceEdit(editId);
                toast.success('Update approved and applied');

                supabase.functions.invoke('send-email', {
                    body: {
                        type: 'service_updated',
                        userId: service.provider_id,
                        data: {
                            title: service.title,
                            link: getAppUrl(`/service/${id}`)
                        }
                    }
                }).catch(e => console.error('Failed to notify provider', e));

            } else {
                await db.updateService(id, updates);
                toast.success('Service updated successfully');

                if (service.provider_id) {
                    supabase.functions.invoke('send-email', {
                        body: {
                            type: 'service_updated',
                            userId: service.provider_id,
                            data: {
                                title: service.title,
                                link: getAppUrl(`/service/${id}`)
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
        if (reason === null) return;

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

    if (loading) return <div className="p-8 text-center text-slate-500">Loading service data...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Back to Admin
                    </button>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 transition-colors text-sm"
                        >
                            <Trash2 size={18} /> Delete Service
                        </button>

                        {editId && (
                            <button
                                onClick={handleRejectEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-300 transition-colors text-sm"
                            >
                                <X size={18} /> Reject Update
                            </button>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-colors disabled:opacity-50 text-sm ${editId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600'}`}
                        >
                            <Save size={18} /> {saving ? 'Processing...' : (editId ? 'Approve & Apply' : 'Save Changes')}
                        </button>
                    </div>
                </div>

                {editId && (
                    <div className="bg-indigo-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl mb-6 flex items-center gap-3 text-indigo-800 dark:text-slate-200 animate-in fade-in">
                        <div className="p-2 bg-indigo-100 dark:bg-slate-800/50 rounded-lg">
                            <Edit2 size={20} />
                        </div>
                        <div>
                            <p className="font-bold">Reviewing Pending Update</p>
                            <p className="text-sm opacity-80">You are viewing the service with proposed changes applied. Click "Approve & Apply" to make them live.</p>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-8 space-y-8 animate-in fade-in duration-500">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 pb-6">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Service: {service.title}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${service.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            service.status === 'pending' || !service.status ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {service.status || 'pending'}
                        </span>
                    </div>

                    <ServiceBasicDetailsForm service={service} setService={setService} />

                    <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-200 dark:border-slate-800/50">
                        <ServiceFeaturesForm service={service} setService={setService} />
                    </div>

                    <ServiceMediaForm service={service} setService={setService} uploadFiles={uploadFiles} setUploadFiles={setUploadFiles} />
                </div>
            </div>
        </div>
    );
};
