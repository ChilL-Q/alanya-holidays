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
    image: "https://readdy.ai/api/search-image?query=Championship%20golf%20course%20at%20golden%20hour%20with%20perfectly%20manicured%20fairways%20winding%20through%20pine%20forests%20Mediterranean%20sun%20casting%20long%20shadows%20dramatic%20bunkers%20and%20pristine%20greens%20luxurious%20clubhouse%20in%20background%20Belek%20Antalya%20Turkey%20editorial%20golf%20photography%20high%20detail%20vibrant%20colors%20epic%20landscape%20composition&width=900&height=675&seq=golf-carya-001&orientation=landscape",
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
    image: "https://readdy.ai/api/search-image?query=Award-winning%20Montgomerie%20Maxx%20Royal%20golf%20course%20with%20pristine%20emerald%20fairways%20and%20large%20white%20sand%20bunkers%20surrounded%20by%20towering%20pine%20trees%20under%20bright%20blue%20Mediterranean%20sky%20elegant%20resort%20visible%20in%20distance%20luxury%20golf%20destination%20Belek%20Turkey%20editorial%20photography%20crisp%20details&width=900&height=675&seq=golf-montgomerie-002&orientation=landscape",
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
    image: "https://readdy.ai/api/search-image?query=Professional%20golf%20tournament%20setting%20PGA%20Sultan%20course%20Antalya%20Golf%20Club%20with%20dramatic%20water%20hazard%20guarding%20the%20green%20pristine%20fairway%20lined%20with%20palm%20trees%20and%20pine%20forest%20bright%20sunny%20day%20blue%20sky%20white%20clouds%20elite%20golfing%20destination%20Belek%20Turkey%20editorial%20sports%20photography%20wide%20angle%20stunning%20composition&width=900&height=675&seq=golf-sultan-003&orientation=landscape",
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
    image: "https://readdy.ai/api/search-image?query=Beautiful%20Nick%20Faldo%20designed%20golf%20course%20with%20undulating%20fairways%20and%20large%20sculpted%20bunkers%20framed%20by%20Mediterranean%20pine%20trees%20and%20sandy%20waste%20areas%20warm%20golden%20afternoon%20light%20dramatic%20shadows%20elegant%20resort%20clubhouse%20in%20background%20Belek%20Turkey%20editorial%20golf%20landscape%20photography%20rich%20natural%20colors%20serene%20atmosphere&width=900&height=675&seq=golf-faldo-004&orientation=landscape",
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
    image: "https://readdy.ai/api/search-image?query=Dramatic%20seaside%20links%20golf%20course%20with%20rolling%20dunes%20and%20windswept%20native%20grasses%20deep%20pot%20bunkers%20beside%20green%20fast-running%20fairways%20Mediterranean%20sea%20sparkling%20in%20background%20bright%20sunny%20sky%20white%20clouds%20unique%20golf%20landscape%20Lykia%20Links%20Belek%20Turkey%20editorial%20golf%20photography%20epic%20coastal%20composition&width=900&height=675&seq=golf-lykia-005&orientation=landscape",
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
    image: "https://readdy.ai/api/search-image?query=Panoramic%20view%20of%20Gloria%20Golf%20Resort%20with%20two%20championship%20courses%20winding%20through%20mixed%20pine%20forest%20and%20lakes%20bright%20emerald%20fairways%20pristine%20greens%20water%20features%20sparkling%20under%20Mediterranean%20sun%20luxury%20all-inclusive%20resort%20buildings%20visible%20in%20background%20Belek%20Turkey%20editorial%20travel%20photography%20stunning%20landscape&width=900&height=675&seq=golf-gloria-006&orientation=landscape",
    featured: true,
    groupSize: "2–8 players",
  },
];