import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { NavLink } from 'react-router-dom';
import { Users, Home, TrendingUp, CheckCircle, Car } from 'lucide-react';

export const Dashboard: React.FC = () => {
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
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const props = await db.getAdminProperties() || [];
            const users = await db.getAllUsers() || [];
            const services = await db.getServices() || [];

            // Fetch bookings
            const allBookings = await db.getBookingsByStatus('confirmed') || [];
            const pendingBookings = await db.getBookingsByStatus('pending') || [];
            const completedBookings = await db.getBookingsByStatus('completed') || [];
            const cancelledBookings = await db.getBookingsByStatus('cancelled') || [];

            // Revenue Calculation
            const confirmedRevenue = allBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
            const completedRevenue = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
            const totalRevenue = confirmedRevenue + completedRevenue;

            // Chart Logic: Revenue History
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

            // Booking Stats
            const bookingStatusDistribution = [
                { name: 'Pending', value: pendingBookings?.length || 0, color: '#F59E0B' },
                { name: 'Confirmed', value: allBookings?.length || 0, color: '#10B981' },
                { name: 'Completed', value: completedBookings?.length || 0, color: '#3B82F6' },
                { name: 'Cancelled', value: cancelledBookings?.length || 0, color: '#EF4444' }
            ].filter(item => item.value > 0);

            // Recent
            const recent = [...pendingBookings, ...allBookings, ...completedBookings, ...cancelledBookings]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);

            setStats({
                total_properties: props.length,
                total_users: users.length,
                total_services: services.length,
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
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-slate-500 font-medium mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">€{stats.revenue.toLocaleString()}</h3>
                        <div className="flex items-center gap-1 text-teal-600 text-sm font-medium mt-2">
                            <TrendingUp size={16} />
                            <span>+12.5%</span>
                            <span className="text-slate-400 font-normal">vs last month</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-slate-500 font-medium mb-1">Users</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_users}</h3>
                        <div className="flex items-center gap-1 text-blue-600 text-sm font-medium mt-2">
                            <span>Active Customers</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-slate-500 font-medium mb-1">Properties</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_properties}</h3>
                        <div className="flex items-center gap-1 text-purple-600 text-sm font-medium mt-2">
                            <span>Listed</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <p className="text-slate-500 font-medium mb-1">Services</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_services}</h3>
                        <div className="flex items-center gap-1 text-orange-600 text-sm font-medium mt-2">
                            <span>Fleet Size</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-[350px]">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Revenue Trend</h3>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenue_history}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(value) => `€${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-[350px] flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Booking Status</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.booking_status_distribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.booking_status_distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {stats.booking_status_distribution.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Bookings & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Real Bookings</h3>
                        <NavLink to="/admin/bookings" className="text-sm text-teal-600 font-medium hover:underline">View All</NavLink>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-4 pl-6">Item</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {stats.recent_bookings.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white">{b.itemTitle || 'Booking'}</td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {b.user?.full_name || 'Guest'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {new Date(b.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">€{b.total_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-fit">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <NavLink to="/add-service" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                                <Car size={20} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">Add Vehicle</span>
                        </NavLink>
                        <NavLink to="/list-property" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Home size={20} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">Add Property</span>
                        </NavLink>
                        <NavLink to="/admin/users" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Users size={20} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">Manage Users</span>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};
