import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, ServiceModel } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Home,
    Users,
    Calendar,
    Car,
    LogOut,
    Edit2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Trash2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { AdminExplorer, ExplorerItem } from '../../components/admin/AdminExplorer';

export const AdminPage: React.FC = () => {
    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'users' | 'bookings' | 'services'>('dashboard');
    const [stats, setStats] = useState<{
        pending: number;
        total_properties: number;
        total_users: number;
        total_services: number;
        revenue?: number;
        active_bookings?: number;
        recent_bookings?: any[];
        revenue_history?: any[];
        booking_status_distribution?: any[];
    }>({ pending: 0, total_properties: 0, total_users: 0, total_services: 0, revenue_history: [], booking_status_distribution: [] });

    // Explorer State
    const [explorerPath, setExplorerPath] = useState<string[]>([]);
    const [explorerItems, setExplorerItems] = useState<ExplorerItem[]>([]);
    const [leafData, setLeafData] = useState<any[]>([]); // For final tables
    const [metadata, setMetadata] = useState<any>(null); // For Model details etc
    const [loading, setLoading] = useState(false);

    // Model Editing State
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [editingModelData, setEditingModelData] = useState({ id: '', description: '', image_url: '' });

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/');
            return;
        }

        // Initial Stats Load
        loadStats();

        // If tab changes, reset explorer
        setExplorerPath([]);
        setLeafData([]);
        setMetadata(null);
    }, [user, isAuthenticated, authLoading, activeTab]);

    useEffect(() => {
        if (activeTab !== 'dashboard') {
            loadExplorerData();
        }
    }, [activeTab, explorerPath]);

    const loadStats = async () => {
        try {
            const props = await db.getAdminProperties() || [];
            const users = await db.getAllUsers() || [];
            const services = await db.getServices() || [];

            // Fetch bookings for stats
            // We'll fetch 'pending' and 'confirmed' for active stats
            // And all for revenue calculation (or at least confirmed/completed)
            const allBookings = await db.getBookingsByStatus('confirmed') || [];
            const pendingBookings = await db.getBookingsByStatus('pending') || [];
            const completedBookings = await db.getBookingsByStatus('completed') || [];
            const cancelledBookings = await db.getBookingsByStatus('cancelled') || [];

            const confirmedRevenue = allBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
            const completedRevenue = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.total_price) || 0), 0);
            const totalRevenue = confirmedRevenue + completedRevenue;

            // --- Chart Data Processing ---
            // 1. Revenue History (Last 6 Months)
            const months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return d.toLocaleString('default', { month: 'short' });
            }).reverse();

            const revenueHistory = months.map(month => {
                // Determine bookings for this month
                // Note: accurate month matching required
                const monthlyBookings = [...allBookings, ...completedBookings].filter(b => {
                    const d = new Date(b.created_at);
                    return d.toLocaleString('default', { month: 'short' }) === month;
                });
                const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
                return { name: month, value: monthlyRevenue };
            });

            // 2. Booking Status Distribution
            const bookingStatusDistribution = [
                { name: 'Pending', value: pendingBookings?.length || 0, color: '#F59E0B' }, // Amber
                { name: 'Confirmed', value: allBookings?.length || 0, color: '#10B981' }, // Emerald
                { name: 'Completed', value: completedBookings?.length || 0, color: '#3B82F6' }, // Blue
                { name: 'Cancelled', value: cancelledBookings?.length || 0, color: '#EF4444' } // Red
            ].filter(item => item.value > 0);

            // Merge for recent bookings list
            const recent = [...pendingBookings, ...allBookings, ...completedBookings, ...cancelledBookings]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);

            setStats({
                pending: props.filter((p: any) => p.status === 'pending').length,
                total_properties: props.length,
                total_users: users.length,
                total_services: services.length,
                revenue: totalRevenue,
                active_bookings: allBookings.length + pendingBookings.length,
                recent_bookings: recent,
                revenue_history: revenueHistory,
                booking_status_distribution: bookingStatusDistribution
            });
        } catch (e) {
            console.error("Failed to load dashboard stats", e);
        }
    };

    const loadExplorerData = async () => {
        setLoading(true);
        setExplorerItems([]);
        setLeafData([]);
        setMetadata(null);

        try {
            // --- SERVICES ---
            if (activeTab === 'services') {
                if (explorerPath.length === 0) {
                    const types = await db.getServiceTypes();
                    // Map types to specific colors/icons if needed
                    const getTypeColor = (t: string) => {
                        switch (t) {
                            case 'car': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                            case 'bike': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
                            case 'tour': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
                            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                        }
                    };
                    setExplorerItems(types.map(t => ({
                        id: t,
                        label: t.charAt(0).toUpperCase() + t.slice(1),
                        type: 'folder',
                        color: getTypeColor(t),
                        subtext: 'Category',
                        onClick: () => pushPath(t)
                    })));
                } else if (explorerPath.length === 1) {
                    const brands = await db.getServiceBrands(explorerPath[0]);
                    setExplorerItems(brands.map(b => ({
                        id: b,
                        label: b,
                        type: 'folder',
                        subtext: 'Brand',
                        onClick: () => pushPath(b)
                    })));
                } else if (explorerPath.length === 2) {
                    const models = await db.getServiceModels(explorerPath[0], explorerPath[1]);
                    setExplorerItems(models.map((m: any) => ({
                        id: m.model,
                        label: m.model,
                        type: 'folder',
                        image: m.image_url,
                        subtext: m.description ? m.description.slice(0, 30) + '...' : 'Manage Model',
                        onClick: () => pushPath(m.model)
                    })));
                } else if (explorerPath.length === 3) {
                    // Leaf: Listings
                    const [type, brand, model] = explorerPath;
                    const listings = await db.getServicesByModel(type, brand, model);
                    setLeafData(listings || []);

                    const meta = await db.getServiceModel(type, brand, model);
                    setMetadata({
                        title: `${brand} ${model}`,
                        description: meta?.description,
                        image: meta?.image_url,
                        onEdit: () => {
                            if (meta) {
                                setEditingModelData({
                                    id: meta.id,
                                    description: meta.description || '',
                                    image_url: meta.image_url || ''
                                });
                                setIsModelModalOpen(true);
                            } else {
                                alert("Error: Model record not found in database. Please ensure data migration was successful.");
                            }
                        }
                    });
                }
            }

            // --- PROPERTIES ---
            else if (activeTab === 'properties') {
                if (explorerPath.length === 0) {
                    const types = await db.getPropertyTypes();
                    setExplorerItems(types.map(t => ({
                        id: t,
                        label: t,
                        type: 'folder',
                        color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
                        onClick: () => pushPath(t)
                    })));
                } else if (explorerPath.length === 1) {
                    const locations = await db.getPropertyLocations(explorerPath[0]);
                    setExplorerItems(locations.map(l => ({
                        id: l,
                        label: l,
                        type: 'folder',
                        onClick: () => pushPath(l)
                    })));
                } else if (explorerPath.length === 2) {
                    const listings = await db.getPropertiesByLocation(explorerPath[0], explorerPath[1]);
                    setLeafData(listings || []);
                }
            }

            // --- USERS ---
            else if (activeTab === 'users') {
                if (explorerPath.length === 0) {
                    const roles = ['host', 'guest', 'admin'];
                    const getRoleColor = (r: string) => {
                        switch (r) {
                            case 'admin': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
                            case 'host': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
                            default: return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
                        }
                    }
                    setExplorerItems(roles.map(r => ({
                        id: r,
                        label: r.charAt(0).toUpperCase() + r.slice(1) + 's',
                        type: 'folder',
                        color: getRoleColor(r),
                        onClick: () => pushPath(r)
                    })));
                } else if (explorerPath.length === 1) {
                    const role = explorerPath[0]; // 'host', 'guest'
                    const users = await db.getUsersByRole(role);
                    setLeafData(users || []);
                }
            }

            // --- BOOKINGS ---
            else if (activeTab === 'bookings') {
                if (explorerPath.length === 0) {
                    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
                    const getStatusColor = (s: string) => {
                        switch (s) {
                            case 'pending': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
                            case 'confirmed': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
                            case 'completed': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                            case 'cancelled': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
                            default: return 'bg-slate-100';
                        }
                    }
                    setExplorerItems(statuses.map(s => ({
                        id: s,
                        label: s.charAt(0).toUpperCase() + s.slice(1),
                        type: 'folder',
                        color: getStatusColor(s),
                        subtext: 'Status Group',
                        onClick: () => pushPath(s)
                    })));
                } else if (explorerPath.length === 1) {
                    const bookings = await db.getBookingsByStatus(explorerPath[0]);
                    setLeafData(bookings || []);
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const pushPath = (crumb: string) => {
        setExplorerPath(prev => [...prev, crumb]);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setExplorerPath([]);
        } else {
            setExplorerPath(prev => prev.slice(0, index + 1));
        }
    };

    // --- Actions (Delete, Update) ---
    const handleServiceAction = async (action: string, id: string) => {
        if (action === 'delete') {
            if (confirm('Delete service listing?')) {
                await db.deleteService(id);
                loadExplorerData();
            }
        }
    };

    const handlePropertyAction = async (action: string, id: string) => {
        if (action === 'delete') {
            if (confirm('Delete property?')) {
                await db.deleteProperty(id);
                loadExplorerData();
            }
        } else if (action === 'approve') {
            await db.updatePropertyStatus(id, 'approved');
            loadExplorerData();
        } else if (action === 'reject') {
            await db.updatePropertyStatus(id, 'rejected');
            loadExplorerData();
        }
    };

    const handleSaveModel = async () => {
        try {
            await db.updateServiceModel(editingModelData.id, {
                description: editingModelData.description,
                image_url: editingModelData.image_url
            });
            setIsModelModalOpen(false);
            loadExplorerData(); // Reload to see changes
        } catch (e) {
            console.error(e);
            alert('Failed to save model details');
        }
    };

    const renderLeafContent = () => {
        // --- SERVICES TABLE ---
        if (activeTab === 'services') {
            return (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => navigate('/add-service')}
                            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700"
                        >
                            + Add Listing
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leafData.map((item: any) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-4">
                                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    {item.images?.[0] && <img src={item.images[0]} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.title}</h3>
                                    <p className="text-teal-600 font-bold">€{item.price}</p>
                                    <div className="flex gap-2 mt-4 justify-end">
                                        <button onClick={() => navigate(`/admin/edit-service/${item.id}`)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => handleServiceAction('delete', item.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // --- PROPERTIES TABLE ---
        if (activeTab === 'properties') {
            return (
                <div className="grid grid-cols-1 gap-4">
                    {leafData.map((property: any) => (
                        <div key={property.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-6">
                            <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                {property.images?.[0] && <img src={property.images[0]} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-white">{property.title}</h3>
                                <p className="text-sm text-slate-500">{property.location}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${property.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    property.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {property.status.toUpperCase()}
                                </span>
                                <button onClick={() => navigate(`/admin/edit-property/${property.id}`)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Edit2 size={18} /></button>
                                {property.status !== 'approved' && <button onClick={() => handlePropertyAction('approve', property.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={18} /></button>}
                                <button onClick={() => handlePropertyAction('delete', property.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // --- USERS TABLE ---
        if (activeTab === 'users') {
            return (
                <div className="grid grid-cols-1 gap-4">
                    {leafData.map((u: any) => (
                        <div key={u.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full" />
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-white">{u.full_name}</h3>
                                    <p className="text-sm text-slate-500">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => navigate(`/admin/edit-user/${u.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // --- BOOKINGS TABLE ---
        if (activeTab === 'bookings') {
            return (
                <div className="grid grid-cols-1 gap-4">
                    {leafData.map((b: any) => (
                        <div key={b.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">{b.itemTitle}</h3>
                                <p className="text-sm text-slate-500">{b.user?.full_name} • {b.check_in}</p>
                            </div>
                            <span className="font-bold">€{b.total_price}</span>
                        </div>
                    ))}
                </div>
            );
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <LayoutDashboard className="text-accent" />
                        Admin Panel
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('properties')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'properties' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Home size={20} /> Properties
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Users size={20} /> Users
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'bookings' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Calendar size={20} /> Bookings
                    </button>
                    <button onClick={() => setActiveTab('services')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'services' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Car size={20} /> Services
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-teal-50 dark:bg-teal-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative">
                                    <p className="text-slate-500 font-medium mb-1">Total Revenue</p>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        €{stats.revenue?.toLocaleString() || '0'}
                                    </h3>
                                    <div className="flex items-center gap-1 text-green-500 text-sm font-medium mt-2">
                                        <span>+12.5%</span>
                                        <span className="text-slate-400 font-normal">from last month</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative">
                                    <p className="text-slate-500 font-medium mb-1">Active Bookings</p>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.active_bookings || 0}</h3>
                                    <div className="flex items-center gap-1 text-blue-500 text-sm font-medium mt-2">
                                        <span>{stats.pending} pending</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative">
                                    <p className="text-slate-500 font-medium mb-1">Total Users</p>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_users}</h3>
                                    <div className="flex items-center gap-1 text-purple-500 text-sm font-medium mt-2">
                                        <span>+5 new</span>
                                        <span className="text-slate-400 font-normal">this week</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="relative">
                                    <p className="text-slate-500 font-medium mb-1">Services</p>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_services}</h3>
                                    <div className="flex items-center gap-1 text-orange-500 text-sm font-medium mt-2">
                                        <span>Active Fleet</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Charts Row */}
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
                                                    {stats.booking_status_distribution?.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                                        {stats.booking_status_distribution?.map((entry: any) => (
                                            <div key={entry.name} className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                <span className="text-xs text-slate-500 font-medium">{entry.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button onClick={() => navigate('/add-service')} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 transition-colors flex flex-col items-center gap-2">
                                        <Car size={32} strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Add Vehicle</span>
                                    </button>
                                    <button onClick={() => navigate('/list-property')} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors flex flex-col items-center gap-2">
                                        <Home size={32} strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Add Property</span>
                                    </button>
                                    <button onClick={() => setActiveTab('users')} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 transition-colors flex flex-col items-center gap-2">
                                        <Users size={32} strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Manage Users</span>
                                    </button>
                                    <button onClick={() => setActiveTab('bookings')} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 transition-colors flex flex-col items-center gap-2">
                                        <CheckCircle size={32} strokeWidth={1.5} />
                                        <span className="text-sm font-medium">Approvals</span>
                                    </button>
                                </div>
                            </div>

                            {/* Recent Bookings Table - Full Width */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Real Bookings</h3>
                                    <button onClick={() => setActiveTab('bookings')} className="text-sm text-teal-600 font-medium hover:underline">View All</button>
                                </div>
                                <div className="div">
                                    {stats.recent_bookings && stats.recent_bookings.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase font-semibold">
                                                <tr>
                                                    <th className="p-4 pl-6">Item</th>
                                                    <th className="p-4">Customer</th>
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Status</th>
                                                    <th className="p-4 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {stats.recent_bookings.map((b: any) => (
                                                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="p-4 pl-6 font-medium text-slate-900 dark:text-white">{b.itemTitle || 'Booking'}</td>
                                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                                                    {b.user?.full_name?.charAt(0) || 'U'}
                                                                </div>
                                                                {b.user?.full_name || 'Guest'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {b.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">€{b.total_price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-12 text-center flex flex-col items-center gap-4 text-slate-400">
                                            <Calendar size={48} className="opacity-20" />
                                            <p>No real bookings found yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab !== 'dashboard' && (
                    <AdminExplorer
                        items={explorerItems}
                        breadcrumbs={[activeTab.charAt(0).toUpperCase() + activeTab.slice(1), ...explorerPath]}
                        onBreadcrumbClick={handleBreadcrumbClick}
                        loading={loading}
                        metadata={metadata}
                    >
                        {leafData.length > 0 && renderLeafContent()}
                        {leafData.length === 0 && explorerItems.length === 0 && !loading && (
                            <div className="text-center text-slate-400 py-12">No items found in this folder.</div>
                        )}
                    </AdminExplorer>
                )}
            </main>

            {/* Edit Model Modal */}
            {isModelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit Model Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={editingModelData.description}
                                    onChange={(e) => setEditingModelData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full h-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                                    placeholder="Enter generic description for this model..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hero Image URL</label>
                                <input
                                    type="text"
                                    value={editingModelData.image_url}
                                    onChange={(e) => setEditingModelData(prev => ({ ...prev, image_url: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsModelModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveModel}
                                className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-bold"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
