import React from "react";
import type { ProductMedia } from "@/api-services/products.service";

interface ProductGalleryProps {
  productName: string;
  mediaImages: ProductMedia[];
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  categoryIcon: string;
}

export function ProductGallery({
  productName,
  mediaImages,
  activeImageIndex,
  onSelectImage,
  categoryIcon,
}: ProductGalleryProps) {
  return (
    <div className="w-full lg:w-1/2">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-background-100 border border-background-200/70 mb-4">
        {mediaImages.length > 0 ? (
          <img
            src={mediaImages[activeImageIndex]?.url}
            alt={productName}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className={`${categoryIcon} text-foreground-300 text-6xl`}></i>
          </div>
        )}
      </div>

      {mediaImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {mediaImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onSelectImage(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                idx === activeImageIndex
                  ? "border-primary-500 ring-2 ring-primary-200"
                  : "border-background-200 hover:border-foreground-300"
              }`}
            >
              <img
                src={img.url}
                alt={`${productName} view ${idx + 1}`}
                className="w-full h-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
