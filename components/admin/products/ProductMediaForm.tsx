import React from 'react';
import { Trash2 } from 'lucide-react';
import { PhotoUploader } from '../../../components/ui/PhotoUploader';

interface ProductMediaFormProps {
    existingImages: string[];
    removeExistingImage: (index: number) => void;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const ProductMediaForm: React.FC<ProductMediaFormProps> = ({
    existingImages, removeExistingImage, files, setFiles
}) => {
    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Photos</h2>

            {existingImages.length > 0 && (
                <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-4 mb-6">
                    {existingImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800/50">
                            <img src={url} alt="Existing" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeExistingImage(idx)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <PhotoUploader files={files} onChange={setFiles} maxFiles={5} />
        </div>
    );
};
