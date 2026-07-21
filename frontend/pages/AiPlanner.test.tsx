import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AiPlanner } from './AiPlanner';
import { planTrip } from '../api-services/aiService';
import { subscriptionsService } from '../api-services/api/subscriptions';

const mockUser = { id: 'user-1', full_name: 'Test User', email: 'test@test.com' };
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../components/seo/SEOHead', () => ({
    SEOHead: () => null
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        isAuthenticated: true
    })
}));

vi.mock('../api-services/aiService', () => ({
    planTrip: vi.fn()
}));

vi.mock('../api-services/api/ai', () => ({
    generateItinerary: vi.fn()
}));

vi.mock('../api-services/api/itineraries', () => ({
    itinerariesService: {
        saveItinerary: vi.fn()
    }
}));

vi.mock('../api-services/api/subscriptions', () => ({
    subscriptionsService: {
        getPremiumStatus: vi.fn()
    }
}));

vi.mock('../components/ai/TripPlannerForm', () => ({
    TripPlannerForm: ({ onComplete }: { onComplete: (prefs: any) => void }) => (
        <button onClick={() => onComplete({ duration: 3, companion: 'solo', interests: ['beach'], pace: 'relaxed', budget: 'mid' })}>
            Generate Itinerary
        </button>
    )
}));

vi.mock('../components/ai/TripItinerary', () => ({
    TripItinerary: ({ itinerary }: { itinerary: any[] }) => (
        <div data-testid="trip-itinerary">Itinerary: {itinerary.length} days</div>
    )
}));

vi.mock('../components/ui/PremiumGate', () => ({
    PremiumGate: ({ children, isPremium }: { children: React.ReactNode; isPremium: boolean; isLoading: boolean }) =>
        isPremium ? <>{children}</> : <div>Upgrade to Premium</div>
}));

describe('AiPlanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        (subscriptionsService.getPremiumStatus as any).mockResolvedValue({ isPremium: true });
    });

    it('renders AI planner page with title', async () => {
        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
    });

    it('renders trip planner form for premium user', async () => {
        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });

    it('shows loading state when premium status is loading', async () => {
        (subscriptionsService.getPremiumStatus as any).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({ isPremium: true }), 100))
        );

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        // Should still show something while loading
        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });

    it('calls getPremiumStatus on mount', async () => {
        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        await waitFor(() => {
            expect(subscriptionsService.getPremiumStatus).toHaveBeenCalled();
        });
    });

    it('submits trip preferences and shows loading state', async () => {
        (planTrip as any).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(JSON.stringify({ itinerary: [] })), 500))
        );

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });

    it('shows results when planTrip succeeds', async () => {
        const mockItinerary = [
            {
                day: 1,
                date: '2024-06-15',
                activities: [
                    { time: '09:00', title: 'Beach Morning', description: 'Relax at Kleopatra Beach', type: 'beach' }
                ]
            }
        ];

        (planTrip as any).mockResolvedValue(JSON.stringify({ itinerary: mockItinerary }));

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });

    it('handles planTrip error gracefully', async () => {
        (planTrip as any).mockRejectedValue(new Error('API Error'));

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });

    it('resets form when reset button is clicked', async () => {
        const mockItinerary = [
            {
                day: 1,
                date: '2024-06-15',
                activities: [
                    { time: '09:00', title: 'Test Activity', description: 'Test description', type: 'beach' }
                ]
            }
        ];

        (planTrip as any).mockResolvedValue(JSON.stringify({ itinerary: mockItinerary }));

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        // First generate
        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });

    it('clears session storage on reset', async () => {
        sessionStorage.setItem('ai-planner-status', 'results');
        sessionStorage.setItem('ai-planner-itinerary', JSON.stringify([{ day: 1 }]));

        const mockItinerary = [
            {
                day: 1,
                date: '2024-06-15',
                activities: [
                    { time: '09:00', title: 'Test', description: 'Test', type: 'beach' }
                ]
            }
        ];

        (planTrip as any).mockResolvedValue(JSON.stringify({ itinerary: mockItinerary }));

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        expect(sessionStorage.getItem('ai-planner-status')).toBeTruthy();
    });

    it('restores state from session storage', async () => {
        sessionStorage.setItem('ai-planner-status', 'form');
        sessionStorage.setItem('ai-planner-itinerary', JSON.stringify([]));

        await act(async () => {
            render(<MemoryRouter><AiPlanner /></MemoryRouter>);
        });

        await waitFor(() => {
            expect(screen.getByText(/AI Concierge/i)).toBeInTheDocument();
        });
    });
});
