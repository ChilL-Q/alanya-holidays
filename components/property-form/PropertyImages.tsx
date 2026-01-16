import React from 'react';
import { Camera } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PropertyImagesProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const PropertyImages: React.FC<PropertyImagesProps> = ({ files, setFiles }) => {
    const { t } = useLanguage();

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Property Images
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            setFiles(newFiles);
                        }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera size={24} />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload photos</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>

                {files.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {files.map((f, i) => (
                            <span key={i} className="flex items-center justify-center w-20 h-20 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 overflow-hidden break-words text-center">
                                {f.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
