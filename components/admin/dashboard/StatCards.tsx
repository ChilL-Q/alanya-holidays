import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatCardsProps {
    revenue: number;
    totalUsers: number;
    totalProperties: number;
    totalServices: number;
}

export const StatCards: React.FC<StatCardsProps> = ({ revenue, totalUsers, totalProperties, totalServices }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-slate-800/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative">
                    <p className="text-slate-500 font-medium mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">€{revenue.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 text-teal-600 dark:text-cyan-400 dark:text-slate-200 text-sm font-medium mt-2">
                        <TrendingUp size={16} />
                        <span>+12.5%</span>
                        <span className="text-slate-400 font-normal">vs last month</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-slate-800/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative">
                    <p className="text-slate-500 font-medium mb-1">Users</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsers}</h3>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-slate-200 text-sm font-medium mt-2">
                        <span>Active Customers</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 dark:bg-slate-800/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative">
                    <p className="text-slate-500 font-medium mb-1">Properties</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalProperties}</h3>
                    <div className="flex items-center gap-1 text-purple-600 dark:text-slate-200 text-sm font-medium mt-2">
                        <span>Listed</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-slate-800/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative">
                    <p className="text-slate-500 font-medium mb-1">Services</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalServices}</h3>
                    <div className="flex items-center gap-1 text-orange-600 dark:text-slate-200 text-sm font-medium mt-2">
                        <span>Fleet Size</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
