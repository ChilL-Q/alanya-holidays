import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Filter, Edit, Trash2, Car, Map, Smartphone, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

export const HostServicesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { convertPrice, formatPrice } = useCurrency();
    const [services, setServices] = useState<any[]>([]);
    const [pendingEdits, setPendingEdits] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadServices();
    }, [user]);

    const loadServices = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const [data, edits] = await Promise.all([
                db.getServicesByProvider(user.id),
                db.getMyPendingEdits(user.id)
            ]);

            const editSet = new Set((edits || []).map((e: any) => e.service_id));

            setServices(data || []);
            setPendingEdits(new Set(editSet as any));
        } catch (error) {
            console.error('Failed to load services:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this service? This cannot be undone.')) {
            try {
                await db.deleteService(id);
                setServices(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                alert('Failed to delete service');
                console.error(error);
            }
        }
    };

    const filteredServices = services.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || s.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'car': return <Car size={18} />;
            case 'tour': return <Map size={18} />;
            case 'esim': return <Smartphone size={18} />;
            case 'visa': return <CreditCard size={18} />;
            default: return <Car size={18} />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Services</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your fleet, tours, and other services</p>
                </div>
                <button
                    onClick={() => navigate('/add-service')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={20} />
                    <span>Add New Service</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400" size={20} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700/50 border-none rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500 dark:text-white capitalize"
                    >
                        <option value="all">All Types</option>
                        <option value="car">Cars</option>
                        <option value="bike">Bikes</option>
                        <option value="tour">Tours</option>
                        <option value="transfer">Transfers</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-500 font-semibold text-sm">
                            <tr>
                                <th className="p-4 pl-6">Service</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4 pl-6"><div className="h-12 w-48 bg-slate-100 dark:bg-slate-700 rounded-lg"></div></td>
                                        <td className="p-4"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-700 rounded-full"></div></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-700 rounded"></div></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={service.images?.[0] || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=100&q=80'}
                                                    alt={service.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{service.title}</div>
                                                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{service.description?.slice(0, 50)}...</div>
                                                    {pendingEdits.has(service.id) && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] rounded-full font-medium">
                                                            Pending Update
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                    {getServiceIcon(service.type)}
                                                </span>
                                                <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{service.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {formatPrice(convertPrice(service.price, 'EUR'))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${service.status === 'approved'
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                : service.status === 'rejected'
                                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                                                }`}>
                                                {service.status ? service.status.charAt(0).toUpperCase() + service.status.slice(1) : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Link
                                                    to={`/host/edit-service/${service.id}`}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
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
                                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                        No services found. <Link to="/add-service" className="text-indigo-600 hover:underline">Add your first service</Link>
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
