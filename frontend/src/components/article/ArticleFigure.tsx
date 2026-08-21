import { useState, useEffect } from "react";
import { X, ZoomIn } from "lucide-react";

export interface ArticleFigureProps {
  src: string;
  caption?: string;
  credit?: string;
  alt?: string;
  allowZoom?: boolean;
  className?: string;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";

export default function ArticleFigure({
  src,
  caption,
  credit,
  alt,
  allowZoom = true,
  className = "",
}: ArticleFigureProps) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK_IMAGE);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync if src changes externally
  useEffect(() => {
    setCurrentSrc(src || FALLBACK_IMAGE);
  }, [src]);

  // Handle ESC key for closing the modal
  useEffect(() => {
    if (!isZoomed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsZoomed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomed]);

  const effectiveAlt = alt || caption || "Article figure";
  const hasCaptionOrCredit = Boolean(caption || credit);

  const handleImageError = () => {
    if (currentSrc !== FALLBACK_IMAGE) {
      setCurrentSrc(FALLBACK_IMAGE);
    }
  };

  const handleOpenZoom = () => {
    if (allowZoom) {
      setIsZoomed(true);
    }
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  return (
    <>
      <figure className={`my-6 rounded-2xl overflow-hidden ${className}`}>
        <div className="relative group overflow-hidden rounded-2xl bg-background-100 dark:bg-background-800">
          <img
            src={currentSrc}
            alt={effectiveAlt}
            loading="lazy"
            onError={handleImageError}
            onClick={handleOpenZoom}
            className={`w-full h-auto object-cover max-h-[550px] transition-transform duration-300 ${
              allowZoom ? "cursor-zoom-in group-hover:scale-[1.015]" : ""
            }`}
          />

          {allowZoom && (
            <button
              type="button"
              onClick={handleOpenZoom}
              aria-label="Zoom image preview"
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}
        </div>

        {hasCaptionOrCredit && (
          <figcaption className="mt-2.5 px-1 text-center text-xs text-foreground-500 dark:text-foreground-400">
            {caption && <span>{caption}</span>}
            {credit && (
              <span className="ml-1.5 text-foreground-400 dark:text-foreground-500 font-medium">
                ({credit})
              </span>
            )}
          </figcaption>
        )}
      </figure>

      {/* Lightbox / Zoom Dialog Modal */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview lightbox"
          data-testid="image-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={handleCloseZoom}
        >
          <div
            className="relative max-w-5xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseZoom}
              aria-label="Close image preview"
              className="absolute -top-12 right-0 md:-right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Enlarged Image */}
            <img
              src={currentSrc}
              alt={effectiveAlt}
              onError={handleImageError}
              className="w-auto h-auto max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
            />

            {/* Lightbox Caption */}
            {hasCaptionOrCredit && (
              <div className="mt-4 text-center text-sm text-zinc-300 max-w-2xl px-4">
                {caption && <p>{caption}</p>}
                {credit && (
                  <p className="text-xs text-zinc-400 mt-1">({credit})</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
