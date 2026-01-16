import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Search, Edit2, CheckCircle, Trash2, Home, Car, Map, Smartphone, CreditCard, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const ServicesPage: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<any[]>([]);
    const [pendingEdits, setPendingEdits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | 'delete' | null;
        itemId: string | null;
        title: string;
        message: string;
        requireReason: boolean;
        isDestructive: boolean;
    }>({
        isOpen: false,
        type: null,
        itemId: null,
        title: '',
        message: '',
        requireReason: false,
        isDestructive: false
    });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const [servicesData, editsData] = await Promise.all([
                db.getAdminServices(),
                db.getPendingServiceEdits()
            ]);
            setServices(servicesData || []);
            setPendingEdits(editsData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const pendingEditServiceIds = new Set(pendingEdits.map((e: any) => e.service_id));
    const getPendingEditId = (serviceId: string) => pendingEdits.find((e: any) => e.service_id === serviceId)?.id;

    const openActionModal = (action: 'approve' | 'reject' | 'delete', id: string, title: string) => {
        const config = {
            isOpen: true,
            type: action,
            itemId: id,
            title: '',
            message: '',
            requireReason: false,
            isDestructive: false
        };

        if (action === 'approve') {
            config.title = 'Approve Service';
            config.message = `Are you sure you want to approve "${title}"? This will make it live.`;
            config.isDestructive = false;
        } else if (action === 'reject') {
            config.title = 'Reject Service';
            config.message = `Are you sure you want to reject "${title}"?`;
            config.requireReason = true;
            config.isDestructive = true;
        } else if (action === 'delete') {
            config.title = 'Delete Service';
            config.message = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
            config.requireReason = true;
            config.isDestructive = true;
        }

        setModalConfig(config);
    };

    const handleConfirmAction = async (reason?: string) => {
        const { type, itemId } = modalConfig;
        if (!type || !itemId) return;

        try {
            if (type === 'approve') await db.approveService(itemId);
            if (type === 'reject') {
                await db.updateServiceStatus(itemId, 'rejected', reason);
            }
            if (type === 'delete') {
                await db.deleteService(itemId, reason);
            }

            // Refresh
            loadServices();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: any) {
            console.error(e);
            alert(`Failed to ${type} service: ${e.message || 'Unknown error'}`);
        }
    };

    const filteredServices = services.filter(s => {
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus || (!s.status && filterStatus === 'pending'); // Handle undefined as pending if needed
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'car': return <Car size={18} />;
            case 'tour': return <Map size={18} />;
            case 'esim': return <Smartphone size={18} />;
            case 'visa': return <CreditCard size={18} />;
            default: return <Car size={18} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                    {['all', 'pending', 'updates', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4 pl-6 w-20">Image</th>
                                <th className="p-4">Service</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Provider</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading services...</td>
                                </tr>
                            ) : filterStatus === 'updates' ? (
                                pendingEdits.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-slate-400">No pending updates.</td></tr>
                                ) : (
                                    pendingEdits.map((edit) => (
                                        <tr key={edit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                    <Edit2 size={20} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{edit.service?.title}</div>
                                                <div className="text-xs text-slate-500">Requested: {new Date(edit.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-4"><span className="text-sm">Update Request</span></td>
                                            <td className="p-4">-</td>
                                            <td className="p-4 text-sm text-slate-500">{edit.service?.provider?.full_name}</td>
                                            <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">Review Needed</span></td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/edit-service/${edit.service_id}?editId=${edit.id}`)}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">No services found.</td>
                                </tr>
                            ) : (
                                filteredServices.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden">
                                                {s.images && s.images[0] ? (
                                                    <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Car size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{s.title}</div>
                                            <div className="text-xs text-slate-500 max-w-[200px] truncate">{s.description}</div>
                                            {pendingEditServiceIds.has(s.id) && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                                                        Update Pending
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                    {getServiceIcon(s.type)}
                                                </span>
                                                <span className="capitalize text-sm text-slate-600 dark:text-slate-300">{s.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            €{s.price}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {s.provider?.full_name || 'Unknown'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                s.status === 'pending' || !s.status ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {(s.status || 'pending').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/edit-service/${s.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {pendingEditServiceIds.has(s.id) && (
                                                    <button
                                                        onClick={() => navigate(`/admin/edit-service/${s.id}?editId=${getPendingEditId(s.id)}`)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                        title="Review Update"
                                                    >
                                                        <Edit2 size={16} className="fill-indigo-600" />
                                                    </button>
                                                )}
                                                {(s.status === 'pending' || !s.status) && (
                                                    <>
                                                        <button
                                                            onClick={() => openActionModal('approve', s.id, s.title)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal('reject', s.id, s.title)}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => openActionModal('delete', s.id, s.title)}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={modalConfig.title}
                message={modalConfig.message}
                requireReason={modalConfig.requireReason}
                isDestructive={modalConfig.isDestructive}
                confirmLabel={modalConfig.type === 'delete' ? 'Delete' : modalConfig.type === 'reject' ? 'Reject' : 'Approve'}
                reasonPlaceholder={modalConfig.type === 'delete' ? 'Why are you deleting this service?' : 'Why are you rejecting this service?'}
            />
        </div>
    );
};
