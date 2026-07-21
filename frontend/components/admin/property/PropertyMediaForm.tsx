import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Camera, XCircle } from 'lucide-react';

interface PropertyMediaFormProps {
    existingImages: string[];
    onRemoveExisting: (index: number) => void;
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export const PropertyMediaForm: React.FC<PropertyMediaFormProps> = ({
    existingImages, onRemoveExisting, files, onFilesChange
}) => {
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {t('admin_prop.upload_title')}
            </h3>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/50 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/90/50 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files) {
                            onFilesChange(Array.from(e.target.files));
                        }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-teal-50 dark:bg-slate-800/50 text-teal-600 dark:text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera size={24} />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{t('admin_prop.upload_text')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('admin_prop.upload_hint')}</p>

                {(existingImages.length > 0 || files.length > 0) && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {existingImages.map((img, i) => (
                            <div key={`existing-${i}`} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                <img src={img} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onRemoveExisting(i);
                                    }}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <XCircle size={12} />
                                </button>
                            </div>
                        ))}
                        {files.map((f, i) => (
                            <span key={i} className="flex items-center justify-center w-20 h-20 text-xs bg-slate-200 dark:bg-slate-800/50 px-2 py-1 rounded text-slate-600 dark:text-slate-300 overflow-hidden break-words text-center relative z-10">
                                {f.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
