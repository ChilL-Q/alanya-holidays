import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../api-services';
import { StatCards } from '../../components/admin/dashboard/StatCards';
import { RevenueChart } from '../../components/admin/dashboard/RevenueChart';
import { BookingStatusChart } from '../../components/admin/dashboard/BookingStatusChart';
import { RecentBookingsWidget } from '../../components/admin/dashboard/RecentBookingsWidget';
import { QuickActionsWidget } from '../../components/admin/dashboard/QuickActionsWidget';

export const Dashboard: React.FC = () => {
    const isMountedRef = useRef(true);
    const [stats, setStats] = useState<{
        total_properties: number;
        total_users: number;
        total_services: number;
        revenue: number;
        revenue_history: any[];
        booking_status_distribution: any[];
        recent_bookings: any[];
    }>({
        total_properties: 0,
        total_users: 0,
        total_services: 0,
        revenue: 0,
        revenue_history: [],
        booking_status_distribution: [],
        recent_bookings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        isMountedRef.current = true;
        const doLoadStats = async () => {
            try {
                const { count: totalProperties } = await db.getAdminProperties('all', 1, 1);
                const { count: totalServices } = await db.getAdminServices('all', [], 1, 1);
                const users = await db.getAllUsers() || [];
                const allBookings = await db.getBookingsByStatus('confirmed') || [];
                const pendingBookings = await db.getBookingsByStatus('pending') || [];
                const completedBookings = await db.getBookingsByStatus('completed') || [];
                const cancelledBookings = await db.getBookingsByStatus('cancelled') || [];
                const confirmedRevenue = allBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
                const completedRevenue = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
                const totalRevenue = confirmedRevenue + completedRevenue;
                const months = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    return d.toLocaleString('default', { month: 'short' });
                }).reverse();
                const revenueHistory = months.map(month => {
                    const monthlyBookings = [...allBookings, ...completedBookings].filter(b => {
                        const d = new Date(b.created_at);
                        return d.toLocaleString('default', { month: 'short' }) === month;
                    });
                    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
                    return { name: month, value: monthlyRevenue };
                });
                const bookingStatusDistribution = [
                    { name: 'Pending', value: pendingBookings?.length || 0, color: '#F59E0B' },
                    { name: 'Confirmed', value: allBookings?.length || 0, color: '#10B981' },
                    { name: 'Completed', value: completedBookings?.length || 0, color: '#3B82F6' },
                    { name: 'Cancelled', value: cancelledBookings?.length || 0, color: '#EF4444' }
                ].filter(item => item.value > 0);
                const recent = [...pendingBookings, ...allBookings, ...completedBookings, ...cancelledBookings]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5);
                if (isMountedRef.current) {
                    setStats({
                        total_properties: totalProperties || 0,
                        total_users: users.length,
                        total_services: totalServices || 0,
                        revenue: totalRevenue,
                        revenue_history: revenueHistory,
                        booking_status_distribution: bookingStatusDistribution,
                        recent_bookings: recent
                    });
                }
            } catch (e) {
                // ignore unmount
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };
        doLoadStats();
        return () => { isMountedRef.current = false; };
    }, []);

    const loadStats = async () => {
        try {
            const { count: totalProperties } = await db.getAdminProperties('all', 1, 1);
            const { count: totalServices } = await db.getAdminServices('all', [], 1, 1);
            const users = await db.getAllUsers() || [];

            const allBookings = await db.getBookingsByStatus('confirmed') || [];
            const pendingBookings = await db.getBookingsByStatus('pending') || [];
            const completedBookings = await db.getBookingsByStatus('completed') || [];
            const cancelledBookings = await db.getBookingsByStatus('cancelled') || [];

            const confirmedRevenue = allBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
            const completedRevenue = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
            const totalRevenue = confirmedRevenue + completedRevenue;

            const months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return d.toLocaleString('default', { month: 'short' });
            }).reverse();

            const revenueHistory = months.map(month => {
                const monthlyBookings = [...allBookings, ...completedBookings].filter(b => {
                    const d = new Date(b.created_at);
                    return d.toLocaleString('default', { month: 'short' }) === month;
                });
                const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
                return { name: month, value: monthlyRevenue };
            });

            const bookingStatusDistribution = [
                { name: 'Pending', value: pendingBookings?.length || 0, color: '#F59E0B' },
                { name: 'Confirmed', value: allBookings?.length || 0, color: '#10B981' },
                { name: 'Completed', value: completedBookings?.length || 0, color: '#3B82F6' },
                { name: 'Cancelled', value: cancelledBookings?.length || 0, color: '#EF4444' }
            ].filter(item => item.value > 0);

            const recent = [...pendingBookings, ...allBookings, ...completedBookings, ...cancelledBookings]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);

            setStats({
                total_properties: totalProperties || 0,
                total_users: users.length,
                total_services: totalServices || 0,
                revenue: totalRevenue,
                revenue_history: revenueHistory,
                booking_status_distribution: bookingStatusDistribution,
                recent_bookings: recent
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <StatCards 
                revenue={stats.revenue} 
                totalUsers={stats.total_users} 
                totalProperties={stats.total_properties} 
                totalServices={stats.total_services} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RevenueChart data={stats.revenue_history} />
                <BookingStatusChart data={stats.booking_status_distribution} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RecentBookingsWidget bookings={stats.recent_bookings} />
                <QuickActionsWidget />
            </div>
        </div>
    );
};
