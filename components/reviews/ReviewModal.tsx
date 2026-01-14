import React, { useState, useRef } from 'react';
import { Star, X, Upload, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    userId: string;
    onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, propertyId, userId, onSuccess }) => {
    const { t } = useLanguage();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const uploadedUrls: string[] = [];
            for (const file of images) {
                const url = await db.uploadImage(file, 'properties'); // Fallback bucket
                if (url) uploadedUrls.push(url);
            }

            await db.addReview({
                property_id: propertyId,
                user_id: userId,
                rating,
                comment,
                images: uploadedUrls
            });

            toast.success(t['reviews.success']);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(t['reviews.error']);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t['reviews.write_title']}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t['reviews.rating_label']}</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={`${star <= rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-slate-300 dark:text-slate-600'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t['reviews.experience_label']}</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition text-slate-900 dark:text-white"
                                placeholder={t['reviews.placeholder']}
                                required
                            />
                        </div>

                        {/* Photos */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t['reviews.photos_label']}</label>
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {images.map((file, i) => (
                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 hover:border-teal-500 hover:text-teal-500 transition"
                                >
                                    <Upload size={20} />
                                    <span className="text-xs mt-1">{t['reviews.add_photo']}</span>
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? t['reviews.submitting'] : t['reviews.submit']}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
