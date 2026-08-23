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
    imageUrl: "https://readdy.ai/api/search-image?query=A%20close%20up%20editorial%20food%20photography%20of%20a%20traditional%20Turkish%20espresso%20served%20in%20a%20small%20copper%20handled%20cup%20with%20a%20thick%20layer%20of%20crema%2C%20accompanied%20by%20a%20square%20of%20pistachio%20Turkish%20delight%20lokum%20on%20a%20small%20ceramic%20plate%2C%20soft%20morning%20sunlight%20streaming%20through%20a%20window%20overlooking%20Alanya%20harbor%20with%20distant%20yachts%20and%20the%20Red%20Tower%2C%20warm%20golden%20tones%2C%20shallow%20depth%20of%20field%2C%20rustic%20wooden%20table%2C%20elegant%20composition%2C%20high%20detail%2C%20inviting%20and%20warm%20atmosphere&width=800&height=400&seq=coffee-tour-cafe-01&orientation=landscape",
  },
  {
    name: "Sweet Story Patisserie",
    address: "Atatürk Blv. No:88, Alanya Center",
    lat: 36.544,
    lng: 31.9925,
    description: "A pastel-hued patisserie tucked into a quiet side street. Glass counters overflow with éclairs, baklava, and their legendary chocolate soufflé — baked fresh every hour.",
    highlight: "The chocolate soufflé is non-negotiable. Pair it with their single-origin Ethiopian pour-over for the perfect contrast.",
    icon: "ri-cake-2-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20decadent%20chocolate%20souffle%20freshly%20baked%20in%20a%20white%20ramekin%20with%20a%20crackled%20top%20dusted%20with%20powdered%20sugar%2C%20alongside%20a%20glass%20carafe%20of%20single%20origin%20Ethiopian%20pour%20over%20coffee%20with%20a%20steaming%20ceramic%20cup%2C%20background%20shows%20a%20pastel%20hued%20French%20patisserie%20counter%20filled%20with%20glossy%20eclairs%20and%20baklava%2C%20soft%20diffused%20natural%20window%20light%2C%20editorial%20dessert%20photography%2C%20rich%20brown%20and%20cream%20tones%2C%20mouthwatering%20detail%2C%20elegant%20composition&width=800&height=400&seq=coffee-tour-cafe-02&orientation=landscape",
  },
  {
    name: "Liman Kahvecisi",
    address: "Rıhtım Cd. No:3, Alanya Harbor East",
    lat: 36.5428,
    lng: 31.9968,
    description: "An old-school Turkish coffee house that has been serving fishermen and sailors for over 40 years. Sand-brewed coffee, mosaic tables, and walls covered in black-and-white photos of old Alanya.",
    highlight: "Order the 'dibek kahvesi' — stone-ground coffee brewed in hot sand, served with a glass of cold water and a sliver of rose lokum.",
    icon: "ri-ancient-gate-line",
    imageUrl: "https://readdy.ai/api/search-image?query=An%20atmospheric%20close%20up%20of%20traditional%20Turkish%20sand%20brewed%20coffee%20also%20known%20as%20dibek%20kahvesi%2C%20a%20small%20copper%20cezve%20nestled%20in%20hot%20dark%20sand%20with%20bubbles%20forming%20at%20the%20rim%2C%20served%20in%20an%20ornate%20fincan%20on%20a%20mosaic%20patterned%20table%2C%20a%20sliver%20of%20rose%20flavored%20Turkish%20delight%20on%20the%20side%2C%20black%20and%20white%20vintage%20photographs%20of%20old%20Alanya%20visible%20on%20the%20wall%20behind%2C%20warm%20amber%20and%20copper%20tones%2C%20nostalgic%20and%20intimate%20mood%2C%20editorial%20travel%20photography%2C%20rich%20textures&width=800&height=400&seq=coffee-tour-cafe-03&orientation=landscape",
  },
  {
    name: "Keyf-i Kahve",
    address: "Damlataş Cd. No:42, Damlataş",
    lat: 36.5415,
    lng: 32.0015,
    description: "Nestled at the foot of the Damlataş Cave, this garden cafe is shaded by citrus trees. The air smells of orange blossom and freshly ground beans — it's effortlessly romantic.",
    highlight: "Their cold brew orange tonic is a summer revelation — citrusy, effervescent, and dangerously refreshing after a walk up to the castle.",
    icon: "ri-plant-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20refreshing%20tall%20glass%20of%20cold%20brew%20coffee%20mixed%20with%20orange%20tonic%20filled%20with%20ice%20cubes%20and%20garnished%20with%20a%20fresh%20orange%20slice%20and%20a%20sprig%20of%20mint%2C%20condensation%20on%20the%20glass%2C%20set%20on%20a%20rustic%20wooden%20table%20in%20a%20garden%20shaded%20by%20citrus%20trees%20with%20dappled%20sunlight%20filtering%20through%20the%20leaves%2C%20blurred%20green%20foliage%20background%2C%20bright%20summer%20vibe%2C%20vibrant%20orange%20and%20amber%20tones%2C%20editorial%20beverage%20photography%2C%20crisp%20and%20inviting%2C%20high%20detail&width=800&height=400&seq=coffee-tour-cafe-04&orientation=landscape",
  },
  {
    name: "Kahve Dünyası Alanya",
    address: "Keykubat Blv. No:156, Kleopatra",
    lat: 36.5475,
    lng: 31.9878,
    description: "A sleek, modern coffee bar a stone's throw from Kleopatra Beach. Floor-to-ceiling windows flood the space with light, and the terrace has unobstructed sea views.",
    highlight: "The flat white here rivals anything you'd find in Melbourne — velvety microfoam and a rich double ristretto base. Grab a seat on the terrace.",
    icon: "ri-water-flash-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20perfectly%20crafted%20flat%20white%20coffee%20in%20a%20sleek%20white%20ceramic%20cup%20with%20intricate%20latte%20art%20on%20top%20of%20velvety%20microfoam%2C%20placed%20on%20a%20marble%20table%20by%20a%20floor%20to%20ceiling%20window%20with%20an%20unobstructed%20view%20of%20the%20turquoise%20Mediterranean%20Sea%20and%20Kleopatra%20Beach%2C%20modern%20minimalist%20cafe%20interior%20with%20warm%20wood%20accents%2C%20bright%20natural%20daylight%20flooding%20the%20space%2C%20clean%20and%20airy%20composition%2C%20editorial%20coffee%20photography%2C%20serene%20blue%20and%20white%20tones%2C%20high%20end%20aesthetic&width=800&height=400&seq=coffee-tour-cafe-05&orientation=landscape",
  },
  {
    name: "Nazar Bahçe & Coffee",
    address: "Oba Mah. Çevre Yolu No:22, Oba",
    lat: 36.5512,
    lng: 32.0105,
    description: "A hidden garden oasis in the Oba district. String lights crisscross above olive trees, vintage kilims cover the benches, and the Turkish coffee is brewed the way grandmothers do it — slow and with intention.",
    highlight: "Come for the coffee, stay for the homemade 'cevizli sucuk' — walnut-stuffed grape molasses rolls sliced thin and served alongside your brew.",
    icon: "ri-tree-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20traditional%20Turkish%20coffee%20served%20in%20an%20ornate%20hand%20painted%20fincan%20on%20a%20small%20copper%20tray%2C%20accompanied%20by%20thinly%20sliced%20homemade%20cevizli%20sucuk%20which%20are%20walnut%20stuffed%20grape%20molasses%20rolls%20arranged%20beautifully%20on%20a%20rustic%20wooden%20cutting%20board%2C%20set%20in%20a%20magical%20garden%20oasis%20under%20olive%20trees%20with%20string%20lights%20softly%20glowing%20overhead%2C%20vintage%20Turkish%20kilim%20textiles%20on%20wooden%20benches%2C%20warm%20golden%20hour%20light%2C%20bohemian%20and%20romantic%20atmosphere%2C%20rich%20earthy%20tones%2C%20editorial%20food%20and%20travel%20photography%2C%20enchanting%20detail&width=800&height=400&seq=coffee-tour-cafe-06&orientation=landscape",
  },
  {
    name: "Roastery Alanya",
    address: "Barbaros Cd. No:67, Mahmutlar",
    lat: 36.5355,
    lng: 32.0188,
    description: "The final stop — a working micro-roastery where green beans from Brazil, Ethiopia, and Colombia are roasted on-site in a vintage Probat drum. The smell alone is worth the trip.",
    highlight: "Book a 15-minute cupping session (included with the gift card) and taste three single-origin roasts side by side — the perfect grand finale.",
    icon: "ri-fire-line",
    imageUrl: "https://readdy.ai/api/search-image?query=A%20professional%20coffee%20cupping%20session%20featuring%20three%20small%20white%20ceramic%20bowls%20each%20filled%20with%20different%20single%20origin%20roasted%20coffees%20from%20Brazil%20Ethiopia%20and%20Colombia%2C%20cupping%20spoons%20resting%20beside%20each%20bowl%2C%20a%20vintage%20copper%20Probat%20drum%20coffee%20roaster%20visible%20in%20the%20warm%20softly%20lit%20background%20of%20a%20working%20micro%20roastery%2C%20burlap%20sacks%20of%20green%20coffee%20beans%20stacked%20nearby%2C%20steam%20rising%20gently%2C%20industrial%20yet%20cozy%20atmosphere%2C%20rich%20browns%20and%20warm%20metallics%2C%20editorial%20specialty%20coffee%20photography%2C%20artisanal%20craftsmanship%20vibe%2C%20high%20detail%20and%20texture&width=800&height=400&seq=coffee-tour-cafe-07&orientation=landscape",
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
