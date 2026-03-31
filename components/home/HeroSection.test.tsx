import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from './HeroSection';

// Mock useLanguage
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'hero.title': 'Discover Alanya',
        'hero.subtitle': 'Your gateway to paradise with',
        'hero.zero_fees': 'Zero Booking Fees',
      };
      return translations[key] || key;
    },
    language: 'en',
  }),
}));

// Mock SearchWidget
vi.mock('./SearchWidget', () => ({
  SearchWidget: ({ location, setLocation }: any) => (
    <div data-testid="search-widget">
      <input
        value={location}
        onChange={(e: any) => setLocation(e.target.value)}
        data-testid="search-input"
      />
    </div>
  ),
}));

// Mock WeatherWidget
vi.mock('../weather/WeatherWidget', () => ({
  WeatherWidget: () => <div data-testid="weather-widget">Weather</div>,
}));

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render hero section with title and subtitle', () => {
    render(<HeroSection location="" setLocation={() => {}} />);

    expect(screen.getByText('Discover Alanya')).toBeInTheDocument();
    expect(screen.getByText('Your gateway to paradise with')).toBeInTheDocument();
    expect(screen.getByText('Zero Booking Fees')).toBeInTheDocument();
  });

  it('should render search widget', () => {
    render(<HeroSection location="" setLocation={() => {}} />);

    expect(screen.getByTestId('search-widget')).toBeInTheDocument();
  });

  it('should render weather widget', () => {
    render(<HeroSection location="" setLocation={() => {}} />);

    expect(screen.getByTestId('weather-widget')).toBeInTheDocument();
  });

  it('should pass location prop to SearchWidget', () => {
    render(<HeroSection location="Alanya" setLocation={() => {}} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input.value).toBe('Alanya');
  });

  it('should call setLocation when search input changes', () => {
    const setLocation = vi.fn();
    render(<HeroSection location="" setLocation={setLocation} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Mahmutlar' } });

    expect(setLocation).toHaveBeenCalledWith('Mahmutlar');
  });

  it('should have proper responsive classes', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const section = container.querySelector('section');
    expect(section).toHaveClass('min-h-[85vh]');
    expect(section).toHaveClass('md:h-[600px]');
  });

  it('should have background image with fallback', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/images/hero-bg.jpg');
    expect(img).toHaveAttribute('alt', 'Alanya Coastline');
  });

  it('should handle image load error with fallback', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const img = container.querySelector('img');
    if (img) {
      fireEvent.error(img);
      expect(img).toHaveAttribute(
        'src',
        'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
      );
    }
  });

  it('should have overlay elements', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    // Should have overlay divs - check for absolute positioned divs
    const absoluteDivs = container.querySelectorAll('.absolute');
    expect(absoluteDivs.length).toBeGreaterThan(2);
  });

  it('should have animation classes', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const h1 = container.querySelector('h1');
    expect(h1).toHaveClass('animate-fade-up');
  });

  it('should have proper z-index for content', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const contentDiv = container.querySelector('.z-10');
    expect(contentDiv).toBeInTheDocument();
  });

  it('should have responsive text sizes', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const h1 = container.querySelector('h1');
    expect(h1).toHaveClass('text-3xl');
    expect(h1).toHaveClass('sm:text-4xl');
    expect(h1).toHaveClass('md:text-6xl');
  });

  it('should have accent color for zero fees text', () => {
    const { container } = render(<HeroSection location="" setLocation={() => {}} />);

    const accentText = container.querySelector('.text-accent, .dark\\:text-amber-400');
    expect(accentText).toBeInTheDocument();
  });
});
