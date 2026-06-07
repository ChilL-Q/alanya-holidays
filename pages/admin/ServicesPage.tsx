import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Trash2 } from 'lucide-react';
import { ServiceToolbar } from '../../components/admin/services/ServiceToolbar';
import { ServiceTable } from '../../components/admin/services/ServiceTable';
import { toast } from 'react-hot-toast';

interface AdminServicesPageProps {
    type?: 'fleet' | 'services';
}

const MODAL_META: Record<string, { label: string; placeholder: string }> = {
    delete:      { label: 'Delete', placeholder: 'Why are you deleting this service?' },
    bulk_delete: { label: 'Delete', placeholder: 'Why are you deleting these services?' },
    reject:      { label: 'Reject', placeholder: 'Why are you rejecting this service?' },
    bulk_reject: { label: 'Reject', placeholder: 'Why are you rejecting these services?' },
};

export const ServicesPage: React.FC<AdminServicesPageProps> = ({ type }) => {
    const [services, setServices] = useState<any[]>([]);
    const [pendingEdits, setPendingEdits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | 'delete' | 'bulk_delete' | 'bulk_reject' | null;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentional mount-only load; admin page requires auth, user won't change

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredServices.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredServices.map(s => s.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const executeBulk = async (
        fns: Array<() => Promise<unknown>>,
        successMsg: string,
        failLabel: string,
    ) => {
        const results = await Promise.allSettled(fns.map(fn => fn()));
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            toast.error(`Failed to ${failLabel} ${failed} service${failed > 1 ? 's' : ''}`);
        } else {
            toast.success(successMsg);
        }
        loadServices();
        setSelectedIds(new Set());
    };

    const bulkApprove = () => {
        const fns = Array.from(selectedIds).map(id => () => db.approveService(id));
        executeBulk(fns, `${selectedIds.size} service${selectedIds.size > 1 ? 's' : ''} approved`, 'approve');
    };

    const handleBulkAction = (action: 'approve' | 'reject' | 'delete') => {
        if (selectedIds.size === 0) return;

        if (action === 'approve') {
            bulkApprove();
            return;
        }

        const isBulkDelete = action === 'delete';
        setModalConfig({
            isOpen: true,
            type: isBulkDelete ? 'bulk_delete' : 'bulk_reject',
            itemId: null,
            title: isBulkDelete ? `Delete ${selectedIds.size} Services` : `Reject ${selectedIds.size} Services`,
            message: isBulkDelete
                ? `Are you sure you want to delete ${selectedIds.size} services? This cannot be undone.`
                : `Are you sure you want to reject ${selectedIds.size} services?`,
            requireReason: true,
            isDestructive: true,
        });
    };

    const loadServices = async () => {
        try {
            const FLEET_TYPES = ['car', 'bike', 'transfer'];
            const SERVICE_TYPES = ['tour', 'wellness', 'creative', 'visa', 'esim'];

            let typesToFilter: string[] = [];
            if (type === 'fleet') typesToFilter = FLEET_TYPES;
            if (type === 'services') typesToFilter = SERVICE_TYPES;

            const [{ data: servicesData }, editsData] = await Promise.all([
                db.getAdminServices('all', typesToFilter, 1, 100),
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
        if (!type) return;

        try {
            if (type === 'bulk_delete') {
                const fns = Array.from(selectedIds).map(id => () => db.deleteService(id, reason));
                await executeBulk(fns, 'Services deleted', 'delete');
            } else if (type === 'bulk_reject') {
                const fns = Array.from(selectedIds).map(id => () => db.updateServiceStatus(id, 'rejected', reason));
                await executeBulk(fns, 'Services rejected', 'reject');
            } else {
                if (!itemId) return;
                if (type === 'approve') await db.approveService(itemId);
                if (type === 'reject') await db.updateServiceStatus(itemId, 'rejected', reason);
                if (type === 'delete') await db.deleteService(itemId, reason);
                loadServices();
            }

            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: unknown) {
            console.error(e);
            toast.error(`Failed to ${type.replace('bulk_', '')} service: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    const filteredServices = services.filter(s => {
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus || (!s.status && filterStatus === 'pending');
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <ServiceToolbar
                filterStatus={filterStatus}
                onFilterStatus={setFilterStatus}
                searchQuery={searchQuery}
                onSearchQuery={setSearchQuery}
            />

            {selectedIds.size > 0 && (
                <div className="bg-indigo-50 dark:bg-slate-800/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium text-indigo-900 dark:text-slate-200">
                        {selectedIds.size} service{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkAction('approve')}
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 transition"
                        >
                            Approve Selected
                        </button>
                        <button
                            onClick={() => handleBulkAction('reject')}
                            className="px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 transition"
                        >
                            Reject Selected
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>
            )}

            <ServiceTable
                loading={loading}
                services={filteredServices}
                pendingEdits={pendingEdits}
                filterStatus={filterStatus}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                toggleSelectAll={toggleSelectAll}
                onAction={openActionModal}
            />

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={modalConfig.title}
                message={modalConfig.message}
                requireReason={modalConfig.requireReason}
                isDestructive={modalConfig.isDestructive}
                confirmLabel={MODAL_META[modalConfig.type ?? '']?.label ?? 'Approve'}
                reasonPlaceholder={MODAL_META[modalConfig.type ?? '']?.placeholder}
            />
        </div>
    );
};
