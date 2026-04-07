import React from 'react';

interface Property {
  title: string;
  description: string;
  images: string[];
  address?: string;
  location?: string;
  pricePerNight: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewsCount?: number;
  id: string;
}

interface PropertyStructuredDataProps {
  property: Property;
}

export const PropertyStructuredData: React.FC<PropertyStructuredDataProps> = ({ property }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    'name': property.title,
    'description': property.description?.substring(0, 500) || '',
    'url': `https://alanya-holidays.com/property/${property.id}`,
    'image': property.images?.slice(0, 10) || [],
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': property.address || property.location || 'Alanya, Turkey',
      'addressLocality': 'Alanya',
      'addressRegion': 'Antalya',
      'postalCode': '07400',
      'addressCountry': 'TR'
    },
    'geo': property.latitude && property.longitude ? {
      '@type': 'GeoCoordinates',
      'latitude': property.latitude,
      'longitude': property.longitude
    } : undefined,
    'priceRange': `€${property.pricePerNight} - €${property.pricePerNight * 30}+ per night`,
    'numberOfRooms': property.bedrooms,
    'numberOfBathroomsTotal': property.bathrooms,
    'occupancy': {
      '@type': 'QuantitativeValue',
      'minValue': 1,
      'maxValue': property.guests
    },
    'amenityFeature': property.amenities?.slice(0, 20).map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      'name': amenity
    })) || [],
    'checkinTime': '15:00',
    'checkoutTime': '10:00',
    'telephone': '+90 242 000 0000',
    'priceCurrency': 'EUR',
    'starRating': property.rating ? {
      '@type': 'Rating',
      'ratingValue': property.rating.toFixed(1),
      'bestRating': '5',
      'worstRating': '1'
    } : undefined,
    'aggregateRating': property.reviewsCount && property.rating ? {
      '@type': 'AggregateRating',
      'ratingValue': property.rating.toFixed(1),
      'reviewCount': property.reviewsCount,
      'bestRating': '5',
      'worstRating': '1'
    } : undefined,
    'offers': {
      '@type': 'Offer',
      'price': property.pricePerNight,
      'priceCurrency': 'EUR',
      'availability': 'https://schema.org/InStock',
      'category': 'VacationRental'
    }
  };

  // Remove undefined properties
  const cleanedSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script type="application/ld+json">
      {JSON.stringify(cleanedSchema)}
    </script>
  );
};
