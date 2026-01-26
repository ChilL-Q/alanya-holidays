import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from './Home';

// Mock child components to isolate Home page testing
vi.mock('../components/home/HeroSection', () => ({
    HeroSection: () => <div data-testid="hero-section">Hero Section</div>
}));

vi.mock('../components/home/ValueProps', () => ({
    ValueProps: () => <div data-testid="value-props">Value Props</div>
}));

vi.mock('../components/home/FeaturedProperties', () => ({
    FeaturedProperties: () => <div data-testid="featured-properties">Featured Properties</div>
}));

vi.mock('../components/home/AlanyaIntro', () => ({
    AlanyaIntro: () => <div data-testid="alanya-intro">Alanya Intro</div>
}));

describe('Home Page', () => {
    it('renders all sections correctly', () => {
        render(<Home />);

        expect(screen.getByTestId('hero-section')).toBeInTheDocument();
        expect(screen.getByTestId('value-props')).toBeInTheDocument();
        expect(screen.getByTestId('alanya-intro')).toBeInTheDocument();
        expect(screen.getByTestId('featured-properties')).toBeInTheDocument();
    });
});
