import React from 'react';
import { NavLink } from 'react-router-dom';

interface RecentBookingsWidgetProps {
    bookings: any[];
}

export const RecentBookingsWidget: React.FC<RecentBookingsWidgetProps> = ({ bookings }) => {
    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Real Bookings</h3>
                <NavLink to="/admin/bookings" className="text-sm text-teal-600 dark:text-cyan-400 dark:text-slate-200 font-medium hover:underline">View All</NavLink>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4 pl-6">Item</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {bookings.map((b: any) => (
                            <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors">
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
    );
};
