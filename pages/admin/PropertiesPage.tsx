import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Search, MapPin, Edit2, CheckCircle, Trash2, Home, ExternalLink, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const PropertiesPage: React.FC = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'approve' | 'delete' | 'reject' | null;
        itemId: number | null;
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
        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            const data = await db.getAdminProperties() || [];
            setProperties(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (action: 'approve' | 'delete' | 'reject', id: number, title: string) => {
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
            config.title = 'Approve Property';
            config.message = `Are you sure you want to approve "${title}"? This will make it live.`;
            config.isDestructive = false;
        } else if (action === 'delete') {
            config.title = 'Delete Property';
            config.message = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
            config.requireReason = true;
            config.isDestructive = true;
        } else if (action === 'reject') {
            config.title = 'Reject Property';
            config.message = `Are you sure you want to reject "${title}"? The host will be notified to make changes.`;
            config.requireReason = true;
            config.isDestructive = true;
        }

        setModalConfig(config);
    };

    const handleConfirmAction = async (reason?: string) => {
        const { type, itemId } = modalConfig;
        if (!type || !itemId) return;

        try {
            if (type === 'approve') await db.approveProperty(itemId);
            if (type === 'delete') await db.deleteProperty(itemId, reason);
            if (type === 'reject') await db.updatePropertyStatus(itemId.toString(), 'rejected', reason);

            // Refresh
            loadProperties();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: any) {
            console.error(e);
            alert(`Failed to ${type} property: ${e.message || 'Unknown error'}`);
        }
    };

    const filteredProperties = properties.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesSearch =
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
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
                        placeholder="Search properties..."
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
                                <th className="p-4">Property</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">Loading properties...</td>
                                </tr>
                            ) : filteredProperties.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">No properties found.</td>
                                </tr>
                            ) : (
                                filteredProperties.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden">
                                                {p.images && p.images[0] ? (
                                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Home size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{p.title}</div>
                                            <div className="text-xs text-slate-500">{p.type}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} />
                                                <span className="truncate max-w-[150px]">{p.location}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                                            €{p.price}/night
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                p.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/property/${p.id}`)}
                                                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="View Public Page"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/edit-property/${p.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {p.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => openActionModal('approve', p.id, p.title)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openActionModal('reject', p.id, p.title)}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => openActionModal('delete', p.id, p.title)}
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
                confirmLabel={modalConfig.type === 'delete' ? 'Delete' : (modalConfig.type === 'reject' ? 'Reject' : 'Approve')}
                reasonPlaceholder={modalConfig.type === 'reject' ? "Reason for rejection..." : "Why are you deleting this property?"}
            />
        </div>
    );
};
