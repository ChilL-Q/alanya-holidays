export interface PersonalDriver {
  id: string;
  name: string;
  company: string;
  vehicleType: string;
  vehicle: string;
  capacity: number;
  description: string;
  pricePerDay: number;
  pricePerHour: number;
  currency: string;
  image: string;
  includes: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  base: string;
  languages: string[];
}

export const driverTypes = [
  { id: "all", name: "All Services", icon: "ri-steering-2-line" },
  { id: "luxury-sedan", name: "Luxury Sedans", icon: "ri-car-line" },
  { id: "suv-van", name: "SUV & Vans", icon: "ri-bus-line" },
  { id: "airport-transfer", name: "Airport Transfers", icon: "ri-flight-land-line" },
  { id: "full-day", name: "Full Day Hire", icon: "ri-calendar-check-line" },
];

export const personalDrivers: PersonalDriver[] = [
  {
    id: "driver-001",
    name: "Murat",
    company: "Alanya Elite Chauffeur",
    vehicleType: "Luxury Sedan",
    vehicle: "Mercedes-Benz S-Class (2024)",
    capacity: 3,
    description: "Murat is the gold standard of private drivers on the Turkish Riviera — former head chauffeur at a five-star Antalya resort, now operating independently. His immaculate S-Class smells of fresh leather, the water bottles are always chilled, and he somehow always knows which route avoids traffic. Fluent English, a deep knowledge of the region, and the discretion of a seasoned diplomatic driver make him the first name on every returning guest's speed dial.",
    pricePerDay: 280,
    pricePerHour: 40,
    currency: "EUR",
    image: "/images/placeholder-business.svg",
    includes: ["Meet & greet at airport", "Chilled water & refreshments", "WiFi hotspot", "Phone chargers", "Umbrella service", "Child seat (on request)", "Route planning", "Toll & parking fees"],
    rating: 5.0,
    reviewCount: 47,
    featured: true,
    base: "Alanya City Center",
    languages: ["Turkish", "English", "German"],
  },
  {
    id: "driver-002",
    name: "Emre",
    company: "Alanya Elite Chauffeur",
    vehicleType: "SUV & Van",
    vehicle: "Mercedes-Benz V-Class (2024)",
    capacity: 7,
    description: "Emre is the driver you want when travelling with family, friends, or a mountain of luggage. His V-Class has captain seats that swivel, a panoramic roof, and enough legroom for a basketball team. A dad of three himself, Emre has an almost supernatural ability to keep kids entertained on longer drives — he keeps a stash of colouring books, Turkish delight, and a playlist of Disney songs in six languages. For adult groups, he transforms into a smooth, professional chauffeur who knows every vineyard, beach club, and sunset viewpoint between Alanya and Antalya.",
    pricePerDay: 240,
    pricePerHour: 35,
    currency: "EUR",
    image: "/images/placeholder-business.svg",
    includes: ["Meet & greet at airport", "Chilled water & refreshments", "WiFi hotspot", "Phone chargers", "Child seats (on request)", "Colouring books & activities for kids", "Route planning", "Toll & parking fees"],
    rating: 4.9,
    reviewCount: 38,
    featured: true,
    base: "Alanya City Center",
    languages: ["Turkish", "English"],
  },
  {
    id: "driver-003",
    name: "Kemal",
    company: "Riviera Transfers",
    vehicleType: "Airport Transfer",
    vehicle: "BMW 7 Series (2023)",
    capacity: 3,
    description: "Kemal specialises in one thing and does it perfectly: getting you from Antalya or Gazipaşa airport to your villa, resort, or yacht as smoothly and swiftly as possible. His black BMW 7 Series is whisper-quiet, the air conditioning is set to your preferred temperature before you land, and he tracks your flight in real time so he is already at arrivals when you walk through the gate — no waiting, no stress. For guests arriving late at night or departing before dawn, Kemal's calm, reassuring presence is worth every euro.",
    pricePerDay: 180,
    pricePerHour: 50,
    currency: "EUR",
    image: "/images/placeholder-business.svg",
    includes: ["Flight tracking & real-time adjustment", "Meet & greet with name sign", "Chilled water & refreshments", "WiFi hotspot", "Phone chargers", "Luggage assistance", "Toll & parking fees", "One complimentary stop (supermarket, ATM, or pharmacy)"],
    rating: 4.8,
    reviewCount: 61,
    featured: false,
    base: "Antalya Airport (AYT) & Gazipaşa Airport (GZP)",
    languages: ["Turkish", "English"],
  },
  {
    id: "driver-004",
    name: "Selçuk",
    company: "Riviera Transfers",
    vehicleType: "Luxury Sedan",
    vehicle: "Audi A8 L (2024)",
    capacity: 3,
    description: "Selçuk spent fifteen years as a driver for a diplomatic mission in Ankara before moving to the coast for a quieter life. The diplomatic training shows: he is faultlessly punctual, speaks four languages, navigates with the precision of a rally driver, and maintains a level of discretion that borders on invisible. His Audi A8 L is a mobile office — reclining rear seats with massage function, a fold-out tray table, and noise-cancelling cabin make it the preferred choice for business travellers who need to work or rest between meetings.",
    pricePerDay: 320,
    pricePerHour: 45,
    currency: "EUR",
    image: "/images/placeholder-business.svg",
    includes: ["Meet & greet at airport", "Chilled water & refreshments", "WiFi hotspot", "Phone chargers", "Mobile office setup (tray table)", "Newspaper selection", "Umbrella service", "Toll & parking fees"],
    rating: 4.9,
    reviewCount: 22,
    featured: true,
    base: "Alanya City Center",
    languages: ["Turkish", "English", "German", "Russian"],
  },
  {
    id: "driver-005",
    name: "Can & Team",
    company: "Alanya Elite Chauffeur",
    vehicleType: "SUV & Van",
    vehicle: "Mercedes-Benz Sprinter VIP (2023)",
    capacity: 12,
    description: "For wedding parties, corporate groups, or large families, Can and his team operate a fleet of VIP-configured Sprinters that turn group transport into a first-class experience. Leather club seating around tables, ambient LED lighting, a premium sound system, and a minibar stocked with soft drinks and snacks. Can himself is a former tour guide who knows every historical site, scenic stop, and great restaurant between Alanya and Antalya — he's as much a concierge as a driver.",
    pricePerDay: 380,
    pricePerHour: 55,
    currency: "EUR",
    image: "/images/placeholder-business.svg",
    includes: ["Meet & greet at airport", "Chilled water & refreshments", "Minibar with soft drinks & snacks", "WiFi hotspot", "Phone chargers", "Premium sound system", "Route planning & concierge tips", "Toll & parking fees"],
    rating: 4.7,
    reviewCount: 29,
    featured: false,
    base: "Alanya City Center",
    languages: ["Turkish", "English", "German"],
  },
  {
    id: "driver-006",
    name: "Deniz",
    company: "Turquoise Coast Drivers",
    vehicleType: "Full Day Hire",
    vehicle: "Range Rover Autobiography (2024)",
    capacity: 4,
    description: "Deniz is the driver you want when the journey is the destination. His Range Rover Autobiography glides over coastal switchbacks and mountain roads with equal composure, and Deniz knows every hidden cove, panoramic viewpoint, and off-the-map village along the Alanya coastline. He carries beach towels, snorkelling gear, and a cooler bag in the boot — because the best days out are the ones where you spontaneously decide to pull over for a swim. A trained lifeguard as well as a driver, he is the ultimate companion for a full day of coastal exploration.",
    pricePerDay: 260,
    pricePerHour: 40,
    currency: "EUR",
    image: "/images/placeholder-business.svg",
    includes: ["Full-day flexibility (8 hours)", "Chilled water & refreshments", "Beach towels & snorkelling gear", "Cooler bag", "WiFi hotspot", "Phone chargers", "Route planning", "Toll & parking fees"],
    rating: 4.9,
    reviewCount: 33,
    featured: true,
    base: "Alanya City Center",
    languages: ["Turkish", "English"],
  },
];