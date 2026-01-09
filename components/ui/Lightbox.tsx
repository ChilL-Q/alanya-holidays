import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLightbox } from '../../context/LightboxContext';

export const Lightbox: React.FC = () => {
    const {
        isOpen,
        images,
        currentIndex,
        closeLightbox,
        nextImage,
        prevImage
    } = useLightbox();

    const currentImage = images[currentIndex];

    // Key handlers
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    }, [isOpen, closeLightbox, nextImage, prevImage]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen || !currentImage) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={closeLightbox}
        >
            {/* Controls */}
            <button
                onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            >
                <X size={32} />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110 active:scale-95"
                    >
                        <ChevronLeft size={40} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110 active:scale-95"
                    >
                        <ChevronRight size={40} />
                    </button>
                </>
            )}

            {/* Main Image Container */}
            <div
                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative overflow-hidden rounded-lg shadow-2xl animate-in zoom-in-95 duration-300">
                    <img
                        src={currentImage.src}
                        alt={currentImage.alt || currentImage.title || 'Lightbox'}
                        className="max-w-full max-h-[85vh] object-contain select-none"
                    />
                </div>

                {/* Caption */}
                {(currentImage.title || currentImage.alt || images.length > 1) && (
                    <div className="mt-4 text-center">
                        {images.length > 1 && (
                            <div className="text-white/60 text-sm mb-1">
                                {currentIndex + 1} / {images.length}
                            </div>
                        )}
                        {(currentImage.title || currentImage.alt) && (
                            <h3 className="text-white text-lg font-medium">
                                {currentImage.title || currentImage.alt}
                            </h3>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
