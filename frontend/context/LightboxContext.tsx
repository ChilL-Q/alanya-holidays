import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface LightboxImage {
    src: string;
    alt?: string;
    title?: string;
}

interface LightboxContextType {
    isOpen: boolean;
    images: LightboxImage[];
    currentIndex: number;
    openLightbox: (images: LightboxImage[] | string[], startIndex?: number) => void;
    closeLightbox: () => void;
    nextImage: () => void;
    prevImage: () => void;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

export const LightboxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [images, setImages] = useState<LightboxImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (inputImages: LightboxImage[] | string[], startIndex: number = 0) => {
        // Normalize input to LightboxImage[]
        const formattedImages: LightboxImage[] = inputImages.map(img =>
            typeof img === 'string' ? { src: img } : img
        );

        setImages(formattedImages);
        setCurrentIndex(startIndex);
        setIsOpen(true);
    };

    const closeLightbox = () => {
        setIsOpen(false);
        setTimeout(() => {
            setImages([]);
            setCurrentIndex(0);
        }, 300);
    };

    const nextImage = () => {
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    return (
        <LightboxContext.Provider value={{
            isOpen,
            images,
            currentIndex,
            openLightbox,
            closeLightbox,
            nextImage,
            prevImage
        }}>
            {children}
        </LightboxContext.Provider>
    );
};

export const useLightbox = () => {
    const context = useContext(LightboxContext);
    if (context === undefined) {
        throw new Error('useLightbox must be used within a LightboxProvider');
    }
    return context;
};
