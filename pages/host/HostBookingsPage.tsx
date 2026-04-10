import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../../api-services';
import { useAuth } from '../../context/AuthContext';
import { HostBookingToolbar } from '../../components/host/bookings/HostBookingToolbar';
import { HostBookingTable } from '../../components/host/bookings/HostBookingTable';
import { HostBookingDetailsModal } from '../../components/host/bookings/HostBookingDetailsModal';
import { toast } from 'react-hot-toast';

export const HostBookingsPage: React.FC = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadBookings = useCallback(async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const myBookings = await db.getBookingsForHost(user.id);
            setBookings(myBookings || []);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        if (confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
            try {
                await db.updateBookingStatus(id, newStatus);
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
                if (selectedBooking?.id === id) {
                    setSelectedBooking((prev: any) => ({ ...prev, status: newStatus }));
                }
            } catch (error) {
                toast.error('Failed to update booking status');
                console.error(error);
            }
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        const matchesSearch =
            b.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.itemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toString().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-serif">Reservations</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your guest bookings</p>
                </div>
            </div>

            <HostBookingToolbar 
                filterStatus={filterStatus}
                onFilterStatus={setFilterStatus}
                searchTerm={searchTerm}
                onSearchTerm={setSearchTerm}
            />

            <HostBookingTable 
                bookings={filteredBookings}
                isLoading={isLoading}
                onViewDetails={setSelectedBooking}
                onStatusUpdate={handleStatusUpdate}
            />

            <HostBookingDetailsModal 
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
};
