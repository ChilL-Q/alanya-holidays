export interface PrivateJet {
  id: string;
  name: string;
  company: string;
  type: "Light Jet" | "Midsize Jet" | "Heavy Jet" | "VIP Airliner";
  capacity: number;
  range: string;
  speed: string;
  pricePerHour: number;
  currency: string;
  minHours: number;
  image: string;
  description: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
  featured: boolean;
  base: string;
}

export const jetTypes = [
  { id: "all", name: "All Aircraft", icon: "ri-plane-line" },
  { id: "light-jet", name: "Light Jets", icon: "ri-flight-takeoff-line" },
  { id: "midsize-jet", name: "Midsize Jets", icon: "ri-flight-land-line" },
  { id: "heavy-jet", name: "Heavy Jets", icon: "ri-rocket-line" },
  { id: "vip-airliner", name: "VIP Airliners", icon: "ri-vip-crown-line" },
];

export const privateJets: PrivateJet[] = [
  {
    id: "jet-001",
    name: "Citation Mustang",
    company: "Atlas Jet Alanya",
    type: "Light Jet",
    capacity: 4,
    range: "2,160 km",
    speed: "630 km/h",
    pricePerHour: 2400,
    currency: "EUR",
    minHours: 2,
    image: "https://readdy.ai/api/search-image?query=Cessna%20Citation%20Mustang%20light%20private%20jet%20parked%20on%20tarmac%20at%20small%20regional%20airport%20golden%20hour%20Mediterranean%20coastline%20in%20distance%20sleek%20white%20fuselage%20with%20blue%20stripe%20elegant%20compact%20business%20aircraft%20aviation%20photography%20high%20detail%20professional%20quality&width=900&height=600&seq=jet-mustang-001&orientation=landscape",
    description: "The Citation Mustang is the perfect entry into private aviation — compact, efficient, and surprisingly spacious for a light jet. With seating for four and a range that covers the entire Eastern Mediterranean, it is ideal for quick hops from Antalya to Istanbul, Athens, or the Greek islands. The leather interior, onboard WiFi, and a galley with chilled refreshments make every flight feel first-class.",
    amenities: ["WiFi", "Leather Seats", "Galley", "Air Conditioning", "Private Lavatory", "Beverage Service", "Power Outlets", "Noise-Cancelling Cabin"],
    rating: 4.7,
    reviewCount: 38,
    featured: false,
    base: "Gazipaşa-Alanya Airport (GZP)",
  },
  {
    id: "jet-002",
    name: "Phenom 300E",
    company: "Bosphorus Air",
    type: "Light Jet",
    capacity: 6,
    range: "3,650 km",
    speed: "839 km/h",
    pricePerHour: 3200,
    currency: "EUR",
    minHours: 2,
    image: "https://readdy.ai/api/search-image?query=Embraer%20Phenom%20300E%20sleek%20light%20jet%20on%20runway%20at%20golden%20hour%20dramatic%20sky%20background%20polished%20white%20fuselage%20with%20sweeping%20lines%20modern%20cockpit%20windows%20aviation%20photography%20elegant%20design%20high%20detail%20professional%20quality&width=900&height=600&seq=jet-phenom-002&orientation=landscape",
    description: "The Phenom 300E has been the world's best-selling light jet for over a decade — and for good reason. Its class-leading speed, generous cabin with a fully enclosed lavatory, and the ability to reach destinations as far as London or Dubai non-stop make it the most versatile aircraft in our fleet. Bosphorus Air outfits theirs with hand-stitched leather, a lie-flat divan, and a cabin management system controlled from your own device.",
    amenities: ["WiFi", "Lie-Flat Seating", "Galley", "Enclosed Lavatory", "Cabin Management System", "Beverage Service", "Power Outlets", "Overhead Storage"],
    rating: 4.9,
    reviewCount: 56,
    featured: true,
    base: "Antalya International Airport (AYT)",
  },
  {
    id: "jet-003",
    name: "Citation Sovereign+",
    company: "Med Sky Charter",
    type: "Midsize Jet",
    capacity: 8,
    range: "5,460 km",
    speed: "850 km/h",
    pricePerHour: 4800,
    currency: "EUR",
    minHours: 3,
    image: "https://readdy.ai/api/search-image?query=Cessna%20Citation%20Sovereign%20midsize%20business%20jet%20on%20tarmac%20under%20bright%20blue%20sky%20polished%20white%20fuselage%20with%20gold%20accent%20stripe%20sleek%20modern%20profile%20extending%20wings%20elegant%20corporate%20aviation%20photography%20premium%20quality%20crisp%20details&width=900&height=600&seq=jet-sovereign-003&orientation=landscape",
    description: "For groups who need to go further in serious comfort, the Citation Sovereign+ delivers. This transcontinental midsize jet seats eight in a stand-up cabin with a full galley, a private aft lavatory with a vanity, and a baggage compartment accessible in flight. The range comfortably reaches all of Europe, North Africa, and the Middle East non-stop. Med Sky Charter's crew — two pilots and a dedicated cabin attendant — elevate the experience with bespoke catering and a curated in-flight entertainment library.",
    amenities: ["WiFi", "Full Galley", "Stand-Up Cabin", "Private Lavatory with Vanity", "In-Flight Accessible Baggage", "Dedicated Cabin Attendant", "Bespoke Catering", "Entertainment System", "Power Outlets", "Conference Table"],
    rating: 4.8,
    reviewCount: 42,
    featured: true,
    base: "Antalya International Airport (AYT)",
  },
  {
    id: "jet-004",
    name: "Legacy 500",
    company: "Bosphorus Air",
    type: "Midsize Jet",
    capacity: 9,
    range: "5,780 km",
    speed: "870 km/h",
    pricePerHour: 5500,
    currency: "EUR",
    minHours: 3,
    image: "https://readdy.ai/api/search-image?query=Embraer%20Legacy%20500%20executive%20jet%20parked%20on%20private%20apron%20modern%20glass%20terminal%20building%20in%20background%20bright%20sunny%20day%20sleek%20dark%20and%20white%20fuselage%20design%20sophisticated%20business%20aviation%20photography%20luxury%20aircraft%20premium%20composition&width=900&height=600&seq=jet-legacy-004&orientation=landscape",
    description: "The Legacy 500 redefined the midsize category with its flat-floor cabin and six-foot stand-up headroom — you genuinely forget you are on a jet. The club-four seating arrangement converts into a conference space or a dining lounge, while the rear cabin features a full galley and the quietest lavatory in its class. Bosphorus Air's version has an extended entertainment suite, a curated wine list, and a cabin attendant who doubles as a trained sommelier.",
    amenities: ["WiFi", "Full Galley", "Flat-Floor Cabin", "Stand-Up Headroom", "Lie-Flat Seats", "Conference Table", "Enclosed Lavatory", "Entertainment Suite", "Curated Wine List", "Sommelier Service", "Power Outlets"],
    rating: 4.9,
    reviewCount: 29,
    featured: true,
    base: "Antalya International Airport (AYT)",
  },
  {
    id: "jet-005",
    name: "Gulfstream G450",
    company: "Aegean Wings Elite",
    type: "Heavy Jet",
    capacity: 14,
    range: "8,060 km",
    speed: "904 km/h",
    pricePerHour: 7800,
    currency: "EUR",
    minHours: 4,
    image: "https://readdy.ai/api/search-image?query=Gulfstream%20G450%20large%20cabin%20business%20jet%20on%20runway%20at%20sunset%20dramatic%20sky%20with%20orange%20and%20purple%20hues%20elegant%20white%20fuselage%20with%20blue%20cheatline%20iconic%20Gulfstream%20oval%20windows%20powerful%20presence%20ultra%20luxury%20aviation%20photography%20breathtaking%20composition&width=900&height=600&seq=jet-gulfstream-005&orientation=landscape",
    description: "The Gulfstream G450 is a statement. With a cabin that stretches over 13 meters, it accommodates up to fourteen guests across four living areas — forward lounge, conference suite, dining salon, and a private stateroom with a full-size berth. The range covers almost any city pair across Europe, the Middle East, and beyond. Aegean Wings Elite's G450 features custom interiors by a Milanese design house, a dedicated two-person cabin crew, and in-flight dining prepared by a Michelin-trained chef.",
    amenities: ["WiFi", "Full Galley", "Four Living Areas", "Private Stateroom", "Conference Suite", "Dining Salon", "Two Lavatories", "Dedicated Cabin Crew", "Chef-Prepared Dining", "Entertainment System", "Satellite Phone", "Power Outlets"],
    rating: 5.0,
    reviewCount: 18,
    featured: true,
    base: "Antalya International Airport (AYT)",
  },
  {
    id: "jet-006",
    name: "Hawker 800XP",
    company: "Atlas Jet Alanya",
    type: "Midsize Jet",
    capacity: 8,
    range: "4,630 km",
    speed: "830 km/h",
    pricePerHour: 4200,
    currency: "EUR",
    minHours: 2,
    image: "https://readdy.ai/api/search-image?query=Hawker%20800XP%20business%20jet%20on%20tarmac%20at%20regional%20airport%20golden%20afternoon%20light%20classic%20British%20design%20with%20distinctive%20tail%20section%20sleek%20white%20fuselage%20polished%20aluminum%20leading%20edges%20reliable%20workhorse%20aviation%20photography%20professional%20crisp%20composition&width=900&height=600&seq=jet-hawker-006&orientation=landscape",
    description: "A proven workhorse with a reputation for reliability, the Hawker 800XP is the smart choice for regional business travel. Eight seats in a club-four configuration, a generous galley capable of hot meal service, and a cabin that feels more spacious than its dimensions suggest. Atlas Jet operates this aircraft primarily from Gazipaşa-Alanya Airport, making it the most convenient option for guests staying in Alanya — no three-hour drive to Antalya required.",
    amenities: ["WiFi", "Full Galley", "Club-Four Seating", "Private Lavatory", "Hot Meal Service", "Beverage Service", "Power Outlets", "Overhead Storage"],
    rating: 4.6,
    reviewCount: 34,
    featured: false,
    base: "Gazipaşa-Alanya Airport (GZP)",
  },
];