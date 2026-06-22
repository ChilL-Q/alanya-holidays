import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Car, Briefcase, FileText, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';

interface DraftItem {
    key: string;
    type: 'directory' | 'property' | 'service' | 'admin_directory_edit';
    title: string;
    updatedAt: string;
    link: string;
}

export const ProfileDraftsTab: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState<DraftItem[]>([]);

    const loadDrafts = () => {
        const foundDrafts: DraftItem[] = [];

        // 1. Directory creation draft
        const dir = localStorage.getItem('draft_directory_listing');
        if (dir) {
            try {
                const parsed = JSON.parse(dir);
                foundDrafts.push({
                    key: 'draft_directory_listing',
                    type: 'directory',
                    title: parsed.name || 'Untitled Directory Listing',
                    updatedAt: parsed.updatedAt,
                    link: '/add-listing'
                });
            } catch (e) {
                console.error(e);
            }
        }

        // 2. Property creation draft
        const prop = localStorage.getItem('draft_property_listing');
        if (prop) {
            try {
                const parsed = JSON.parse(prop);
                foundDrafts.push({
                    key: 'draft_property_listing',
                    type: 'property',
                    title: parsed.title || 'Untitled Property Listing',
                    updatedAt: parsed.updatedAt,
                    link: '/list-property'
                });
            } catch (e) {
                console.error(e);
            }
        }

        // 3. Service creation draft
        const serv = localStorage.getItem('draft_service_listing');
        if (serv) {
            try {
                const parsed = JSON.parse(serv);
                foundDrafts.push({
                    key: 'draft_service_listing',
                    type: 'service',
                    title: parsed.formData?.title || 'Untitled Service Listing',
                    updatedAt: parsed.updatedAt,
                    link: '/add-service'
                });
            } catch (e) {
                console.error(e);
            }
        }

        // 4. Admin directory edit drafts
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('draft_admin_directory_listing_')) {
                const listing = localStorage.getItem(key);
                if (listing) {
                    try {
                        const parsed = JSON.parse(listing);
                        const id = key.replace('draft_admin_directory_listing_', '');
                        foundDrafts.push({
                            key,
                            type: 'admin_directory_edit',
                            title: parsed.formData?.name || 'Untitled Edit Listing',
                            updatedAt: parsed.updatedAt,
                            link: `/admin/directory/${id}`
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }

        // Sort by updatedAt descending
        foundDrafts.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });

        setDrafts(foundDrafts);
    };

    useEffect(() => {
        loadDrafts();
    }, []);

    const handleDiscard = (key: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to discard this draft? All unsaved progress will be permanently lost.')) {
            localStorage.removeItem(key);
            toast.success('Draft discarded successfully');
            loadDrafts();
        }
    };

    const getDraftIcon = (type: string) => {
        switch (type) {
            case 'directory':
                return <MapPin className="text-teal-600 dark:text-teal-400" size={22} />;
            case 'property':
                return <Home className="text-indigo-600 dark:text-indigo-400" size={22} />;
            case 'service':
                return <Car className="text-emerald-600 dark:text-emerald-400" size={22} />;
            default:
                return <Briefcase className="text-slate-600 dark:text-slate-400" size={22} />;
        }
    };

    const getDraftLabel = (type: string) => {
        switch (type) {
            case 'directory':
                return 'Directory Listing';
            case 'property':
                return 'Property Rental';
            case 'service':
                return 'Service Listing';
            case 'admin_directory_edit':
                return 'Directory Edit (Admin)';
            default:
                return 'Draft';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Unsaved Drafts</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your local creation and editing drafts saved automatically on this device.
                </p>
            </div>

            {drafts.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                    <FileText size={48} className="mx-auto text-slate-200 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No drafts found</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Your progress will automatically save here as you write directory listings, stays, or services.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {drafts.map((draft) => (
                        <div
                            key={draft.key}
                            onClick={() => navigate(draft.link)}
                            className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/50 flex items-center justify-between hover:shadow-md hover:border-teal-500/20 dark:hover:border-teal-500/20 transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:scale-105 transition-transform">
                                    {getDraftIcon(draft.type)}
                                </div>
                                <div className="text-left">
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                                        {getDraftLabel(draft.type)}
                                    </span>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                        {draft.title}
                                    </h4>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        Saved {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'recently'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleDiscard(draft.key, e)}
                                    title="Discard draft"
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all active:scale-95"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => navigate(draft.link)}
                                    className="flex items-center gap-1.5 bg-slate-50 hover:bg-teal-50 dark:bg-slate-900 dark:hover:bg-teal-950/30 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border border-slate-100 dark:border-slate-800/50"
                                >
                                    <Edit3 size={12} />
                                    Resume
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
