import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Home, Car } from 'lucide-react';

export const QuickActionsWidget: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 h-fit">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <NavLink to="/add-service" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 dark:text-cyan-400 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                        <Car size={20} />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Add Vehicle</span>
                </NavLink>
                <NavLink to="/list-property" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Home size={20} />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Add Property</span>
                </NavLink>
                <NavLink to="/admin/users" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Users size={20} />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Manage Users</span>
                </NavLink>
            </div>
        </div>
    );
};
