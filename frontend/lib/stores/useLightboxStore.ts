import { create } from 'zustand';

export interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
}

interface LightboxState {
  isOpen: boolean;
  images: LightboxImage[];
  currentIndex: number;
  openLightbox: (inputImages: LightboxImage[] | string[], startIndex?: number) => void;
  closeLightbox: () => void;
  nextImage: () => void;
  prevImage: () => void;
}

export const useLightboxStore = create<LightboxState>((set, get) => ({
  isOpen: false,
  images: [],
  currentIndex: 0,
  openLightbox: (inputImages, startIndex = 0) => {
    const formattedImages: LightboxImage[] = inputImages.map((img) =>
      typeof img === 'string' ? { src: img } : img
    );
    set({
      images: formattedImages,
      currentIndex: startIndex,
      isOpen: true,
    });
  },
  closeLightbox: () => {
    set({ isOpen: false });
    setTimeout(() => {
      set({ images: [], currentIndex: 0 });
    }, 300);
  },
  nextImage: () => {
    const { images, currentIndex } = get();
    if (images.length > 1) {
      set({ currentIndex: (currentIndex + 1) % images.length });
    }
  },
  prevImage: () => {
    const { images, currentIndex } = get();
    if (images.length > 1) {
      set({ currentIndex: (currentIndex - 1 + images.length) % images.length });
    }
  },
}));
