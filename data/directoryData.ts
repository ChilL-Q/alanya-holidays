export interface DirectoryListing {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  website?: string;
  whatsapp?: string;
  gallery: string[];
  reviews: {
    average: number;
    count: number;
  };
  languagesSpoken?: string[];
  certifications?: string[];
  location: string;
  googleMapUrl?: string;
  priceLevel?: 1 | 2 | 3 | 4; // $, $$, $$$, $$$$
}

export interface DirectoryCategoryIntro {
  title: string;
  description: string;
  longDescription?: string[];
  faqs?: { question: string; answer: string }[];
}

export const directoryCategoryIntros: Record<string, DirectoryCategoryIntro> = {
  'medical': {
    title: 'Top Medical Tourism in Alanya & Antalya',
    description: 'Looking for the best medical tourism services in Alanya? Our curated directory connects you with trusted clinics, dental specialists, hair transplant centers, and cosmetic surgeons across the Antalya region.',
    longDescription: [
      'Alanya has rapidly become one of the premier destinations for medical tourism in Turkey, combining world-class healthcare facilities with the stunning backdrop of the Turkish Riviera. Whether you are looking for advanced dental implants, state-of-the-art hair transplant procedures, or top-tier cosmetic surgery, our directory features only verified clinics with international accreditations such as JCI and ISO.',
      'Many clinics offer comprehensive all-inclusive packages that cover your treatment, VIP airport transfers, and luxury accommodation near Cleopatra Beach or the city center. The highly experienced, English-speaking medical staff ensure that your journey is seamless from the initial consultation to your final check-up.',
      'Beyond the cost savings—which can be up to 70% compared to the UK, Europe, or the US—Alanya provides the perfect relaxing environment for recovery. Spend your post-treatment days enjoying the mild Mediterranean climate, tasting authentic Turkish cuisine, and exploring historical landmarks like the Alanya Castle.'
    ],
    faqs: [
      { question: 'Is medical tourism safe in Alanya?', answer: 'Yes, Alanya boasts modern hospitals and exclusive clinics that adhere to strict international healthcare standards. Always look for JCI-accredited facilities and read verified patient reviews.' },
      { question: 'Do doctors in Turkey speak English?', answer: 'Absolutely. The majority of top-tier medical tourism clinics employ doctors, surgeons, and patient coordinators who are fluent in English, Russian, German, and Arabic.' },
      { question: 'What is included in a typical medical package?', answer: 'Most packages include the medical procedure, pre-op and post-op consultations, VIP airport transfers, hotel accommodation, and sometimes a personal translator.' }
    ]
  },
  'accommodations': {
    title: 'Best Places to Stay in Alanya',
    description: 'Find the perfect place to stay. From luxury all-inclusive resorts to cozy boutique hotels and private villas, explore the top accommodations in Alanya and Antalya.',
    longDescription: [
      'Choosing where to stay in Alanya can define your entire holiday experience. The city offers a diverse range of accommodations suitable for every budget, travel style, and group size. Whether you dream of waking up to the sound of waves at Cleopatra Beach or prefer a secluded luxury villa in the hills of Tepe, our directory helps you find exactly what you need.',
      'For families and those seeking ultimate relaxation, the massive all-inclusive resorts in areas like Okurcalar and Avsallar provide world-class amenities, private beaches, and endless entertainment. If you prefer a more authentic, localized experience, explore the charming boutique hotels nestled within the historic walls of the Alanya Castle.',
      'Long-term visitors and digital nomads often turn to modern apart-hotels or private vacation rentals in Oba and Mahmutlar. These options offer the comforts of home, including fully equipped kitchens and high-speed internet, coupled with easy access to vibrant local bazaars and buzzing nightlife.'
    ],
    faqs: [
      { question: 'Which area is best to stay in Alanya?', answer: 'Cleopatra Beach area is ideal for beach lovers and nightlife. Oba and Mahmutlar are great for long-term stays and families, while the Castle area offers historic charm and boutique hotels.' },
      { question: 'Are all-inclusive resorts worth it?', answer: 'Yes, especially for families. They offer incredible value with unlimited food, drinks, kids\' clubs, and private beach access, allowing you to budget your holiday precisely.' },
      { question: 'Can I rent a villa for a large group?', answer: 'Absolutely. Alanya has stunning private villas with pools available for rent, particularly in the Kargicak and Tepe neighborhoods, offering privacy and panoramic sea views.' }
    ]
  },
  'tours': {
    title: 'Unforgettable Tours & Experiences',
    description: 'Discover the magic of the Turkish Riviera. Browse our selection of boat tours, historical excursions, and family-friendly adventures in Alanya.'
  },
  'transport': {
    title: 'Reliable Transportation in Alanya',
    description: 'Get around with ease. Compare top-rated car rentals, VIP airport transfers, scooter rentals, and public transport options for a seamless journey.'
  },
  'restaurants': {
    title: 'Top Restaurants & Cafés',
    description: 'Taste the best of Alanya. From authentic Turkish cuisine with a castle view to international dining and cozy beachside cafés.'
  },
  'real-estate': {
    title: 'Trusted Real Estate in Alanya',
    description: 'Looking to invest or relocate? Connect with verified real estate agents for apartments, luxury villas, and property management services.'
  },
  'visa': {
    title: 'Visa & Residency Experts',
    description: 'Navigate Turkish bureaucracy stress-free. Find trusted advisors for tourist residence permits, citizenship by investment, and legal support in Antalya.'
  },
  'shopping': {
    title: 'Shopping & Souvenirs Guide',
    description: 'Explore the vibrant shopping scene of Alanya. Find local bazaars, the best places for Turkish delight, spices, handmade goods, and modern shopping malls.'
  },
  'nature': {
    title: 'Breathtaking Natural Attractions',
    description: 'Immerse yourself in nature. Discover Alanya\'s pristine beaches, secret caves, stunning waterfalls, and beautiful hiking routes.'
  },
  'spa-hamam': {
    title: 'Spa & Traditional Hamams',
    description: 'Relax and rejuvenate with authentic Turkish baths, massages, and premium spa wellness centers.'
  },
  'hair-beauty': {
    title: 'Hair & Beauty Salons',
    description: 'Top-rated hairdressers, nail salons, and beauty centers for a perfect makeover during your stay.'
  }
};

export const MOCK_DIRECTORY_DATA: DirectoryListing[] = [
  // NATURAL ATTRACTIONS
  {
    id: 'nat-1',
    categoryId: 'nature',
    name: 'Cleopatra Beach',
    shortDescription: 'The most famous sandy beach in Alanya, legend says it was a gift from Mark Antony to Cleopatra.',
    isFeatured: true,
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1542384955-4a6015b3c583?auto=format&fit=crop&q=80&w=800',
    ],
    reviews: { average: 4.9, count: 5000 },
    location: 'Alanya Center',
  },
  {
    id: 'nat-2',
    categoryId: 'nature',
    name: 'Dim Cave',
    shortDescription: 'Spectacular 360-meter long cave filled with ancient stalactites and stalagmites, located high above the Dim River.',
    isFeatured: true,
    isVerified: true,
    website: 'https://www.kulturportali.gov.tr/turkiye/antalya/gezilecek-yer/dim-magarasi',
    gallery: [
      'https://images.unsplash.com/photo-1519045761895-cdbed8ec1db2?auto=format&fit=crop&q=80&w=800',
    ],
    reviews: { average: 4.6, count: 850 },
    location: 'Dimcayi',
  },

  // --- SPREADSHEET DATA IMPORTS ---

  // ACCOMMODATIONS
  {
    id: 'acc-1',
    categoryId: 'accommodations',
    name: 'Alanya Holidays',
    shortDescription: 'Premium vacation rentals and comprehensive directory services.',
    isFeatured: true,
    isVerified: true,
    website: 'www.alanyaholidays.com',
    whatsapp: '1 438 929 4208',
    gallery: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 5.0, count: 120 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'acc-2',
    categoryId: 'accommodations',
    name: 'Ozgur Bey Spa Hotel',
    shortDescription: 'Relaxing spa hotel offering comfortable stays and excellent service.',
    website: 'https://www.ozgurbeyspahotel.com/en',
    whatsapp: '90 242 514 0104',
    gallery: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.5, count: 230 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'acc-3',
    categoryId: 'accommodations',
    name: 'Villa Sonata Hotel',
    shortDescription: 'Charming boutique hotel nestled in the heart of Alanya.',
    website: 'https://www.villasonata.com/',
    whatsapp: '90 242 513 0991',
    gallery: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.7, count: 156 },
    location: 'Alanya, Turkiye',
  },

  // TRANSPORT (Spreadsheet Table1_2)
  {
    id: 'trans-3',
    categoryId: 'transport',
    name: '724 Alanya Airport Transfer',
    shortDescription: 'Reliable 24/7 airport transfer services to and from Alanya.',
    website: 'https://724alanyaairporttransfer.com/',
    whatsapp: '90 541 207 5707',
    gallery: ['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 320 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'trans-4',
    categoryId: 'transport',
    name: 'Alanya Transfer',
    shortDescription: 'Professional transfer services focused on punctuality and comfort.',
    website: 'https://alanyatransfer.com/',
    whatsapp: '90 532 557 2135',
    gallery: ['https://images.unsplash.com/photo-1549317661-bc32c125df80?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.6, count: 210 },
    location: 'Alanya, Turkiye',
  },

  // TOURS (Spreadsheet Table1_3)
  {
    id: 'tour-1',
    categoryId: 'tours',
    name: 'Fresh Tourism Tour Alanya',
    shortDescription: 'Exciting local tours and memorable excursions.',
    website: 'https://www.touralanya.com/en',
    whatsapp: '90 555 330 9442',
    gallery: ['https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.9, count: 412 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'tour-2',
    categoryId: 'tours',
    name: 'Daily Tours in Alanya',
    shortDescription: 'Discover the beauty of the region with daily guided tours.',
    website: 'https://www.dailytoursinalanya.com/',
    whatsapp: '90 553 103 2336',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 180 },
    location: 'Alanya, Turkiye',
  },

  // MEDICAL (Spreadsheet Table1_4)
  {
    id: 'med-4',
    categoryId: 'medical',
    name: 'Tour Medical',
    shortDescription: 'Comprehensive dental and medical treatments for international patients.',
    website: 'https://www.tourmedical.com/',
    whatsapp: '90 537 305 7377',
    gallery: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 154 },
    location: 'Kusadasi, Aydin, Turkiye',
  },
  {
    id: 'med-5',
    categoryId: 'medical',
    name: 'Medical Tourism Turkey',
    shortDescription: 'Leading health tourism provider delivering exceptional surgical care.',
    website: 'https://mtturkey.com/',
    whatsapp: '90 530 070 3914',
    gallery: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.7, count: 322 },
    location: 'Konyaalti, Antalya, Turkiye',
  },

  // SPA & HAMAM (Spreadsheet Table1_5)
  {
    id: 'spa-1',
    categoryId: 'spa-hamam',
    name: 'Kleopatra',
    shortDescription: 'Authentic Turkish Hamam and relaxing massage therapies.',
    website: 'https://www.kleopatra.com.tr/',
    whatsapp: '90 532 541 98 00',
    gallery: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.9, count: 504 },
    location: 'Saray, Alanya',
  },
  {
    id: 'spa-2',
    categoryId: 'spa-hamam',
    name: 'Crystal Spa Center',
    shortDescription: 'Luxurious spa retreat offering deep tissue massages and skin care.',
    website: 'https://crystalspacenter.com/',
    whatsapp: '90 544 880 28 56',
    gallery: ['https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.6, count: 211 },
    location: 'Guller Pinari, Alanya',
  },

  // HAIR & BEAUTY (Spreadsheet Table1_6)
  {
    id: 'beauty-1',
    categoryId: 'hair-beauty',
    name: 'Nuri Ezveci Hair Salon',
    shortDescription: 'Premium hairdressing, coloring, and styling services.',
    website: 'https://www.instagram.com/nuriezvecihairsalon',
    whatsapp: '90 530 300 8080',
    gallery: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 88 },
    location: 'Saray, Alanya',
  },
  {
    id: 'beauty-2',
    categoryId: 'hair-beauty',
    name: 'Hairstory Professional Alanya - Bayan Kuaforu',
    shortDescription: 'Expert women\'s hair salon specializing in modern trends.',
    website: 'https://www.instagram.com/hairstory_professional_alany',
    whatsapp: '90 506 934 3923',
    gallery: ['https://images.unsplash.com/photo-1595476108010-b4d1f10c1448?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.7, count: 142 },
    location: 'Saray, Alanya',
  },

  // RESTAURANTS & CAFES (Spreadsheet Table1_7)
  {
    id: 'rest-1',
    categoryId: 'restaurants',
    name: 'Nabucco',
    shortDescription: 'Fine dining experience featuring Turkish and Mediterranean cuisine.',
    website: 'https://www.buyukhotel.com/nabucco',
    whatsapp: '90 242 513 1138',
    gallery: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 620 },
    location: 'Alanya, Turkiye',
    priceLevel: 3
  },
  {
    id: 'rest-2',
    categoryId: 'restaurants',
    name: 'Cozy Alanya',
    shortDescription: 'Relaxed cafe atmosphere with great coffee and quick bites.',
    website: 'https://www.facebook.com/cozyalanya/',
    whatsapp: '90 552 540 1278',
    gallery: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.5, count: 180 },
    location: 'Alanya, Turkiye',
    priceLevel: 2
  },

  // SHOPPING (Spreadsheet Table1_8)
  {
    id: 'shop-1',
    categoryId: 'shopping',
    name: 'Alanya Grand Bazaar',
    shortDescription: 'The ultimate destination for authentic Turkish souvenirs, textiles, and spices.',
    gallery: ['https://images.unsplash.com/photo-1590483256050-0bbcbfe96515?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.6, count: 1400 },
    location: 'Alanya Center',
  },

  // ATTRACTIONS (Spreadsheet Table1_9)
  {
    id: 'nat-3', // Added under nature/attractions
    categoryId: 'nature',
    name: 'Alanya Castle',
    shortDescription: 'Historical fortress offering panoramic views of the Mediterranean Sea and Cleopatra Beach.',
    gallery: ['https://images.unsplash.com/photo-1610014526955-40899ab4da4d?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.9, count: 12500 },
    location: 'Alanya',
  },
  {
    id: 'nat-4',
    categoryId: 'nature',
    name: 'Sapadere Canyon',
    shortDescription: 'A stunning natural gorge with walking paths, wooden bridges, and refreshing waterfalls.',
    gallery: ['https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 3200 },
    location: 'Sapadere, Alanya',
  }
];
