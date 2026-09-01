/**
 * Regional Demographics & Tourism Statistics for Antalya Province & Alanya Riviera
 * Official sources: TÜİK (ADNKS 2024/2025), T.C. Kültür ve Turizm Bakanlığı, Göç İdaresi Başkanlığı, TÜRÇEV (FEE)
 */

export interface ProvinceMetric {
  id: string;
  value: number;
  formatted: string;
  label: string;
  subtext: string;
  icon: string;
  trend?: string;
  highlight?: boolean;
}

export interface NationalityShare {
  nationality: string;
  count: number;
  percentage: number;
  color: string;
  flag: string;
  description: string;
}

export interface DistrictForeignPop {
  district: string;
  count: number;
  percentage: number;
  isMainHub: boolean;
  color: string;
  description: string;
  totalPopulation: number;
  foreignShareInDistrict: number;
}

export interface MonthlyTourismSeasonality {
  month: string;
  shortMonth: string;
  tourists: number;
  formatted: string;
  share: number;
  season: "Low" | "Shoulder" | "Peak";
  tempAvgC: number;
  seaTempC: number;
}

export interface SourceCountryTourism {
  country: string;
  visitors: number;
  formatted: string;
  share: number;
  flag: string;
  color: string;
  growthRate: string;
}

export interface DistrictProfile {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  population: string;
  foreignPopulation: string;
  foreignPercentageOfDistrict: string;
  blueFlagBeaches: number;
  vibeSummary: string;
  highlights: string[];
  category: "Riviera & Beach" | "Urban & Culture" | "Nature & Adventure" | "Luxury & Golf";
  exploreFilterUrl: string;
  topExpats: string[];
}

export interface DataSourceCitation {
  id: string;
  institution: string;
  institutionTr: string;
  reportName: string;
  period: string;
  description: string;
  url: string;
  icon: string;
}

// 1. Headline Province Metrics
export const PROVINCE_HEADLINE_METRICS: ProvinceMetric[] = [
  {
    id: "population",
    value: 2720000,
    formatted: "2.72M",
    label: "Province Population",
    subtext: "5th largest province in Türkiye (TÜİK 2024)",
    icon: "ri-community-line",
    trend: "+2.1% YoY",
    highlight: false,
  },
  {
    id: "foreign_residents",
    value: 185000,
    formatted: "185K+",
    label: "Foreign Residents",
    subtext: "120+ registered nationalities with residence permits",
    icon: "ri-global-line",
    trend: "#1 Expat Coast in TR",
    highlight: true,
  },
  {
    id: "annual_tourists",
    value: 16900000,
    formatted: "16.9M",
    label: "Annual Tourists",
    subtext: "Record Mediterranean visitor volume (2024–2025)",
    icon: "ri-flight-takeoff-line",
    trend: "+8.4% YoY",
    highlight: true,
  },
  {
    id: "coastline",
    value: 640,
    formatted: "640 km",
    label: "Mediterranean Coastline",
    subtext: "From Kaş in the west to Gazipaşa in the east",
    icon: "ri-compass-3-line",
    trend: "Lycian & Pamphylian Riviera",
    highlight: false,
  },
  {
    id: "districts",
    value: 19,
    formatted: "19 Districts",
    label: "Municipal Districts",
    subtext: "Alanya as premier eastern coastal hub",
    icon: "ri-government-line",
    trend: "Metropolitan Municipality",
    highlight: false,
  },
  {
    id: "blue_flag_beaches",
    value: 233,
    formatted: "233",
    label: "Blue Flag Beaches",
    subtext: "#1 worldwide for eco-certified beaches (FEE)",
    icon: "ri-flag-line",
    trend: "Global Eco Benchmark",
    highlight: true,
  },
];

// 2. Nationality Breakdown (185,000 total foreign residents)
export const NATIONALITY_DISTRIBUTION: NationalityShare[] = [
  {
    nationality: "Russian Federation",
    count: 45000,
    percentage: 24.3,
    color: "#0ea5e9", // Sky Blue
    flag: "🇷🇺",
    description: "Established long-term resident & property owner community across Alanya & Konyaaltı.",
  },
  {
    nationality: "Germany",
    count: 32000,
    percentage: 17.3,
    color: "#f59e0b", // Amber
    flag: "🇩🇪",
    description: "Historic cultural & retiree ties, prominent in Alanya, Manavgat, and Side.",
  },
  {
    nationality: "Ukraine",
    count: 24000,
    percentage: 13.0,
    color: "#10b981", // Emerald
    flag: "🇺🇦",
    description: "Active community with family businesses, tech professionals, and cultural groups.",
  },
  {
    nationality: "Kazakhstan",
    count: 19000,
    percentage: 10.3,
    color: "#06b6d4", // Cyan
    flag: "🇰🇿",
    description: "Rapidly growing Central Asian expatriate base and property investors in Alanya.",
  },
  {
    nationality: "United Kingdom",
    count: 15000,
    percentage: 8.1,
    color: "#8b5cf6", // Violet
    flag: "🇬🇧",
    description: "Concentrated retiree & holiday home community in Kaş, Kalkan, and Alanya centre.",
  },
  {
    nationality: "Iran",
    count: 12000,
    percentage: 6.5,
    color: "#f43f5e", // Rose
    flag: "🇮🇷",
    description: "Significant presence in commercial enterprise, academia, and urban Antalya.",
  },
  {
    nationality: "Other (80+ Nations)",
    count: 38000,
    percentage: 20.5,
    color: "#94a3b8", // Slate
    flag: "🌐",
    description: "Nordics (Sweden, Norway, Finland), Netherlands, Poland, Middle East & Americas.",
  },
];

// 3. Foreign Residents by District (Top 8 Hubs)
export const DISTRICT_FOREIGN_POPULATION: DistrictForeignPop[] = [
  {
    district: "Alanya",
    count: 58500,
    percentage: 31.6,
    isMainHub: true,
    color: "#f97316", // Coral Orange
    description: "#1 International Riviera Hub — Largest expat population in Antalya province",
    totalPopulation: 364000,
    foreignShareInDistrict: 16.1,
  },
  {
    district: "Konyaaltı",
    count: 38200,
    percentage: 20.6,
    isMainHub: false,
    color: "#14b8a6", // Teal
    description: "Modern urban coastal community along 7km beachfront promenade",
    totalPopulation: 205000,
    foreignShareInDistrict: 18.6,
  },
  {
    district: "Muratpaşa",
    count: 32400,
    percentage: 17.5,
    isMainHub: false,
    color: "#0ea5e9", // Sky Blue
    description: "Historic heart of Antalya, Kaleiçi, and bustling central neighborhoods",
    totalPopulation: 520000,
    foreignShareInDistrict: 6.2,
  },
  {
    district: "Manavgat & Side",
    count: 18600,
    percentage: 10.1,
    isMainHub: false,
    color: "#f59e0b", // Amber
    description: "Riverfront and ancient heritage center with deep German & European roots",
    totalPopulation: 255000,
    foreignShareInDistrict: 7.3,
  },
  {
    district: "Kemer",
    count: 14100,
    percentage: 7.6,
    isMainHub: false,
    color: "#8b5cf6", // Violet
    description: "Pine-covered mountain foothills with scenic marina & CIS community",
    totalPopulation: 49000,
    foreignShareInDistrict: 28.8,
  },
  {
    district: "Kaş & Kalkan",
    count: 9200,
    percentage: 5.0,
    isMainHub: false,
    color: "#10b981", // Emerald
    description: "Bohemian Lycian coast favored by UK and European artists & divers",
    totalPopulation: 62000,
    foreignShareInDistrict: 14.8,
  },
  {
    district: "Serik & Belek",
    count: 7800,
    percentage: 4.2,
    isMainHub: false,
    color: "#ec4899", // Pink
    description: "Championship golf country and luxury resort residences",
    totalPopulation: 140000,
    foreignShareInDistrict: 5.6,
  },
  {
    district: "Kepez",
    count: 6200,
    percentage: 3.4,
    isMainHub: false,
    color: "#64748b", // Slate
    description: "Urban medical and educational hub with expanding international student body",
    totalPopulation: 615000,
    foreignShareInDistrict: 1.0,
  },
];

// 4. Monthly Tourist Arrivals Seasonality (16.9M Total)
export const TOURISM_SEASONALITY_DATA: MonthlyTourismSeasonality[] = [
  { month: "January", shortMonth: "Jan", tourists: 220000, formatted: "220K", share: 1.3, season: "Low", tempAvgC: 15, seaTempC: 18 },
  { month: "February", shortMonth: "Feb", tourists: 260000, formatted: "260K", share: 1.5, season: "Low", tempAvgC: 16, seaTempC: 17 },
  { month: "March", shortMonth: "Mar", tourists: 480000, formatted: "480K", share: 2.8, season: "Shoulder", tempAvgC: 18, seaTempC: 18 },
  { month: "April", shortMonth: "Apr", tourists: 1120000, formatted: "1.12M", share: 6.6, season: "Shoulder", tempAvgC: 22, seaTempC: 19 },
  { month: "May", shortMonth: "May", tourists: 1850000, formatted: "1.85M", share: 10.9, season: "Peak", tempAvgC: 26, seaTempC: 22 },
  { month: "June", shortMonth: "Jun", tourists: 2420000, formatted: "2.42M", share: 14.3, season: "Peak", tempAvgC: 31, seaTempC: 25 },
  { month: "July", shortMonth: "Jul", tourists: 2980000, formatted: "2.98M", share: 17.6, season: "Peak", tempAvgC: 34, seaTempC: 28 },
  { month: "August", shortMonth: "Aug", tourists: 3150000, formatted: "3.15M", share: 18.6, season: "Peak", tempAvgC: 34, seaTempC: 29 },
  { month: "September", shortMonth: "Sep", tourists: 2380000, formatted: "2.38M", share: 14.1, season: "Peak", tempAvgC: 31, seaTempC: 27 },
  { month: "October", shortMonth: "Oct", tourists: 1460000, formatted: "1.46M", share: 8.6, season: "Shoulder", tempAvgC: 26, seaTempC: 25 },
  { month: "November", shortMonth: "Nov", tourists: 410000, formatted: "410K", share: 2.4, season: "Low", tempAvgC: 21, seaTempC: 22 },
  { month: "December", shortMonth: "Dec", tourists: 170000, formatted: "170K", share: 1.0, season: "Low", tempAvgC: 17, seaTempC: 19 },
];

// 5. Top Source Countries for Tourism (16.9M Total)
export const SOURCE_COUNTRIES_DATA: SourceCountryTourism[] = [
  { country: "Russian Federation", visitors: 3850000, formatted: "3.85M", share: 22.8, flag: "🇷🇺", color: "#0ea5e9", growthRate: "+6.8%" },
  { country: "Germany", visitors: 3350000, formatted: "3.35M", share: 19.8, flag: "🇩🇪", color: "#f59e0b", growthRate: "+9.2%" },
  { country: "United Kingdom", visitors: 1520000, formatted: "1.52M", share: 9.0, flag: "🇬🇧", color: "#8b5cf6", growthRate: "+14.5%" },
  { country: "Poland", visitors: 1180000, formatted: "1.18M", share: 7.0, flag: "🇵🇱", color: "#ec4899", growthRate: "+18.2%" },
  { country: "Netherlands", visitors: 680000, formatted: "680K", share: 4.0, flag: "🇳🇱", color: "#f97316", growthRate: "+4.1%" },
  { country: "Kazakhstan", visitors: 620000, formatted: "620K", share: 3.7, flag: "🇰🇿", color: "#10b981", growthRate: "+11.4%" },
  { country: "Other Nations (150+)", visitors: 5700000, formatted: "5.70M", share: 33.7, flag: "🌐", color: "#64748b", growthRate: "+7.5%" },
];

// 6. District Profiles (8 Featured Districts)
export const DISTRICT_PROFILES: DistrictProfile[] = [
  {
    id: "alanya",
    name: "Alanya",
    tagline: "The Sun Capital & Premier International Expat Riviera",
    badge: "#1 International Riviera Hub",
    population: "364,000",
    foreignPopulation: "58,500",
    foreignPercentageOfDistrict: "16.1%",
    blueFlagBeaches: 68,
    category: "Riviera & Beach",
    vibeSummary:
      "A vibrant, self-sustaining coastal metropolis where the Taurus mountains plunge into warm Mediterranean waters. Renowned for its cosmopolitan energy, rich international culinary scene, year-round sun (300+ days), and diverse expat associations.",
    highlights: [
      "Cleopatra Beach & Damlataş Cave with curative microclimate",
      "13th-century Seljuk Castle, Red Tower & Ancient Shipyard",
      "Dim River canyon with cool mountain dining platforms",
    ],
    exploreFilterUrl: "/explore?district=Alanya",
    topExpats: ["Russians", "Germans", "Kazakhs", "Ukrainians", "Scandinavians"],
  },
  {
    id: "konyaalti",
    name: "Konyaaltı",
    tagline: "Modern Urban Beachfront & Digital Nomad Enclave",
    badge: "Urban Coastal Lifestyle",
    population: "205,000",
    foreignPopulation: "38,200",
    foreignPercentageOfDistrict: "18.6%",
    blueFlagBeaches: 24,
    category: "Urban & Culture",
    vibeSummary:
      "A modern, walkable coastal district featuring a world-class 7 km beachfront promenade, specialty coffee roasters, coworking facilities, and a thriving community of tech workers and international families.",
    highlights: [
      "7 km landscaped Blue Flag Beach Park Promenade",
      "Tünektepe Cable Car offering panoramic mountain-to-sea vistas",
      "Antalya Aquarium featuring one of the world's longest tunnel aquariums",
    ],
    exploreFilterUrl: "/explore?district=Konyaalti",
    topExpats: ["Russians", "Ukrainians", "Iranians", "Germans"],
  },
  {
    id: "muratpasa",
    name: "Muratpaşa",
    tagline: "The Historic Soul, Kaleiçi Old Town & Harbor",
    badge: "Heritage & Culture",
    population: "520,000",
    foreignPopulation: "32,400",
    foreignPercentageOfDistrict: "6.2%",
    blueFlagBeaches: 8,
    category: "Urban & Culture",
    vibeSummary:
      "The historical and cultural core of Antalya. Characterized by Ottoman-era stone mansions, ancient Roman fortifications, boutique art galleries, cliffside cafes overlooking the Gulf of Antalya, and lively nightspots.",
    highlights: [
      "Kaleiçi Historic Old Town & Hadrian's Roman Triumphal Gate",
      "Lower Düden Waterfalls plunging dramatically into the Mediterranean",
      "Antalya Archaeological Museum with Hellenistic & Roman marble statues",
    ],
    exploreFilterUrl: "/explore?district=Muratpasa",
    topExpats: ["Germans", "Russians", "Iranians", "British"],
  },
  {
    id: "manavgat",
    name: "Manavgat & Side",
    tagline: "Emerald Rivers, Roman Temples & Coastal Sanctuaries",
    badge: "Heritage & Nature",
    population: "255,000",
    foreignPopulation: "18,600",
    foreignPercentageOfDistrict: "7.3%",
    blueFlagBeaches: 42,
    category: "Nature & Adventure",
    vibeSummary:
      "Where classical antiquity meets lush nature. Side features breathtaking Roman temples right on the water's edge, surrounded by green river deltas, pine forests, and a loyal multi-generational European resident community.",
    highlights: [
      "Ancient Side peninsula with the seaside Temple of Apollo",
      "Manavgat Waterfall and serene shaded riverboat cruises",
      "Köprülü Canyon National Park for whitewater rafting & hiking",
    ],
    exploreFilterUrl: "/explore?district=Manavgat",
    topExpats: ["Germans", "Dutch", "Russians", "Austrians"],
  },
  {
    id: "kemer",
    name: "Kemer",
    tagline: "Pine Forest Mountains Meeting Turquoise Coves",
    badge: "Pine & Turquoise Coast",
    population: "49,000",
    foreignPopulation: "14,100",
    foreignPercentageOfDistrict: "28.8%",
    blueFlagBeaches: 47,
    category: "Riviera & Beach",
    vibeSummary:
      "Nestled beneath the towering Mount Tahtalı (2,365m), Kemer is famous for pine-shaded pebble beaches, mega yacht marinas, crystal-clear diving waters, and the highest proportion of foreign residents relative to population in the province.",
    highlights: [
      "Phaselis Ancient Harbor with aqueducts and 3 sheltered coves",
      "Olympos Teleferik cable car ascending Mount Tahtalı",
      "Göynük Canyon hiking trails and natural swimming ponds",
    ],
    exploreFilterUrl: "/explore?district=Kemer",
    topExpats: ["Russians", "Ukrainians", "Germans", "Kazakhs"],
  },
  {
    id: "kas",
    name: "Kaş & Kalkan",
    tagline: "Bohemian Lycian Sanctuary & Mediterranean Diving Capital",
    badge: "Bohemian Turquoise Haven",
    population: "62,000",
    foreignPopulation: "9,200",
    foreignPercentageOfDistrict: "14.8%",
    blueFlagBeaches: 12,
    category: "Nature & Adventure",
    vibeSummary:
      "An idyllic, low-rise bohemian haven preserving authentic Mediterranean charm. Loved by scuba divers, sailors, writers, and artists for its whitewashed bougainvillea alleys, Lycian rock tombs, and world-class culinary hideaways.",
    highlights: [
      "Kaputaş Beach with world-famous turquoise waters in a narrow canyon",
      "Sunken City of Simena / Kekova sea kayaking over underwater ruins",
      "Lycian Way world-class coastal trekking and scuba diving wrecks",
    ],
    exploreFilterUrl: "/explore?district=Kas",
    topExpats: ["British", "Germans", "Americans", "French"],
  },
  {
    id: "serik",
    name: "Serik & Belek",
    tagline: "Championship Golf Capital & Ultra-Luxury Spa Resorts",
    badge: "Luxury & Golf Capital",
    population: "140,000",
    foreignPopulation: "7,800",
    foreignPercentageOfDistrict: "5.6%",
    blueFlagBeaches: 22,
    category: "Luxury & Golf",
    vibeSummary:
      "Europe's premier golf destination boasting over 15 PGA championship courses designed by golf legends. Features ultra-luxury beachfront villas, elite sports academies, and ancient Greco-Roman theaters.",
    highlights: [
      "15+ World-Class Championship Golf Courses and clubhouses",
      "The Land of Legends Theme Park, Shopping Avenue & Kingdom",
      "Aspendos Ancient Roman Theater with world-renowned acoustics",
    ],
    exploreFilterUrl: "/explore?district=Serik",
    topExpats: ["Germans", "British", "Russians", "Finns"],
  },
  {
    id: "kepez",
    name: "Kepez",
    tagline: "Dynamic Inland Metropolis, Education & Innovation",
    badge: "Urban Metropolis & Innovation",
    population: "615,000",
    foreignPopulation: "6,200",
    foreignPercentageOfDistrict: "1.0%",
    blueFlagBeaches: 0,
    category: "Urban & Culture",
    vibeSummary:
      "Antalya's most populous and rapidly growing inland district. Home to extensive medical tourism facilities, university campuses, expansive cultural centers transformed from industrial heritage, and scenic pine parks.",
    highlights: [
      "Upper Düden Waterfalls and natural travertine cave formations",
      "DokumaPark cultural campus featuring science centers & toy museum",
      "Antalya Metropolitan Zoo & Nature Park in lush pine groves",
    ],
    exploreFilterUrl: "/explore?district=Kepez",
    topExpats: ["Iranians", "Azerbaijanis", "Russians", "Syrians"],
  },
];

// 7. Official Data Sources & Citations
export const OFFICIAL_DATA_SOURCES: DataSourceCitation[] = [
  {
    id: "tuik",
    institution: "Turkish Statistical Institute (TÜİK)",
    institutionTr: "Türkiye İstatistik Kurumu",
    reportName: "Address Based Population Registration System (ADNKS)",
    period: "2024 / 2025 Release",
    description:
      "Official national census and address-based demographic registry recording permanent resident population and legal foreign residents holding long-term residence permits in Antalya Province.",
    url: "https://www.tuik.gov.tr",
    icon: "ri-government-line",
  },
  {
    id: "ktb",
    institution: "Ministry of Culture and Tourism",
    institutionTr: "T.C. Kültür ve Turizm Bakanlığı",
    reportName: "Border Entry & Foreign Visitor Statistics Bulletin",
    period: "Annual 2024–2025 Consolidated",
    description:
      "Official border gate entry and departure logs compiled from Antalya International Airport (AYT) and Gazipaşa-Alanya Airport (GZP), monitoring inbound international tourism by source nationality.",
    url: "https://yigm.ktb.gov.tr",
    icon: "ri-flight-takeoff-line",
  },
  {
    id: "goc",
    institution: "Presidency of Migration Management",
    institutionTr: "Göç İdaresi Başkanlığı",
    reportName: "Foreign Nationals Residence Permit & Expatriate Statistics",
    period: "Quarterly Updated Registry",
    description:
      "Official residency registry monitoring short-term, family, student, and long-term residence permit holders categorized by nationality and district across Antalya Province.",
    url: "https://www.goc.gov.tr",
    icon: "ri-pass-valid-line",
  },
  {
    id: "turcev",
    institution: "Foundation for Environmental Education (FEE / TÜRÇEV)",
    institutionTr: "Türkiye Çevre Eğitim Vakfı",
    reportName: "Blue Flag International Eco-Label Beach Certification",
    period: "2025 / 2026 Season",
    description:
      "International environmental certification evaluating bathing water quality, safety services, environmental management, and accessibility for 233 beaches across Antalya province.",
    url: "https://www.turcev.org.tr",
    icon: "ri-flag-line",
  },
];

// Helper calculations
export const TOTAL_FOREIGN_POPULATION = NATIONALITY_DISTRIBUTION.reduce((acc, item) => acc + item.count, 0);
export const TOTAL_ANNUAL_TOURISTS = TOURISM_SEASONALITY_DATA.reduce((acc, item) => acc + item.tourists, 0);
export const PEAK_SEASON_TOURISTS = TOURISM_SEASONALITY_DATA
  .filter((item) => item.season === "Peak")
  .reduce((acc, item) => acc + item.tourists, 0);
export const PEAK_SEASON_PERCENTAGE = ((PEAK_SEASON_TOURISTS / TOTAL_ANNUAL_TOURISTS) * 100).toFixed(1);
