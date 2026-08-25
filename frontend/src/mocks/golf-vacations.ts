export interface GolfVacation {
  id: string;
  name: string;
  club: string;
  location: string;
  description: string;
  pricePerPerson: number;
  priceIncludes: string[];
  holes: number;
  courses: string[];
  duration: string;
  difficulty: string;
  language: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
  image: string;
  featured: boolean;
  groupSize: string;
}

export const golfStyles = [
  { id: "all", name: "All Packages", icon: "ri-golf-ball-line" },
  { id: "championship", name: "Championship", icon: "ri-trophy-line" },
  { id: "all-inclusive", name: "All-Inclusive", icon: "ri-hotel-line" },
  { id: "weekend", name: "Weekend Getaways", icon: "ri-calendar-2-line" },
  { id: "beginner", name: "Beginner Friendly", icon: "ri-seedling-line" },
];

export const golfVacations: GolfVacation[] = [
  {
    id: "golf-001",
    name: "Carya Golf Classic",
    club: "Carya Golf Club",
    location: "Belek, Antalya — 25 min from Alanya",
    description: "Play Turkey's first and only floodlit championship course at Carya Golf Club, a Heathland-style masterpiece designed by Thomson, Perrett & Lobb. This package includes three rounds on the 18-hole championship course, deluxe accommodation at the adjacent five-star resort, and unlimited access to the practice facilities. The floodlights mean you can tee off under the stars — a truly unforgettable experience.",
    pricePerPerson: 680,
    priceIncludes: ["3 rounds (18 holes each)", "5-star accommodation (3 nights)", "Daily breakfast buffet", "Airport transfers", "Unlimited range balls", "GPS-equipped buggy"],
    holes: 18,
    courses: ["Championship Course (Par 72)", "Academy Course (Par 3)", "Floodlit Evening Course"],
    duration: "3 days / 3 nights",
    difficulty: "Intermediate",
    language: "English, Turkish, German",
    amenities: ["Floodlights", "Pro Shop", "Clubhouse Restaurant", "Spa", "Swimming Pool", "Buggy Fleet", "GPS Tracking", "Driving Range"],
    rating: 4.8,
    reviewCount: 124,
    image: "/images/placeholder-business.svg",
    featured: true,
    groupSize: "1–4 players",
  },
  {
    id: "golf-002",
    name: "Montgomerie Maxx Royal Experience",
    club: "Montgomerie Maxx Royal",
    location: "Belek, Antalya — 20 min from Alanya",
    description: "Designed by Colin Montgomerie in collaboration with European Golf Design, this 7,133-meter championship course is consistently ranked among Europe's top 10. The package includes four rounds, a private golf butler, and accommodation at the ultra-luxurious Maxx Royal Belek Golf Resort. Pine forests, sandy waste areas, and water hazards on 14 holes make every round a strategic masterpiece.",
    pricePerPerson: 1250,
    priceIncludes: ["4 rounds (18 holes each)", "Ultra-luxury resort (4 nights)", "Private golf butler", "Full board dining", "Spa access", "Airport transfers", "Golf cart with GPS"],
    holes: 18,
    courses: ["Montgomerie Championship (Par 72)", "Maxx Royal Short Course"],
    duration: "4 days / 4 nights",
    difficulty: "Advanced",
    language: "English, Turkish, German, Russian",
    amenities: ["Golf Butler", "Michelin-Star Dining", "Spa & Wellness", "Private Beach", "Pro Shop", "Buggy Fleet", "Caddie Service", "Driving Range"],
    rating: 4.9,
    reviewCount: 97,
    image: "/images/placeholder-business.svg",
    featured: true,
    groupSize: "1–4 players",
  },
  {
    id: "golf-003",
    name: "Antalya Golf Club PGA Sultan",
    club: "Antalya Golf Club",
    location: "Belek, Antalya — 25 min from Alanya",
    description: "Home to the Turkish Airlines Open, the PGA Sultan course at Antalya Golf Club is a bucket-list destination for serious golfers. Designed by European Golf Design, it mirrors the challenge and spectacle of the world's greatest links-style layouts. This 5-day package gives you unlimited access to both the Sultan and the Pasha courses, plus accommodation at the Sirene Belek Hotel.",
    pricePerPerson: 950,
    priceIncludes: ["Unlimited play on Sultan & Pasha", "5-star hotel (5 nights)", "Half-board dining", "Shared buggy", "Welcome gift pack", "Airport transfers"],
    holes: 36,
    courses: ["PGA Sultan (Par 71)", "Pasha Course (Par 72)"],
    duration: "5 days / 5 nights",
    difficulty: "Advanced",
    language: "English, Turkish, German",
    amenities: ["Two Championship Courses", "Pro Shop", "Clubhouse", "Restaurant & Bar", "Driving Range", "Buggy Fleet", "Caddie Service", "Golf Academy"],
    rating: 4.8,
    reviewCount: 156,
    image: "/images/placeholder-business.svg",
    featured: true,
    groupSize: "1–4 players",
  },
  {
    id: "golf-004",
    name: "Cornelia Faldo Weekend Retreat",
    club: "Cornelia Golf Club",
    location: "Belek, Antalya — 20 min from Alanya",
    description: "Designed by six-time Major winner Sir Nick Faldo, this 27-hole complex offers three distinct 9-hole loops — King, Queen, and Prince — each with its own personality. The Weekend Retreat is perfect for a short escape: two rounds, one night at the Cornelia Diamond Resort, and a sunset dinner at the clubhouse overlooking the 18th green.",
    pricePerPerson: 420,
    priceIncludes: ["2 rounds (18 holes each)", "Luxury resort (1 night)", "Sunset clubhouse dinner", "Breakfast buffet", "Shared buggy", "Range balls"],
    holes: 27,
    courses: ["King Course (Par 72)", "Queen Course (Par 72)", "Prince Course (Par 72)"],
    duration: "2 days / 1 night",
    difficulty: "All Levels",
    language: "English, Turkish",
    amenities: ["27 Holes (3 Loops)", "Pro Shop", "Clubhouse Restaurant", "Swimming Pool", "Driving Range", "Buggy Fleet", "Golf Academy"],
    rating: 4.7,
    reviewCount: 88,
    image: "/images/placeholder-business.svg",
    featured: false,
    groupSize: "1–4 players",
  },
  {
    id: "golf-005",
    name: "Lykia Links Coastal Challenge",
    club: "Lykia Links Golf",
    location: "Belek, Antalya — 30 min from Alanya",
    description: "The only true links course on the Mediterranean, Lykia Links sits directly on the coastline with holes running alongside the beach. Designed by Perry Dye, the course features rolling dunes, deep pot bunkers, and fast-running fairways shaped by sea breezes — pure Scottish links golf under the Turkish sun. This 3-day package is for golfers who want a completely different challenge.",
    pricePerPerson: 720,
    priceIncludes: ["3 rounds (18 holes each)", "Boutique hotel (3 nights)", "Half-board dining", "Shared buggy", "Practice facility access", "Airport transfers"],
    holes: 18,
    courses: ["Lykia Links Championship (Par 72)"],
    duration: "3 days / 3 nights",
    difficulty: "Advanced",
    language: "English, Turkish",
    amenities: ["True Links Design", "Beachside Holes", "Pro Shop", "Restaurant", "Driving Range", "Buggy Fleet", "Putting Green", "Locker Room"],
    rating: 4.6,
    reviewCount: 63,
    image: "/images/placeholder-business.svg",
    featured: false,
    groupSize: "1–4 players",
  },
  {
    id: "golf-006",
    name: "Gloria Golf All-Inclusive Week",
    club: "Gloria Golf Resort",
    location: "Belek, Antalya — 20 min from Alanya",
    description: "Gloria Golf Resort boasts two championship courses — the Old Course and the New Course — plus a 9-hole Verde course perfect for beginners. This all-inclusive week package is built for groups: unlimited golf, full-board dining, open bar, and access to the resort's private beach, spa, and nightlife. Ideal for a buddies' trip or corporate retreat.",
    pricePerPerson: 1550,
    priceIncludes: ["Unlimited golf (all courses)", "5-star all-inclusive (7 nights)", "Open bar", "Full-board dining", "Private beach access", "Spa & sauna", "Airport transfers", "Shared buggy"],
    holes: 45,
    courses: ["Old Course (Par 72)", "New Course (Par 72)", "Verde Course (Par 27)"],
    duration: "7 days / 7 nights",
    difficulty: "All Levels",
    language: "English, Turkish, German, French",
    amenities: ["45 Holes Total", "Pro Shop", "Multiple Restaurants", "Spa & Sauna", "Private Beach", "Buggy Fleet", "Golf Academy", "Nightlife"],
    rating: 4.7,
    reviewCount: 112,
    image: "/images/placeholder-business.svg",
    featured: true,
    groupSize: "2–8 players",
  },
];