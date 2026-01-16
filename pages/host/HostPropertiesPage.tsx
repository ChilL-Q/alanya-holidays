import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Filter, Edit, Trash2, MapPin, Star, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

export const HostPropertiesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();
    const [properties, setProperties] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        loadProperties();
    }, [user]);

    const loadProperties = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = await db.getPropertiesByHost(user.id);
            setProperties(data || []);
        } catch (error) {
            console.error('Failed to load properties:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
            try {
                // In a real app we might soft delete or check for active bookings
                await db.deleteProperty(id);
                setProperties(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                alert('Failed to delete property');
                console.error(error);
            }
        }
    };

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Listings</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your properties and availability</p>
                </div>
                <button
                    onClick={() => navigate('/list-property')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={20} />
                    <span>Add New Listing</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400" size={20} />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700/50 border-none rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Published</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Draft/Rejected</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-500 font-semibold text-sm">
                            <tr>
                                <th className="p-4 pl-6">Property</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Price/Night</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4 pl-6"><div className="h-12 w-48 bg-slate-100 dark:bg-slate-700 rounded-lg"></div></td>
                                        <td className="p-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded"></div></td>
                                        <td className="p-4"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full"></div></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-700 rounded"></div></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : filteredProperties.length > 0 ? (
                                filteredProperties.map((property) => (
                                    <tr key={property.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=100&q=80'}
                                                    alt={property.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{property.title}</div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Star size={10} className="fill-orange-400 text-orange-400" />
                                                        <span>{property.rating || 'New'}</span>
                                                        <span>• {property.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                                                <MapPin size={16} />
                                                {property.location}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${property.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
                                                    : property.status === 'pending'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50'
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                {property.status === 'approved' ? 'Published' : property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {formatPrice(convertPrice(property.price_per_night, 'EUR'))}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Link
                                                    to={`/property/${property.id}`}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <Link
                                                    to={`/admin/edit-property/${property.id}`} // We can reuse the edit page or make a host specific one
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(property.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No properties found. <Link to="/list-property" className="text-indigo-600 hover:underline">Add your first listing</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
