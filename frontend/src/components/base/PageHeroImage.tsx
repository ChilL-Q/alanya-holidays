import type { ComponentPropsWithoutRef, SyntheticEvent } from "react";

export const pageHeroImages = {
  about: "/images/home/alanya_castle.webp",
  blog: "/images/home/dim_river.webp",
  categories: "/images/categories/nature.webp",
  checkout: "/images/alanya-bazaar-hero.webp",
  communityHub: "/images/home/cleopatra_beach.webp",
  contact: "/images/home/alanya_castle.webp",
  events: "/images/home/cleopatra_beach.webp",
  explore: "/images/alanya-bazaar-hero.webp",
  forgotPassword: "/images/home/dim_river.webp",
  golfVacations: "/images/experiences/land_tours_new.webp",
  hammamSpa: "/images/experiences/wellness_hero.webp",
  helicopterTours: "/images/experiences/air_adventures_hero.webp",
  login: "/images/home/alanya_castle.webp",
  luxuryExperience: "/images/home/alanya_castle.webp",
  members: "/images/home/cleopatra_beach.webp",
  messages: "/images/home/dim_river.webp",
  newThread: "/images/home/dim_river.webp",
  personalChefs: "/images/home/turkish_cuisine.webp",
  personalDriver: "/images/transportation/cars/Rent-a-Car-Services-page.webp",
  personalShopper: "/images/categories/shopping.webp",
  photographyExcursions: "/images/home/alanya_castle.webp",
  privateJets: "/images/experiences/air_adventures_hero.webp",
  register: "/images/home/cleopatra_beach.webp",
  shop: "/images/alanya-bazaar-hero.webp",
  travelGuides: "/images/home/alanya_castle.webp",
  villaStays: "/images/categories/accommodations.webp",
  wineTastings: "/images/home/turkish_cuisine.webp",
  yachtCharters: "/images/experiences/water_sports_hero.webp",
} as const;

export type PageHeroImageKey = keyof typeof pageHeroImages;

const DEFAULT_HERO_FALLBACK = "/images/hero-bg.jpg";

export function getPageHeroImage(page: PageHeroImageKey): string {
  return pageHeroImages[page];
}

interface PageHeroImageProps extends Omit<ComponentPropsWithoutRef<"img">, "src"> {
  page: PageHeroImageKey;
  srcOverride?: string | null;
}

export default function PageHeroImage({
  page,
  srcOverride,
  alt,
  className = "absolute inset-0 w-full h-full object-cover object-top",
  onError,
  ...rest
}: PageHeroImageProps) {
  const resolvedSrc = srcOverride || getPageHeroImage(page);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    if (!img.src.endsWith(DEFAULT_HERO_FALLBACK)) {
      img.src = DEFAULT_HERO_FALLBACK;
    }
    onError?.(event);
  };

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
