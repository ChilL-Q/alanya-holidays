import { Property, Service, ServiceType } from './types';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    title: 'Luxury Kleopatra Beach Penthouse',
    location: 'Saray, Alanya',
    pricePerNight: 120,
    rating: 4.9,
    reviewsCount: 34,
    image: '/properties/kleopatra-penthouse-main.png',
    images: [
      '/properties/kleopatra-penthouse-main.png',
      '/properties/kleopatra-living.png',   // AI Generated (Local)
      '/properties/kleopatra-bedroom.png'   // AI Generated (Local)
    ],
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    hostName: 'Mehmet Y.',
    description: 'Experience the best of Alanya in this stunning penthouse overlooking the famous Kleopatra Beach. Features a private jacuzzi and expansive terrace.',
    amenities: [
      { icon: 'wifi', label: 'Fast Wifi' },
      { icon: 'wind', label: 'Air Conditioning' },
      { icon: 'waves', label: 'Sea View' },
      { icon: 'coffee', label: 'Coffee Maker' }
    ]
  },
  {
    id: 'p2',
    title: 'Serene Villa with Private Pool',
    location: 'Tepe, Alanya',
    pricePerNight: 250,
    rating: 5.0,
    reviewsCount: 12,
    image: '/properties/tepe-villa-main.png',
    images: [
      '/properties/tepe-villa-main.png',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', // Beautiful Villa Pool
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'  // Luxury Bedroom
    ],
    guests: 8,
    bedrooms: 4,
    bathrooms: 3,
    hostName: 'Elena K.',
    description: 'Escape the city noise in this secluded villa in the Tepe hills. Infinity pool with panoramic castle views.',
    amenities: [
      { icon: 'droplet', label: 'Private Pool' },
      { icon: 'car', label: 'Free Parking' },
      { icon: 'utensils', label: 'Full Kitchen' },
      { icon: 'sun', label: 'Terrace' }
    ]
  },
  {
    id: 'p3',
    title: 'Modern City Center Apartment',
    location: 'Oba, Alanya',
    pricePerNight: 85,
    rating: 4.7,
    reviewsCount: 56,
    image: '/properties/oba-apartment-main.png',
    images: [
      '/properties/oba-apartment-main.png',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', // Modern Apartment Interior
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'  // Stylish Living Room
    ],
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    hostName: 'Alanya Rentals',
    description: 'Perfect for digital nomads and families. Close to shopping malls, restaurants, and just 500m from the beach.',
    amenities: [
      { icon: 'tv', label: 'Smart TV' },
      { icon: 'map-pin', label: 'Central Location' },
      { icon: 'briefcase', label: 'Work Area' }
    ]
  }
];

export const CROSS_SELL_SERVICES: Service[] = [
  {
    id: 's1',
    type: ServiceType.TRANSFER,
    title: 'VIP Airport Transfer (Antalya)',
    price: 100,
    description: 'Private Mercedes Vito for up to 6 people. Door to door service.',
    image: 'https://picsum.photos/seed/mercedes-vito/400/300', // Static Seed
    vehicleType: 'Mercedes Vito'
  },
  {
    id: 's2',
    type: ServiceType.TRANSFER,
    title: 'Gazipasa Airport Shuttle',
    price: 40,
    description: 'Private sedan for up to 3 people. Quick 30 min drive.',
    image: 'https://picsum.photos/seed/white-sedan/400/300', // Static Seed
    vehicleType: 'Sedan'
  },
  {
    id: 's3',
    type: ServiceType.TOUR,
    title: 'Sapadere Canyon Safari',
    price: 35,
    description: 'Full day jeep safari including lunch and canyon entrance.',
    image: 'https://picsum.photos/seed/jeep-safari/400/300', // Static Seed
    duration: '8 Hours'
  }

];

export const CARS = [
  {
    id: 'c1',
    title: 'Fiat 500',
    type: 'Economy',
    price: 35,
    features: ['Automatic', '4 Seats', 'Petrol'],
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80' // Actual Fiat 500
  },
  {
    id: 'c2',
    title: 'Renault Megane',
    type: 'Family',
    price: 55,
    features: ['Automatic', '5 Seats', 'Diesel'],
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80' // Blue Hatchback
  },
  {
    id: 'c3',
    title: 'Dacia Duster',
    type: 'SUV',
    price: 70,
    features: ['Manual', '5 Seats', 'Diesel'],
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' // White SUV
  }
];

export const BIKES = [
  {
    id: 'b1',
    title: 'Honda PCX 125',
    type: 'Scooter',
    price: 25,
    features: ['Automatic', '2 Helmets', 'Top Box'],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80' // Vespa/Scooter Style
  },
  {
    id: 'b2',
    title: 'Yamaha XMAX 250',
    type: 'Maxi Scooter',
    price: 45,
    features: ['Automatic', 'ABS', 'Comfort'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80' // Sporty Moto
  },
  {
    id: 'b3',
    title: 'Honda CRF 250',
    type: 'Enduro',
    price: 55,
    features: ['Manual', 'Off-road', 'Adventure'],
    image: 'https://images.unsplash.com/photo-1558980394-0a06c4631733?auto=format&fit=crop&w=800&q=80' // Dirt Bike
  }
];

export const LOCATIONS = [
  'Alanya Center',
  'Cleopatra',
  'Cikcilli',
  'Oba',
  'Tosmur',
  'Kestel',
  'Mahmutlar',
  'Kargicak',
  'Tepe',
  'Bektas',
  'Konakli',
  'Avsallar',
  'Demirtas',
  'Okurcalar'
];