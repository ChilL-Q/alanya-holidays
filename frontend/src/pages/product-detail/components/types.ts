import type { ProductDetail, ProductVariant, ProductSku } from "@/api-services/products.service";

export type { ProductDetail, ProductVariant, ProductSku };

export interface CafeStop {
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  highlight: string;
  icon: string;
  imageUrl: string;
}

export interface CountryCodeItem {
  code: string;
  flag: string;
  country: string;
}

export const COFFEE_TOUR_CAFES: CafeStop[] = [
  {
    name: "Craft Coffee Alanya",
    address: "İskele Cd. No:14, Alanya Harbor",
    lat: 36.5453,
    lng: 31.9982,
    description: "The tour kicks off at Alanya's original specialty coffee house — a sun-drenched corner spot right by the marina with views of bobbing yachts and the Red Tower.",
    highlight: "Try their signature Turkish espresso blend — a bold double shot with cardamom and a square of lokum on the side.",
    icon: "ri-ship-line",
    imageUrl: "/images/placeholder-business.svg",
  },
  {
    name: "Sweet Story Patisserie",
    address: "Atatürk Blv. No:88, Alanya Center",
    lat: 36.544,
    lng: 31.9925,
    description: "A pastel-hued patisserie tucked into a quiet side street. Glass counters overflow with éclairs, baklava, and their legendary chocolate soufflé — baked fresh every hour.",
    highlight: "The chocolate soufflé is non-negotiable. Pair it with their single-origin Ethiopian pour-over for the perfect contrast.",
    icon: "ri-cake-2-line",
    imageUrl: "/images/placeholder-business.svg",
  },
  {
    name: "Liman Kahvecisi",
    address: "Rıhtım Cd. No:3, Alanya Harbor East",
    lat: 36.5428,
    lng: 31.9968,
    description: "An old-school Turkish coffee house that has been serving fishermen and sailors for over 40 years. Sand-brewed coffee, mosaic tables, and walls covered in black-and-white photos of old Alanya.",
    highlight: "Order the 'dibek kahvesi' — stone-ground coffee brewed in hot sand, served with a glass of cold water and a sliver of rose lokum.",
    icon: "ri-ancient-gate-line",
    imageUrl: "/images/placeholder-business.svg",
  },
  {
    name: "Keyf-i Kahve",
    address: "Damlataş Cd. No:42, Damlataş",
    lat: 36.5415,
    lng: 32.0015,
    description: "Nestled at the foot of the Damlataş Cave, this garden cafe is shaded by citrus trees. The air smells of orange blossom and freshly ground beans — it's effortlessly romantic.",
    highlight: "Their cold brew orange tonic is a summer revelation — citrusy, effervescent, and dangerously refreshing after a walk up to the castle.",
    icon: "ri-plant-line",
    imageUrl: "/images/placeholder-business.svg",
  },
  {
    name: "Kahve Dünyası Alanya",
    address: "Keykubat Blv. No:156, Kleopatra",
    lat: 36.5475,
    lng: 31.9878,
    description: "A sleek, modern coffee bar a stone's throw from Kleopatra Beach. Floor-to-ceiling windows flood the space with light, and the terrace has unobstructed sea views.",
    highlight: "The flat white here rivals anything you'd find in Melbourne — velvety microfoam and a rich double ristretto base. Grab a seat on the terrace.",
    icon: "ri-water-flash-line",
    imageUrl: "/images/placeholder-business.svg",
  },
  {
    name: "Nazar Bahçe & Coffee",
    address: "Oba Mah. Çevre Yolu No:22, Oba",
    lat: 36.5512,
    lng: 32.0105,
    description: "A hidden garden oasis in the Oba district. String lights crisscross above olive trees, vintage kilims cover the benches, and the Turkish coffee is brewed the way grandmothers do it — slow and with intention.",
    highlight: "Come for the coffee, stay for the homemade 'cevizli sucuk' — walnut-stuffed grape molasses rolls sliced thin and served alongside your brew.",
    icon: "ri-tree-line",
    imageUrl: "/images/placeholder-business.svg",
  },
  {
    name: "Roastery Alanya",
    address: "Barbaros Cd. No:67, Mahmutlar",
    lat: 36.5355,
    lng: 32.0188,
    description: "The final stop — a working micro-roastery where green beans from Brazil, Ethiopia, and Colombia are roasted on-site in a vintage Probat drum. The smell alone is worth the trip.",
    highlight: "Book a 15-minute cupping session (included with the gift card) and taste three single-origin roasts side by side — the perfect grand finale.",
    icon: "ri-fire-line",
    imageUrl: "/images/placeholder-business.svg",
  },
];

export const COFFEE_TOUR_PRODUCT_ID = 100013;

export const COUNTRY_CODES: CountryCodeItem[] = [
  { code: "+90", flag: "🇹🇷", country: "Turkey" },
  { code: "+44", flag: "🇬🇧", country: "UK" },
  { code: "+1", flag: "🇺🇸", country: "US / Canada" },
  { code: "+49", flag: "🇩🇪", country: "Germany" },
  { code: "+33", flag: "🇫🇷", country: "France" },
  { code: "+7", flag: "🇷🇺", country: "Russia" },
  { code: "+31", flag: "🇳🇱", country: "Netherlands" },
  { code: "+46", flag: "🇸🇪", country: "Sweden" },
  { code: "+47", flag: "🇳🇴", country: "Norway" },
  { code: "+45", flag: "🇩🇰", country: "Denmark" },
  { code: "+358", flag: "🇫🇮", country: "Finland" },
  { code: "+380", flag: "🇺🇦", country: "Ukraine" },
  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
  { code: "+974", flag: "🇶🇦", country: "Qatar" },
  { code: "+39", flag: "🇮🇹", country: "Italy" },
  { code: "+34", flag: "🇪🇸", country: "Spain" },
  { code: "+30", flag: "🇬🇷", country: "Greece" },
  { code: "+48", flag: "🇵🇱", country: "Poland" },
  { code: "+40", flag: "🇷🇴", country: "Romania" },
];

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
}

export function getWalkingEstimate(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const distanceM = haversineDistance(lat1, lng1, lat2, lng2);
  const walkSpeedMperMin = 83; // ~5 km/h
  const minutes = Math.round(distanceM / walkSpeedMperMin);
  if (minutes < 1) return "<1 min walk";
  return `~${minutes} min walk`;
}

export function getTotalWalkTime(cafes: CafeStop[]): { totalMinutes: number; label: string } {
  let totalM = 0;
  for (let i = 0; i < cafes.length - 1; i++) {
    totalM += Math.round(haversineDistance(cafes[i].lat, cafes[i].lng, cafes[i + 1].lat, cafes[i + 1].lng) / 83);
  }
  if (totalM < 60) return { totalMinutes: totalM, label: `~${totalM} min` };
  const hrs = Math.floor(totalM / 60);
  const mins = totalM % 60;
  if (mins === 0) return { totalMinutes: totalM, label: `~${hrs}h` };
  return { totalMinutes: totalM, label: `~${hrs}h ${mins}m` };
}
