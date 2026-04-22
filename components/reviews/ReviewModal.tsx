import React, { useState, useRef } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { useSubmitShortcut } from '../../hooks/useSubmitShortcut';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../api-services';
import { toast } from 'react-hot-toast';
import { Modal } from '../ui/Modal';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    userId: string;
    onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, propertyId, userId: _userId, onSuccess }) => {
    const { t } = useLanguage();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);

        try {
            const uploadedUrls: string[] = [];
            for (const file of images) {
                const url = await db.uploadImage(file, 'properties'); // Fallback bucket
                if (url) uploadedUrls.push(url);
            }

            await db.addReview({
                property_id: propertyId,
                rating,
                comment,
                images: uploadedUrls
            });

            toast.success(t('reviews.success'));
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            console.error(error);
            // Show exact error message to help debugging (e.g. RLS policy violation)
            toast.error(error instanceof Error ? error.message : t('reviews.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    useSubmitShortcut(handleSubmit);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Modal component handles isOpen check, but we can keep it here to avoid render if closed
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('reviews.write_title')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('reviews.rating_label')}</label>
                    <div className="flex gap-2" role="group" aria-label={t('reviews.rating_label')}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                aria-label={`${star} Stars`}
                                aria-pressed={star <= rating}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`${star <= rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-slate-300 dark:text-slate-400'}`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label htmlFor="review-comment" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('reviews.experience_label')}</label>
                    <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition text-slate-900 dark:text-white resize-none"
                        placeholder={t('reviews.placeholder')}
                        required
                    />
                </div>

                {/* Photos */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('reviews.photos_label')}</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {images.map((file, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Review upload ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                    aria-label="Remove image"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800/50 rounded-lg text-slate-400 hover:border-teal-500 hover:text-teal-500 dark:text-cyan-400 transition"
                            aria-label={t('reviews.add_photo')}
                        >
                            <Upload size={20} />
                            <span className="text-xs mt-1">{t('reviews.add_photo')}</span>
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

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? t('reviews.submitting') : t('reviews.submit')}
                    </button>
                </div>
            </form>
        </Modal >
    );
};
