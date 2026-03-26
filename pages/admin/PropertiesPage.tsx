import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

import { PropertyToolbar } from '../../components/admin/property/PropertyToolbar';
import { PropertyTable } from '../../components/admin/property/PropertyTable';

export const PropertiesPage: React.FC = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

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
            const { data } = await db.getAdminProperties('all', 1, 100);
            setProperties(data || []);
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
            if (type === 'approve') await db.approveProperty(itemId.toString());
            if (type === 'delete') await db.deleteProperty(itemId.toString(), reason);
            if (type === 'reject') await db.updatePropertyStatus(itemId.toString(), 'rejected', reason);

            loadProperties();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (e: any) {
            console.error(e);
            alert(`Failed to ${type} property: ${e.message || 'Unknown error'}`);
        }
    };

    const filteredProperties = properties.filter(p => {
        const matchesStatus = filterStatus === 'all' ? p.status !== 'rejected' : p.status === filterStatus;
        const matchesSearch =
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PropertyToolbar
                filterStatus={filterStatus}
                onFilterStatus={setFilterStatus}
                searchQuery={searchQuery}
                onSearchQuery={setSearchQuery}
            />

            <PropertyTable
                loading={loading}
                properties={filteredProperties}
                onView={(id) => navigate(`/property/${id}`)}
                onEdit={(id) => navigate(`/admin/edit-property/${id}`)}
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
                confirmLabel={modalConfig.type === 'delete' ? 'Delete' : (modalConfig.type === 'reject' ? 'Reject' : 'Approve')}
                reasonPlaceholder={modalConfig.type === 'reject' ? "Reason for rejection..." : "Why are you deleting this property?"}
            />
        </div>
    );
};
