import React from 'react';
import { Trash2 } from 'lucide-react';
import { PhotoUploader } from '../../../components/ui/PhotoUploader';

interface DirectoryGalleryProps {
    existingImages: string[];
    onRemoveExisting: (index: number) => void;
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export const DirectoryGallery: React.FC<DirectoryGalleryProps> = ({
    existingImages, onRemoveExisting, files, onFilesChange
}) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Gallery Images</h2>

            {existingImages.length > 0 && (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                    {existingImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-[4/3] group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800/50">
                            <img src={url} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onRemoveExisting(idx)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <PhotoUploader files={files} onChange={onFilesChange} maxFiles={10} />
        </div>
    );
};
