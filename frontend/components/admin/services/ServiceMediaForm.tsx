import React from 'react';
import { Plus, X } from 'lucide-react';
import { PhotoUploader } from '../../../components/ui/PhotoUploader';

interface ServiceMediaFormProps {
    service: any;
    setService: React.Dispatch<React.SetStateAction<any>>;
    uploadFiles: File[];
    setUploadFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const ServiceMediaForm: React.FC<ServiceMediaFormProps> = ({ service, setService, uploadFiles, setUploadFiles }) => {
    const handleImageAdd = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            setService((prev: any) => ({
                ...prev,
                images: [...(prev.images || []), url]
            }));
        }
    };

    const handleImageRemove = (index: number) => {
        setService((prev: any) => ({
            ...prev,
            images: prev.images?.filter((_: any, i: number) => i !== index)
        }));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Images</label>
                <button onClick={handleImageAdd} type="button" className="text-sm text-teal-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1">
                    <Plus size={16} /> Add URL
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {service.images?.map((url: string, idx: number) => (
                    <div key={idx} className="relative group aspect-video bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800/50">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => handleImageRemove(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {(!service.images || service.images.length === 0) && (
                    <p className="col-span-full text-slate-400 text-sm italic">No images added.</p>
                )}
            </div>

            <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload New Photos</h4>
                <PhotoUploader files={uploadFiles} onChange={setUploadFiles} maxFiles={5} />
            </div>
        </div>
    );
};
