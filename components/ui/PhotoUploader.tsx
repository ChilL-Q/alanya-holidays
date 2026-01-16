import React, { useRef, useState } from 'react';
import { Camera, X, UploadCloud, Image as ImageIcon } from 'lucide-react';

interface PhotoUploaderProps {
    files: File[];
    onChange: (files: File[]) => void;
    maxFiles?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ files, onChange, maxFiles = 10 }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const validFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
        const combinedFiles = [...files, ...validFiles].slice(0, maxFiles);
        onChange(combinedFiles);
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onChange(newFiles);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative
          ${dragActive
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10'
                        : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />

                <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={32} />
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    Click or drag photos here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Upload up to {maxFiles} photos (JPG, PNG)
                </p>
            </div>

            {/* Previews */}
            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.map((file, index) => (
                        <div key={index} className="relative aspect-square group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering parent click if any
                                    removeFile(index);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 text-rose-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                type="button"
                            >
                                <X size={16} />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md font-medium backdrop-blur-sm">
                                    Cover Photo
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
