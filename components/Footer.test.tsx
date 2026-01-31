import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Footer } from './Footer';
import { BrowserRouter } from 'react-router-dom';

// Mock language context
const mockT = vi.fn((key) => key);
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: mockT
    })
}));

describe('Footer', () => {
    it('renders all sections', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );

        // Check for section titles (using the keys mockT returns)
        expect(screen.getByText('footer.company')).toBeDefined();
        expect(screen.getByText('footer.services_title')).toBeDefined();
        expect(screen.getByText('shop')).toBeDefined();
        expect(screen.getByText('footer.help')).toBeDefined();
        expect(screen.getByText('footer.subscribe_title')).toBeDefined();
    });

    it('renders social links', () => {
        const { container } = render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );
        // We can check for SVG icons or just presence of links
        const links = container.querySelectorAll('a');
        expect(links.length).toBeGreaterThan(10); // Many links in footer
    });

    it('handles newsletter subscription', async () => {
        vi.useFakeTimers();
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText('footer.email_placeholder');
        const button = screen.getByText('footer.join_button');

        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.click(button);

        expect(screen.getByText('footer.subscribe_success')).toBeDefined();
        expect(screen.queryByPlaceholderText('footer.email_placeholder')).toBeNull();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // Should be back to form
        expect(screen.getByPlaceholderText('footer.email_placeholder')).toBeDefined();
        vi.useRealTimers();
    });
});
