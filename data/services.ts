import { ServiceType } from '../types/enums';
import { Car, Anchor, Heart, Stethoscope, ShoppingBag, Cloud, Mountain, Bike, Camera, Video } from 'lucide-react';

export const SERVICES_DATA = [
    // Transport
    {
        id: 'car-rental',
        category: 'transport',
        subcategory: 'rental',
        title: 'services.transport.car',
        description: 'services.transport.car_desc',
        icon: Car,
        price: 25,
        priceLabel: '/day',
        route: '/services/car-rental',
        actionLabel: 'book_button'
    },
    {
        id: 'bike-rental',
        category: 'transport',
        subcategory: 'rental',
        title: 'services.transport.bike',
        description: 'services.transport.bike_desc',
        icon: Car,
        price: 10,
        priceLabel: '/day',
        route: '/services/bike-rental',
        actionLabel: 'book_button'
    },
    {
        id: 'airport-transfer',
        category: 'transport',
        subcategory: 'transfer',
        title: 'services.transport.transfer_airport',
        description: 'services.transport.transfer_airport_desc',
        icon: Car,
        price: 35,
        priceLabel: '/trip',
        route: '/services/transfer',
        actionLabel: 'book_button'
    },
    {
        id: 'vip-transfer',
        category: 'transport',
        subcategory: 'transfer',
        title: 'services.transport.transfer_vip',
        description: 'services.transport.transfer_vip_desc',
        icon: Car,
        price: 60,
        priceLabel: '/trip',
        route: '/services/transfer',
        actionLabel: 'book_button'
    },
    // Experiences
    {
        id: 'land-tours',
        category: 'experiences',
        title: 'services.adventure.land',
        description: 'services.adventure.land_desc',
        icon: Mountain,
        price: 30, // Base price
        image: '/images/experiences/land_tours_hero.png',
        route: '/experiences/land',
        actionLabel: 'book_button'
    },
    {
        id: 'water-sports',
        category: 'experiences',
        title: 'services.adventure.water',
        description: 'services.adventure.water_desc',
        icon: Anchor,
        price: 50, // Base price
        image: '/images/experiences/water_sports_hero.png',
        route: '/experiences/water',
        actionLabel: 'book_button'
    },
    {
        id: 'safari',
        category: 'experiences',
        title: 'services.adventure.safari',
        description: 'services.adventure.safari_desc',
        icon: Car,
        price: 35, // Base price
        image: '/images/experiences/safari_expedition_hero.png',
        route: '/experiences/safari',
        actionLabel: 'book_button'
    },
    {
        id: 'atv',
        category: 'experiences',
        title: 'services.adventure.atv_title',
        description: 'services.adventure.atv_subtitle',
        icon: Car,
        price: 45, // Base price
        image: '/images/experiences/atv_buggy_hero.png',
        route: '/experiences/atv',
        actionLabel: 'book_button'
    },
    {
        id: 'air',
        category: 'experiences',
        title: 'services.adventure.air',
        description: 'services.adventure.air_desc',
        icon: Cloud,
        price: 80, // Base price
        image: '/images/experiences/air_adventures_hero.png',
        route: '/experiences/air',
        actionLabel: 'book_button'
    },
    {
        id: 'bikes',
        category: 'experiences',
        title: 'services.adventure.bikes_title',
        description: 'services.adventure.bikes_subtitle',
        icon: Bike,
        price: 10, // Base price
        image: '/images/experiences/bikes_hero.png',
        route: '/services/bicycle-rental',
        actionLabel: 'book_button'
    },
    // Visa
    {
        id: 'visa-tourist',
        category: 'visa',
        title: 'services.visa.tourist',
        description: 'services.visa.tourist_desc',
        icon: Anchor,
        price: 50,
        route: '/visa-consult',
        actionLabel: 'Consult'
    },
    {
        id: 'visa-residence',
        category: 'visa',
        title: 'services.visa.residence',
        description: 'services.visa.residence_desc',
        icon: Anchor,
        price: 250,
        route: '/visa-consult',
        actionLabel: 'Consult'
    },
    {
        id: 'luxury-tour',
        category: 'visa', // Grouped under Consulting
        title: 'services.visa.luxury',
        description: 'services.visa.luxury_desc',
        icon: Anchor, // or another appropriate icon like Star or Gem if available, but Anchor is standard import here for now.
        route: '/contact',
        actionLabel: 'consult_button'
    },
    // Connectivity
    {
        id: 'esim',
        category: 'connectivity',
        title: 'services.connectivity.esim',
        description: 'services.connectivity.esim_desc',
        icon: Anchor,
        price: 15,
        route: '/services/tourist-sim-card',
        actionLabel: 'book_button'
    },
    // Creative
    {
        id: 'photographer',
        category: 'creative',
        title: 'services.creative.photo',
        description: 'services.creative.photo_desc',
        icon: Camera,
        price: 100,
        route: '/creative-professionals/photographer',
        actionLabel: 'book_button'
    },
    {
        id: 'videographer',
        category: 'creative',
        title: 'services.creative.video',
        description: 'services.creative.video_desc',
        icon: Video,
        price: 200,
        route: '/creative-professionals/videographer',
        actionLabel: 'book_button'
    },
    {
        id: 'content-creator',
        category: 'creative',
        title: 'services.creative.content',
        description: 'services.creative.content_desc',
        icon: Camera,
        price: 150,
        route: '/creative-professionals/content_creator',
        actionLabel: 'book_button'
    },
    // Health
    {
        id: 'spa',
        category: 'health',
        title: 'services.health.spa',
        description: 'services.health.spa_desc',
        icon: Heart,
        price: 40,
        route: '/experiences/wellness',
        actionLabel: 'book_button'
    },
    {
        id: 'dental',
        category: 'health',
        title: 'services.health.dental',
        description: 'services.health.dental_desc',
        icon: Stethoscope,
        route: '/contact',
        actionLabel: 'consult_button'
    },
    {
        id: 'hair',
        category: 'health',
        title: 'services.health.hair',
        description: 'services.health.hair_desc',
        icon: Heart,
        route: '/contact',
        actionLabel: 'consult_button'
    },
    {
        id: 'cosmetic',
        category: 'health',
        title: 'services.health.cosmetic',
        description: 'services.health.cosmetic_desc',
        icon: Heart,
        route: '/contact',
        actionLabel: 'consult_button'
    },
    {
        id: 'cave',
        category: 'health',
        title: 'services.health.cave',
        description: 'services.health.cave_desc',
        icon: Heart,
        price: 10,
        route: '/contact',
        actionLabel: 'book_button'
    }
];
