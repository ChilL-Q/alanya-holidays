import React from 'react';
import { Edit2, CheckCircle, Trash2, Car, Map, Smartphone, CreditCard, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceTableProps {
    loading: boolean;
    services: any[];
    pendingEdits: any[];
    filterStatus: string;
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    onAction: (action: 'approve' | 'reject' | 'delete', id: string, title: string) => void;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
    loading, services, pendingEdits, filterStatus, selectedIds, toggleSelect, toggleSelectAll, onAction
}) => {
    const navigate = useNavigate();
    const pendingEditServiceIds = new Set(pendingEdits.map((e: any) => e.service_id));
    const getPendingEditId = (serviceId: string) => pendingEdits.find((e: any) => e.service_id === serviceId)?.id;

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
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4 pl-6 w-10">
                                <input
                                    type="checkbox"
                                    checked={services.length > 0 && selectedIds.size === services.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="p-4 pl-6 w-20">Image</th>
                            <th className="p-4">Service</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Provider</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400">Loading services...</td>
                            </tr>
                        ) : filterStatus === 'updates' ? (
                            pendingEdits.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No pending updates.</td></tr>
                            ) : (
                                pendingEdits.map((edit) => (
                                    <tr key={edit.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Edit2 size={20} />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{edit.service?.title}</div>
                                            <div className="text-xs text-slate-500">Requested: {new Date(edit.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4"><span className="text-sm dark:text-slate-300">Update Request</span></td>
                                        <td className="p-4 dark:text-slate-300">-</td>
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
                        ) : services.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-400">No services found.</td>
                            </tr>
                        ) : (
                            services.map((s) => (
                                <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors group ${selectedIds.has(s.id) ? 'bg-indigo-50/50 dark:bg-slate-800/50' : ''}`}>
                                    <td className="p-4 pl-6">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(s.id)}
                                            onChange={() => toggleSelect(s.id)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="p-4 pl-6">
                                        <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-800/50 overflow-hidden">
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
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-slate-800/50 dark:text-slate-200">
                                                    Update Pending
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1 rounded bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
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
                                            s.status === 'pending' || !s.status ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ' :
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
                                                        onClick={() => onAction('approve', s.id, s.title)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onAction('reject', s.id, s.title)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => onAction('delete', s.id, s.title)}
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
    );
};
