import { Money } from "@/domain/money.vo";

export interface GiftCardTier {
  id: string;
  name: string;
  price: number; // in EUR decimal (e.g. 15.00)
  money: Money;
  perks: string[];
  description: string;
  recommended?: boolean;
}

export type BadgeVariant = "accent" | "primary" | "secondary" | "gold";

export interface GiftCardCollection {
  id: string;
  productId: number;
  title: string;
  category: string;
  tagline: string;
  badge: string;
  badgeType: BadgeVariant;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  validity: string;
  icon: string;
  tiers: GiftCardTier[];
}

export interface RedemptionStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  tag: string;
}

export interface GiftCardFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const GIFT_CARD_CATEGORIES = [
  "All Experiences",
  "Patisserie & Sweets",
  "Breakfast & Roastery",
  "Traditional Culture",
  "Tasting Tour",
  "Gift Bundles & Merch",
  "Luxury Dining",
] as const;

export const GIFT_CARD_COLLECTIONS: GiftCardCollection[] = [
  {
    id: "sweet-story",
    productId: 100021,
    title: "Sweet Story",
    category: "Patisserie & Sweets",
    tagline: "Artisanal French & Turkish Confections",
    badge: "Artisan Favorite",
    badgeType: "accent",
    rating: 4.9,
    reviewsCount: 128,
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    description:
      "Indulge in handcrafted macarons, chocolate lava cakes, pistachio baklava, and specialty pour-over coffees in Alanya's premier dessert lounge.",
    validity: "Valid for 12 months",
    icon: "ri-cake-3-line",
    tiers: [
      {
        id: "sweet-treat",
        name: "Sweet Treat",
        price: 15,
        money: Money.fromDecimal(15, "EUR"),
        perks: [
          "1 Signature Dessert / Soufflé",
          "1 Specialty Coffee or Artisanal Tea",
          "Personalized digital gift certificate",
        ],
        description: "The perfect afternoon dessert escape for one.",
      },
      {
        id: "patisserie-delight",
        name: "Patisserie Delight",
        price: 28,
        money: Money.fromDecimal(28, "EUR"),
        recommended: true,
        perks: [
          "2 Artisanal Pastries / Soufflés",
          "2 Specialty Coffees / Teas",
          "Complimentary chef's mini chocolate tasting",
        ],
        description:
          "Our most popular sweet tasting experience for couples and friends.",
      },
      {
        id: "grand-tasting",
        name: "Grand Tasting Banquet",
        price: 50,
        money: Money.fromDecimal(50, "EUR"),
        perks: [
          "Chef's Grand Tasting Platter (Soufflé, Baklava, Eclairs)",
          "4 Pour-over Coffees / Signature Mocktails",
          "Take-home box of 6 handcrafted chocolates",
        ],
        description:
          "The ultimate luxury dessert feast for small groups and celebrations.",
      },
    ],
  },
  {
    id: "craft-coffee-breakfast",
    productId: 100022,
    title: "Craft Coffee & Breakfast",
    category: "Breakfast & Roastery",
    tagline: "Alanya Harbour View Specialty Roastery",
    badge: "Harbour View",
    badgeType: "primary",
    rating: 4.95,
    reviewsCount: 215,
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
    description:
      "Wake up to freshly roasted single-origin beans, sea breezes over the marina, and gourmet breakfast dishes prepared by skilled roastery chefs.",
    validity: "Valid for 12 months",
    icon: "ri-cup-line",
    tiers: [
      {
        id: "espresso-pastry",
        name: "Espresso & Pastry",
        price: 12,
        money: Money.fromDecimal(12, "EUR"),
        perks: [
          "Double Shot Espresso / Flat White / Cold Brew",
          "Freshly baked Butter Croissant or Danish",
          "High-speed Roastery WiFi & Marina view seating",
        ],
        description: "A quick, energizing artisanal morning ritual.",
      },
      {
        id: "coastal-breakfast-two",
        name: "Coastal Breakfast for Two",
        price: 35,
        money: Money.fromDecimal(35, "EUR"),
        recommended: true,
        perks: [
          "2 Gourmet Breakfast Mains (Avocado Toast / Shakshuka)",
          "2 Specialty Coffees of your choice",
          "2 Freshly squeezed Mediterranean Orange Juices",
        ],
        description:
          "A picturesque coastal breakfast date overlooking the historic harbour.",
      },
      {
        id: "roastery-grand-brunch",
        name: "Roastery Grand Brunch",
        price: 65,
        money: Money.fromDecimal(65, "EUR"),
        perks: [
          "Full Roastery Brunch Board for 4 guests",
          "Specialty Pour-over Tasting Flight",
          "250g Take-home bag of Freshly Roasted Single-Origin Beans",
        ],
        description:
          "An expansive brunch gathering paired with premier roastery cuppings.",
      },
    ],
  },
  {
    id: "turkish-village-breakfast",
    productId: 100023,
    title: "Turkish Village Breakfast",
    category: "Traditional Culture",
    tagline: "Authentic Mountain Serenity & Serpme Feast",
    badge: "Top Rated",
    badgeType: "gold",
    rating: 5.0,
    reviewsCount: 340,
    imageUrl:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
    description:
      "Experience legendary Turkish hospitality high in the Taurus Mountains with organic farm-to-table village spreads, wood-fired breads, and unlimited çay.",
    validity: "Valid for 12 months",
    icon: "ri-restaurant-2-line",
    tiers: [
      {
        id: "serpme-two",
        name: "Serpme for Two",
        price: 30,
        money: Money.fromDecimal(30, "EUR"),
        perks: [
          "15-dish Authentic Village Spread",
          "Hot Menemen & Fresh Wood-fired Pide",
          "Unlimited Traditional Black Çay",
        ],
        description:
          "Classic traditional serpme breakfast with panoramic mountain valley views.",
      },
      {
        id: "family-feast",
        name: "Family Village Feast",
        price: 55,
        money: Money.fromDecimal(55, "EUR"),
        recommended: true,
        perks: [
          "22-dish Organic Mountain Spread for 4",
          "Sucuklu Yumurta, Sigara Böreği & Village Cheeses",
          "Clotted Cream (Kaymak), Honey Comb & Fresh Farm Fruits",
        ],
        description:
          "A rich, vibrant celebration of Anatolian culinary heritage for the whole family.",
      },
      {
        id: "vip-mountain-valley",
        name: "VIP Mountain Valley",
        price: 95,
        money: Money.fromDecimal(95, "EUR"),
        perks: [
          "Private Panoramic Gazebo Table for up to 6",
          "25-dish Organic Feast + Grilled Village Sausages",
          "Fresh Pomegranate Juices & Turkish Coffee Ceremony",
          "Complimentary roundtrip hotel transfer in Alanya",
        ],
        description:
          "Exclusive private gazebo dining with VIP service and hotel pickup.",
      },
    ],
  },
  {
    id: "coffee-tour-trail",
    productId: 100013,
    title: "Coffee Tour Trail",
    category: "Tasting Tour",
    tagline: "Curated Self-Paced 7-Stop Cafe Passport",
    badge: "Interactive Trail",
    badgeType: "secondary",
    rating: 4.88,
    reviewsCount: 164,
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    description:
      "Embark on Alanya's premier coffee expedition. Explore hidden roasteries, beachside espresso bars, and historic quarter coffee houses at your own pace.",
    validity: "Valid for 12 months",
    icon: "ri-road-map-line",
    tiers: [
      {
        id: "trail-3-stop",
        name: "3-Stop Harbour Trail",
        price: 25,
        money: Money.fromDecimal(25, "EUR"),
        perks: [
          "3 Specialty Drink Vouchers at premier harbor cafes",
          "Digital Coffee Trail Passport & Interactive Map",
          "Specialty roast cupping discounts",
        ],
        description:
          "A delightful afternoon stroll through Alanya's picturesque harbor cafe quarter.",
      },
      {
        id: "trail-5-stop",
        name: "5-Stop Epicurean Trail",
        price: 42,
        money: Money.fromDecimal(42, "EUR"),
        recommended: true,
        perks: [
          "5 Specialty Drink Vouchers across old town & beachfront",
          "Lokum & Traditional Confectionery Pairings",
          "Printed Pocket Trail Guide & Collectible Stamp Card",
        ],
        description:
          "Our most popular trail covering the top-rated cafes in historical Alanya.",
      },
      {
        id: "trail-7-stop",
        name: "7-Stop Master Trail",
        price: 60,
        money: Money.fromDecimal(60, "EUR"),
        perks: [
          "All 7 Premier Cafe & Roastery Stops in Alanya",
          "VIP Roastery Cupping Session & Barista Q&A",
          "Alanya Holidays Insulated Thermal Coffee Tumbler",
        ],
        description:
          "The definitive passport for true coffee lovers and adventurous explorers.",
      },
    ],
  },
  {
    id: "coffee-lovers-pack",
    productId: 100025,
    title: "Coffee Lover's Pack",
    category: "Gift Bundles & Merch",
    tagline: "Artisan Beans & Hand-Forged Cezve Sets",
    badge: "Best Value",
    badgeType: "accent",
    rating: 4.92,
    reviewsCount: 96,
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    description:
      "The quintessential gift for coffee enthusiasts, featuring locally roasted single-origin beans, traditional copper cezve, and brewing accessories.",
    validity: "Valid for 12 months",
    icon: "ri-gift-2-line",
    tiers: [
      {
        id: "pack-starter",
        name: "Starter Kit",
        price: 35,
        money: Money.fromDecimal(35, "EUR"),
        perks: [
          "250g Premium Single-Origin Whole Beans / Ground",
          "2 Specialty Cafe Drink Vouchers",
          "Illustrated Turkish Coffee Brew Guide Card",
        ],
        description:
          "Everything needed to start brewing authentic Mediterranean coffee.",
      },
      {
        id: "pack-connoisseur",
        name: "Connoisseur Box",
        price: 65,
        money: Money.fromDecimal(65, "EUR"),
        recommended: true,
        perks: [
          "2x 250g Reserve Single-Origin Roasts (Medium & Dark)",
          "Hand-hammered Anatolian Copper Cezve (Pot)",
          "4 Specialty Cafe Drink Vouchers",
        ],
        description:
          "A stunning gift box featuring artisan roasted beans and handmade copperware.",
      },
      {
        id: "pack-barista-master",
        name: "Barista Master Collection",
        price: 110,
        money: Money.fromDecimal(110, "EUR"),
        perks: [
          "3x 250g Reserve Micro-Lot Roasts",
          "Handcrafted Copper Cezve + Stainless Steel Hand Burr Grinder",
          "6 Cafe Vouchers + 1-on-1 Virtual Barista Masterclass",
        ],
        description:
          "The ultimate luxury coffee gift collection for discerning brew connoisseurs.",
      },
    ],
  },
  {
    id: "weekend-brunch-bundle",
    productId: 100026,
    title: "Weekend Brunch Bundle",
    category: "Luxury Dining",
    tagline: "Beachfront Elegance & Champagne Sunsets",
    badge: "Weekend Special",
    badgeType: "gold",
    rating: 4.97,
    reviewsCount: 182,
    imageUrl:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
    description:
      "Indulge in opulent seaside brunching along Kleopatra Beach and the Alanya Marina with chilled champagne, fresh seafood, and live acoustic music.",
    validity: "Valid for 12 months",
    icon: "ri-goblet-line",
    tiers: [
      {
        id: "brunch-classic",
        name: "Classic Seaside Brunch",
        price: 40,
        money: Money.fromDecimal(40, "EUR"),
        perks: [
          "Coastal Brunch Set Menu for 2 guests",
          "Reserved Beachfront Seating at Kleopatra Beach",
          "Artisan Coffee, Teas & Fresh Citrus Juices",
        ],
        description:
          "A relaxing beachfront brunch accompanied by gentle Mediterranean waves.",
      },
      {
        id: "brunch-champagne",
        name: "Champagne Brunch",
        price: 75,
        money: Money.fromDecimal(75, "EUR"),
        recommended: true,
        perks: [
          "Luxury 4-course Brunch for 2 guests",
          "Chilled Prosecco / Mimosa Flutes on arrival",
          "Fresh Seafood Platter & Artisanal Cheese Board",
        ],
        description:
          "Elevate your weekend with champagne, gourmet delicacies, and seaside views.",
      },
      {
        id: "brunch-yacht-vip",
        name: "Yacht Club VIP Brunch",
        price: 130,
        money: Money.fromDecimal(130, "EUR"),
        perks: [
          "VIP Gourmet Brunch Banquet for 4 guests",
          "Exclusive Marina Lounge Cabana Reservation",
          "Full Bottle of Chilled Champagne & Seafood Mezze Tower",
        ],
        description:
          "Supreme VIP weekend luxury with private cabana and premium champagne service.",
      },
    ],
  },
];

export const REDEMPTION_STEPS: RedemptionStep[] = [
  {
    step: 1,
    title: "1. Choose & Purchase",
    subtitle: "Select & Personalize",
    description:
      "Select your favorite experience and tier. Personalize with an optional recipient name and custom greeting at checkout. Instant digital delivery.",
    icon: "ri-shopping-bag-3-line",
    tag: "Instant PDF & QR Voucher",
  },
  {
    step: 2,
    title: "2. Share or Keep",
    subtitle: "Deliver with Style",
    description:
      "Print the luxury gift certificate or forward the digital voucher link directly to friends and family via WhatsApp, Telegram, or Email.",
    icon: "ri-send-plane-fill",
    tag: "Printable & Shareable",
  },
  {
    step: 3,
    title: "3. Redeem in Alanya",
    subtitle: "Enjoy the Experience",
    description:
      "Present the QR code or voucher on your mobile device at the partner venue in Alanya. Scanned and verified in seconds. Valid for 12 full months.",
    icon: "ri-qr-code-line",
    tag: "12-Month Validity",
  },
];

export const FAQ_ITEMS: GiftCardFaqItem[] = [
  {
    id: "delivery",
    category: "Delivery & Formats",
    question: "How are digital gift cards delivered?",
    answer:
      "Gift cards are delivered instantly via email immediately after checkout. You receive both a downloadable high-resolution PDF certificate with a scannable QR code and a direct digital pass link.",
  },
  {
    id: "validity",
    category: "Validity & Terms",
    question: "How long are gift cards valid?",
    answer:
      "Every Alanya Holidays gift card is valid for a full 12 months (365 days) from the purchase date, offering complete flexibility for upcoming trips or vacations.",
  },
  {
    id: "multi-day",
    category: "Redemption Experience",
    question:
      "Can multi-stop experiences (like the Coffee Tour Trail) be used across multiple days?",
    answer:
      "Yes! The Coffee Tour Trail vouchers can be redeemed at your own pace over different days during your stay. Each cafe stop scans their respective portion of the pass.",
  },
  {
    id: "gifting",
    category: "Gifting & Personalization",
    question:
      "Can I send the gift card directly to someone else with a personalized note?",
    answer:
      "Yes. During checkout, you can specify the recipient's name, email, and add a custom gift message. The recipient will receive a beautifully formatted gift email on your behalf.",
  },
  {
    id: "dietary",
    category: "Venues & Dining",
    question:
      "What if the recipient has dietary restrictions (vegan, gluten-free, halal)?",
    answer:
      "All our partnered cafes and restaurants offer vegetarian, vegan, and gluten-free alternatives. All culinary venues in Alanya adhere to standard halal preparation guidelines.",
  },
  {
    id: "refunds",
    category: "Refunds & Exchanges",
    question: "What is the refund and exchange policy?",
    answer:
      "Unredeemed gift cards can be fully refunded within 14 days of purchase. Alternatively, gift cards can be exchanged for store credit or another Alanya experience at any time before expiration.",
  },
];
