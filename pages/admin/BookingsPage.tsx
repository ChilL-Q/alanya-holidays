import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { BookingToolbar } from '../../components/admin/bookings/BookingToolbar';
import { BookingTable } from '../../components/admin/bookings/BookingTable';
import { BookingDetailsModal } from '../../components/admin/bookings/BookingDetailsModal';
import { toast } from 'react-hot-toast';

export const BookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadBookings(filterStatus);
    }, [filterStatus]);

    const loadBookings = async (status?: string) => {
        try {
            setLoading(true);
            const filter = status && status !== 'all' ? status : undefined;
            const data = await db.getAdminBookings(filter);
            setBookings(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number | string, newStatus: string) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            await db.updateBookingStatus(id.toString(), newStatus as 'confirmed' | 'cancelled' | 'completed');
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : prev);
            }
             } catch {
                 toast.error('Failed to update status');
             }
    };

    const handlePayoutStatusChange = async (id: string, newStatus: 'paid' | 'pending' | 'processing') => {
        if (!confirm(`Mark payout as ${newStatus}?`)) return;
        try {
            await db.updatePayoutStatus(id, newStatus);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, payout_status: newStatus } : b));
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, payout_status: newStatus } : prev);
            }
        } catch {
            toast.error('Failed to update payout status');
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch =
            b.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.id.toString().includes(searchQuery);

        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && new Date(b.check_in) >= new Date(dateRange.start);
        }
        if (dateRange.end) {
            matchesDate = matchesDate && new Date(b.check_in) <= new Date(dateRange.end);
        }

        return matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Bookings</h1>
                <div className="text-sm text-slate-500">
                    Total: {bookings.length}
                </div>
            </div>

            <BookingToolbar
                filterStatus={filterStatus}
                onFilterStatus={setFilterStatus}
                searchQuery={searchQuery}
                onSearchQuery={setSearchQuery}
                dateRange={dateRange}
                onDateRange={setDateRange}
            />

            <BookingTable
                loading={loading}
                bookings={filteredBookings}
                onViewDetails={setSelectedBooking}
                onStatusChange={handleStatusChange}
            />

            <BookingDetailsModal
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onStatusChange={handleStatusChange}
                onPayoutStatusChange={handlePayoutStatusChange}
            />
        </div>
    );
};
