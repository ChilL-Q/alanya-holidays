import { Property, Service, ServiceType } from './types';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    title: 'Luxury Kleopatra Beach Penthouse',
    location: 'Saray, Alanya',
    pricePerNight: 120,
    rating: 4.9,
    reviewsCount: 34,
    image: 'https://picsum.photos/800/600?random=1',
    images: ['https://picsum.photos/800/600?random=1', 'https://picsum.photos/800/600?random=11', 'https://picsum.photos/800/600?random=12'],
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
    image: 'https://picsum.photos/800/600?random=2',
    images: ['https://picsum.photos/800/600?random=2', 'https://picsum.photos/800/600?random=21', 'https://picsum.photos/800/600?random=22'],
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
    image: 'https://picsum.photos/800/600?random=3',
    images: ['https://picsum.photos/800/600?random=3', 'https://picsum.photos/800/600?random=31'],
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
    image: 'https://picsum.photos/400/300?random=4',
    vehicleType: 'Mercedes Vito'
  },
  {
    id: 's2',
    type: ServiceType.TRANSFER,
    title: 'Gazipasa Airport Shuttle',
    price: 40,
    description: 'Private sedan for up to 3 people. Quick 30 min drive.',
    image: 'https://picsum.photos/400/300?random=5',
    vehicleType: 'Sedan'
  },
  {
    id: 's3',
    type: ServiceType.TOUR,
    title: 'Sapadere Canyon Safari',
    price: 35,
    description: 'Full day jeep safari including lunch and canyon entrance.',
    image: 'https://picsum.photos/400/300?random=6',
    duration: '8 Hours'
  }
];

export const LOCATIONS = ['Alanya Center', 'Cleopatra', 'Oba', 'Mahmutlar', 'Tepe', 'Kargicak'];