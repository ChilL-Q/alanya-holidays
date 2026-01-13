import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Home,
    Users,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    MoreVertical,
    LogOut,
    Edit2
} from 'lucide-react';

export const AdminPage: React.FC = () => {
    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'users' | 'bookings'>('dashboard');
    const [stats, setStats] = useState({ pending: 0, total_properties: 0, total_users: 0 });
    const [properties, setProperties] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        // Basic role check (client-side, RLS protects data anyway)
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }

        fetchData();
    }, [user, isAuthenticated, activeTab, authLoading]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'properties' || activeTab === 'dashboard') {
                const props = await db.getAdminProperties();
                setProperties(props || []);
                const pending = props?.filter((p: any) => p.status === 'pending').length || 0;
                setStats(prev => ({ ...prev, pending, total_properties: props?.length || 0 }));
            }
            if (activeTab === 'users' || activeTab === 'dashboard') {
                const users = await db.getAllUsers();
                setUsersList(users || []);
                setStats(prev => ({ ...prev, total_users: users?.length || 0 }));
            }
            if (activeTab === 'bookings' || activeTab === 'dashboard') {
                const books = await db.getAdminBookings();
                setBookings(books || []);
            }
        } catch (error) {
            console.error('Admin Fetch Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (confirm('Approve this property? It will go live immediately.')) {
            await db.updatePropertyStatus(id, 'approved');
            fetchData();
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('Reject this property?')) {
            await db.updatePropertyStatus(id, 'rejected');
            fetchData();
        }
    };

    const handleRoleChange = async (id: string, newRole: 'host' | 'guest' | 'admin') => {
        if (confirm(`Change user role to ${newRole}?`)) {
            await db.updateUserRole(id, newRole);
            fetchData();
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (confirm('Are you sure you want to DELETE this property? This action cannot be undone.')) {
            try {
                await db.deleteProperty(id);
                fetchData();
            } catch (error) {
                alert('Error deleting property');
            }
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user profile? (Note: This does not delete the Auth account, only the profile data)')) {
            try {
                await db.deleteUser(id);
                fetchData();
            } catch (error) {
                alert('Error deleting user');
            }
        }
    };

    const handleBookingStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
        if (confirm(`Change booking status to ${status}?`)) {
            await db.updateBookingStatus(id, status);
            fetchData();
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
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('properties')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'properties' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Home size={20} />
                        Properties
                        {stats.pending > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pending}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Users size={20} />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'bookings' ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Calendar size={20} />
                        Bookings
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-4">
                        <img src={user.avatar} className="w-8 h-8 rounded-full" alt="Admin" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-slate-500">Super Admin</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors text-sm">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white dark:bg-slate-800 shadow-sm p-6 sticky top-0 z-20 md:hidden flex justify-between items-center">
                    <h1 className="font-bold text-lg dark:text-white">Admin Panel</h1>
                    {/* Mobile Menu Trigger would go here */}
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {/* Dashboard View */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
                                            <AlertCircle size={24} />
                                        </div>
                                        <span className="text-sm text-slate-500 font-medium">pending</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pending}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Properties awaiting approval</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                            <Home size={24} />
                                        </div>
                                        <span className="text-sm text-slate-500 font-medium">total</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_properties}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Total listed properties</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                                            <Users size={24} />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total_users}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Registered users</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Properties View */}
                    {activeTab === 'properties' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Properties</h2>
                                <div className="relative">
                                    <input type="text" placeholder="Search properties..." className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white" />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-sm uppercase font-semibold">
                                        <tr>
                                            <th className="p-4 pl-6">Property</th>
                                            <th className="p-4">Owner</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {properties.map((property) => (
                                            <tr key={property.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                            {property.images?.[0] && <img src={property.images[0]} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{property.title}</p>
                                                            <p className="text-xs text-slate-500">{property.location}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{property.host_id.slice(0, 8)}...</td>
                                                <td className="p-4 text-slate-900 dark:text-white font-bold">${property.price_per_night}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${property.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        property.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {property.status?.toUpperCase() || 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/admin/edit-property/${property.id}`)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold"
                                                            title="Edit Property"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        {property.status !== 'approved' && (
                                                            <button
                                                                onClick={() => handleApprove(property.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors text-xs font-bold"
                                                                title="Approve Property"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                        )}
                                                        {property.status !== 'rejected' && (
                                                            <button
                                                                onClick={() => handleReject(property.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors text-xs font-bold"
                                                                title="Reject Property"
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteProperty(property.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-red-600 rounded-lg transition-colors text-xs font-bold"
                                                            title="Delete Property"
                                                        >
                                                            <LogOut size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Users View */}
                    {activeTab === 'users' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Users ({usersList.length})</h2>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-sm uppercase font-semibold">
                                        <tr>
                                            <th className="p-4 pl-6">User</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Role</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {usersList.map((u) => (
                                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full" alt="" />
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">{u.full_name}</p>
                                                            <p className="text-xs text-slate-500 font-mono">Joined: {new Date(u.created_at || Date.now()).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                                                <td className="p-4">
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                                        className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm py-1 pl-2 pr-6"
                                                    >
                                                        <option value="guest">Guest</option>
                                                        <option value="host">Host</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/admin/edit-user/${u.id}`)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <LogOut size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Bookings View */}
                    {activeTab === 'bookings' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Bookings ({bookings.length})</h2>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                {bookings.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">No bookings found.</div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-sm uppercase font-semibold">
                                            <tr>
                                                <th className="p-4 pl-6">Item</th>
                                                <th className="p-4">User</th>
                                                <th className="p-4">Dates</th>
                                                <th className="p-4">Total</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {bookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">{booking.itemTitle}</p>
                                                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{booking.item_type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                                                <img src={booking.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.user?.full_name || 'U')}`} className="w-full h-full" />
                                                            </div>
                                                            <span className="text-sm font-medium">{booking.user?.full_name}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400">{booking.user?.email}</div>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {booking.check_in}
                                                        {booking.check_out && ` → ${booking.check_out}`}
                                                    </td>
                                                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                                                        €{booking.total_price}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {booking.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <select
                                                            value={booking.status}
                                                            onChange={(e) => handleBookingStatus(booking.id, e.target.value as any)}
                                                            className="bg-white border border-slate-200 rounded-lg text-xs py-1 px-2"
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="confirmed">Confirm</option>
                                                            <option value="cancelled">Cancel</option>
                                                            <option value="completed">Complete</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
