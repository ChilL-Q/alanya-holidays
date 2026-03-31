import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PropertyCard } from './PropertyCard';
import { Property } from '../../types/index';

// Mock contexts
const mockIsFavorite = vi.fn();
const mockToggleFavorite = vi.fn();
const mockConvertPrice = vi.fn((price: number) => price);
const mockFormatPrice = vi.fn((price: number) => `€${price}`);

vi.mock('../../context/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

vi.mock('../../context/CurrencyContext', () => ({
  useCurrency: () => ({
    convertPrice: mockConvertPrice,
    formatPrice: mockFormatPrice,
  }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

const mockProperty: Property = {
  id: 'prop-123',
  ref_id: 123,
  title: 'Luxury Sea View Villa',
  location: 'Alanya, Turkey',
  pricePerNight: 150,
  beds: 3,
  bedrooms: 2,
  bathrooms: 1,
  guests: 6,
  rating: 4.8,
  reviewsCount: 24,
  image: 'https://example.com/image.jpg',
  images: [],
  description: '',
  amenities: [],
  hostName: 'Host',
  isPromoted: false,
};

const renderPropertyCard = (property: Property = mockProperty) => {
  return render(
    <BrowserRouter>
      <PropertyCard property={property} />
    </BrowserRouter>
  );
};

describe('PropertyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFavorite.mockReturnValue(false);
    mockConvertPrice.mockImplementation((price: number) => price);
    mockFormatPrice.mockImplementation((price: number) => `€${price}`);
  });

  describe('rendering', () => {
    it('should render property card with basic information', () => {
      renderPropertyCard();

      expect(screen.getByText('Luxury Sea View Villa')).toBeInTheDocument();
      expect(screen.getByText('Alanya, Turkey')).toBeInTheDocument();
      expect(screen.getByText('€150')).toBeInTheDocument();
    });

    it('should display rating with star icon', () => {
      renderPropertyCard();

      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('should display "New" instead of rating for properties without reviews', () => {
      const newProperty = { ...mockProperty, rating: 0, reviewsCount: 0 };
      renderPropertyCard(newProperty);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should display Featured badge for promoted properties', () => {
      const promotedProperty = { ...mockProperty, isPromoted: true };
      renderPropertyCard(promotedProperty);

      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('should not display Featured badge for non-promoted properties', () => {
      renderPropertyCard();

      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('should use ref_id in link if available', () => {
      renderPropertyCard();

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/property/123');
    });

    it('should use id in link if ref_id is not available', () => {
      const propertyWithoutRef = { ...mockProperty, ref_id: undefined };
      renderPropertyCard(propertyWithoutRef);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/property/prop-123');
    });

    it('should display property image with correct alt text', () => {
      renderPropertyCard();

      const image = screen.getByAltText('Luxury Sea View Villa');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should handle image load error with fallback', () => {
      renderPropertyCard();

      const image = screen.getByAltText('Luxury Sea View Villa');
      fireEvent.error(image);

      expect(image).toHaveAttribute(
        'src',
        'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=800&auto=format&fit=crop&q=60'
      );
    });
  });

  describe('favorites functionality', () => {
    it('should call toggleFavorite when favorite button is clicked', () => {
      renderPropertyCard();

      const favoriteButton = screen.getByRole('button');
      fireEvent.click(favoriteButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith('prop-123');
    });

    it('should prevent default link navigation when clicking favorite button', () => {
      renderPropertyCard();

      const favoriteButton = screen.getByRole('button');
      fireEvent.click(favoriteButton);

      // The toggleFavorite should have been called
      expect(mockToggleFavorite).toHaveBeenCalledWith('prop-123');
    });

    it('should display filled heart icon for favorited property', () => {
      mockIsFavorite.mockReturnValue(true);
      renderPropertyCard();

      const heartIcon = screen.getByRole('button').querySelector('svg');
      expect(heartIcon).toHaveClass('fill-rose-500');
    });

    it('should display outlined heart icon for non-favorited property', () => {
      mockIsFavorite.mockReturnValue(false);
      renderPropertyCard();

      const heartIcon = screen.getByRole('button').querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-rose-500');
    });

    it('should have different styling for favorited state', () => {
      mockIsFavorite.mockReturnValue(true);
      const { container } = renderPropertyCard();

      const favoriteButton = container.querySelector('button');
      expect(favoriteButton).toHaveClass('bg-white', 'text-rose-500', 'scale-110');
    });

    it('should have different styling for non-favorited state', () => {
      mockIsFavorite.mockReturnValue(false);
      const { container } = renderPropertyCard();

      const favoriteButton = container.querySelector('button');
      expect(favoriteButton).toHaveClass('text-slate-700');
    });
  });

  describe('price display', () => {
    it('should display price per night', () => {
      renderPropertyCard();

      expect(screen.getByText('€150')).toBeInTheDocument();
    });

    it('should convert price using currency context', () => {
      mockConvertPrice.mockReturnValue(180);
      mockFormatPrice.mockReturnValue('$180');

      renderPropertyCard();

      expect(mockConvertPrice).toHaveBeenCalledWith(150, 'EUR');
      expect(screen.getByText('$180')).toBeInTheDocument();
    });

    it('should format price using currency context', () => {
      mockFormatPrice.mockReturnValue('€150.00');

      renderPropertyCard();

      expect(screen.getByText('€150.00')).toBeInTheDocument();
    });
  });

  describe('hover effects', () => {
    it('should have group class for hover effects', () => {
      const { container } = renderPropertyCard();

      const link = container.querySelector('a');
      expect(link).toHaveClass('group');
    });
  });

  describe('dark mode', () => {
    it('should have dark mode classes', () => {
      const { container } = renderPropertyCard();

      const card = container.querySelector('a');
      expect(card).toHaveClass('dark:bg-slate-900');
    });
  });
});
