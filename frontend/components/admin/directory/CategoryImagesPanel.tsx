import React, { useEffect, useRef, useState } from 'react';
import { storageService } from '../../../api-services';
import { toast } from 'react-hot-toast';
import { Upload, RotateCcw, Loader2 } from 'lucide-react';

const CATEGORIES: { id: string; label: string }[] = [
    { id: 'medical', label: 'Medical Tourism' },
    { id: 'accommodations', label: 'Accommodations' },
    { id: 'tours', label: 'Things to Do' },
    { id: 'transport', label: 'Transportation' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'cafes', label: 'Cafés & Coffee Shops' },
    { id: 'nature', label: 'Beaches & Nature' },
    { id: 'spa-hamam', label: 'Spa & Hamams' },
    { id: 'hair-beauty', label: 'Hair & Beauty' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'visa', label: 'Residency & Legal' },
    { id: 'shopping', label: 'Shopping & Souvenirs' },
];

export const CategoryImagesPanel: React.FC = () => {
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingCategoryRef = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        storageService.getCategoryImageOverrides()
            .then(map => { if (!cancelled) setOverrides(map); })
            .catch(e => console.error('Failed to load category image overrides', e))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handlePick = (categoryId: string) => {
        pendingCategoryRef.current = categoryId;
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const categoryId = pendingCategoryRef.current;
        e.target.value = '';
        if (!file || !categoryId) return;

        setBusyId(categoryId);
        try {
            const url = await storageService.uploadCategoryImage(categoryId, file);
            setOverrides(prev => ({ ...prev, [categoryId]: url }));
            toast.success('Category image updated');
        } catch (error: unknown) {
            console.error('Category image upload failed', error);
            toast.error(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setBusyId(null);
            pendingCategoryRef.current = null;
        }
    };

    const handleReset = async (categoryId: string) => {
        setBusyId(categoryId);
        try {
            await storageService.removeCategoryImage(categoryId);
            setOverrides(prev => {
                const next = { ...prev };
                delete next[categoryId];
                return next;
            });
            toast.success('Reverted to default image');
        } catch (error: unknown) {
            console.error('Category image reset failed', error);
            toast.error(error instanceof Error ? error.message : 'Reset failed');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
                These photos appear on the directory home page category tiles. Uploads replace the
                default image for everyone; Reset reverts to the default. JPEG, PNG or WebP, max 5MB —
                square images look best.
            </p>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelected}
            />

            {loading ? (
                <p className="text-slate-500 text-sm">Loading...</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {CATEGORIES.map(({ id, label }) => {
                        const isBusy = busyId === id;
                        const hasOverride = !!overrides[id];
                        return (
                            <div
                                key={id}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
                                    <img
                                        src={overrides[id] ?? `/images/categories/${id}.webp`}
                                        alt={label}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                    {hasOverride && (
                                        <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-teal-500 text-white px-1.5 py-0.5 rounded">
                                            Custom
                                        </span>
                                    )}
                                    {isBusy && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 size={22} className="text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 space-y-2">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{label}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePick(id)}
                                            disabled={isBusy}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                                        >
                                            <Upload size={13} /> Upload
                                        </button>
                                        {hasOverride && (
                                            <button
                                                onClick={() => handleReset(id)}
                                                disabled={isBusy}
                                                title="Revert to default image"
                                                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={13} /> Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
