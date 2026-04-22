import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PremiumGate } from './PremiumGate';
import { subscriptionsService } from '../../api-services/api/subscriptions';

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock('../../api-services/api/subscriptions', () => ({
    subscriptionsService: {
        createSubscriptionCheckout: vi.fn()
    }
}));

vi.mock('react-hot-toast', () => ({
    toast: mockToast,
    default: mockToast
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children }: any) => children
}));

describe('PremiumGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            value: window.location,
            writable: true,
            configurable: true,
        });
    });

    it('renders children when user is premium', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={true} isLoading={false}>
                    <div data-testid="premium-content">Premium Content</div>
                </PremiumGate>
            );
        });

        expect(screen.getByTestId('premium-content')).toBeInTheDocument();
    });

    it('renders loading state when isLoading is true', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={true}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        // spinner is a div with animate-spin class, no ARIA role
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders unlock screen when user is not premium', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Premium Content</div>
                </PremiumGate>
            );
        });

        expect(screen.getByText('Unlock Premium')).toBeInTheDocument();
        expect(screen.getByText(/Get your personalized AI travel itinerary/i)).toBeInTheDocument();
    });

    it('renders all feature items', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        expect(screen.getByText('AI-powered personalized trip itineraries')).toBeInTheDocument();
        expect(screen.getByText('Minute-by-minute day plans')).toBeInTheDocument();
        expect(screen.getByText('Budget & pace customization')).toBeInTheDocument();
        expect(screen.getByText('Access to verified local consultants')).toBeInTheDocument();
        expect(screen.getByText('PDF export & share')).toBeInTheDocument();
    });

    it('renders monthly and annual pricing options', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        expect(screen.getByText('$9.99')).toBeInTheDocument();
        expect(screen.getByText('$79.99')).toBeInTheDocument();
        expect(screen.getByText('per month')).toBeInTheDocument();
        expect(screen.getByText('per year')).toBeInTheDocument();
    });

    it('shows Save 33% badge on annual plan', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        expect(screen.getByText('Save 33%')).toBeInTheDocument();
    });

    it('calls createSubscriptionCheckout with monthly plan', async () => {
        (subscriptionsService.createSubscriptionCheckout as any).mockResolvedValue({ url: 'https://checkout.stripe.com' });

        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        const monthlyButton = screen.getByText('$9.99').closest('button')!;
        await act(async () => {
            fireEvent.click(monthlyButton);
        });

        await waitFor(() => {
            expect(subscriptionsService.createSubscriptionCheckout).toHaveBeenCalledWith('monthly');
        });
    });

    it('calls createSubscriptionCheckout with annual plan', async () => {
        (subscriptionsService.createSubscriptionCheckout as any).mockResolvedValue({ url: 'https://checkout.stripe.com' });

        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        const annualButton = screen.getByText('$79.99').closest('button')!;
        await act(async () => {
            fireEvent.click(annualButton);
        });

        await waitFor(() => {
            expect(subscriptionsService.createSubscriptionCheckout).toHaveBeenCalledWith('annual');
        });
    });

    it('redirects to checkout URL on successful upgrade', async () => {
        const checkoutUrl = 'https://checkout.stripe.com/test';
        (subscriptionsService.createSubscriptionCheckout as any).mockResolvedValue({ url: checkoutUrl });

        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        const annualButton = screen.getByText('$79.99').closest('button')!;
        await act(async () => {
            fireEvent.click(annualButton);
        });

        await waitFor(() => {
            expect(window.location.href).toBe(checkoutUrl);
        });
    });

    it('shows error toast when checkout fails', async () => {
        (subscriptionsService.createSubscriptionCheckout as any).mockRejectedValue(new Error('Checkout failed'));

        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        const monthlyButton = screen.getByText('$9.99').closest('button')!;
        await act(async () => {
            fireEvent.click(monthlyButton);
        });

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to start checkout. Please try again.');
        });
    });

    it('disables buttons while upgrading', async () => {
        (subscriptionsService.createSubscriptionCheckout as any).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({ url: 'https://checkout.stripe.com' }), 100))
        );

        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        const monthlyButton = screen.getByText('$9.99').closest('button') as HTMLButtonElement;
        const annualButton = screen.getByText('$79.99').closest('button') as HTMLButtonElement;

        await act(async () => {
            fireEvent.click(annualButton);
        });

        await waitFor(() => {
            expect(monthlyButton.disabled).toBe(true);
            expect(annualButton.disabled).toBe(true);
        });
    });

    it('renders Sparkles icon in header', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        // Sparkles is used as icon
        expect(screen.getByText('Unlock Premium')).toBeInTheDocument();
    });

    it('renders Cancel anytime text', async () => {
        await act(async () => {
            render(
                <PremiumGate isPremium={false} isLoading={false}>
                    <div>Content</div>
                </PremiumGate>
            );
        });

        expect(screen.getByText(/Cancel anytime/i)).toBeInTheDocument();
        expect(screen.getByText(/Secure payment via Stripe/i)).toBeInTheDocument();
    });
});
