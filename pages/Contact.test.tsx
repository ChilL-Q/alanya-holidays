import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Contact } from './Contact';
import { messagesService } from '../api-services/api/misc';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';

// Mock dependencies
vi.mock('../api-services/api/misc', () => ({
    messagesService: {
        sendMessage: vi.fn()
    }
}));

vi.mock('../api-services', () => ({
    db: {
        getService: vi.fn()
    }
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('react-router-dom', () => ({
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
}));

describe('Contact Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: null });
    });

    it('renders contact form and info', () => {
        render(<Contact />);
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
        expect(screen.getByText('Send us a Message')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });

    it('pre-fills user data when logged in', () => {
        (useAuth as any).mockReturnValue({
            user: { name: 'Test User', email: 'test@example.com' }
        });

        render(<Contact />);

        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        // Check if readonly
        expect(screen.getByPlaceholderText('Your name')).toHaveAttribute('readonly');
    });

    it('submits form successfully', async () => {
        (messagesService.sendMessage as any).mockResolvedValue({});

        render(<Contact />);

        fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('What is this about?'), { target: { value: 'Subject' } });
        fireEvent.change(screen.getByPlaceholderText('Your message here...'), { target: { value: 'Hello' } });

        fireEvent.click(screen.getByText('Send Message'));

        await waitFor(() => {
            expect(messagesService.sendMessage).toHaveBeenCalledWith({
                name: 'John',
                email: 'john@example.com',
                subject: 'Subject',
                message: 'Hello'
            });
            expect(screen.getByText('Message Sent!')).toBeInTheDocument();
        });
    });

    it('handles submission error', async () => {
        (messagesService.sendMessage as any).mockRejectedValue(new Error('Failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(<Contact />);

        fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('What is this about?'), { target: { value: 'Subject' } });
        fireEvent.change(screen.getByPlaceholderText('Your message here...'), { target: { value: 'Hello' } });

        fireEvent.click(screen.getByText('Send Message'));

        await waitFor(() => {
            expect(screen.queryByText('Message Sent!')).not.toBeInTheDocument();
            // In the component, status 'error' doesn't show a visible error message, it just stays on form or maybe button stuck? 
            // Looking at code: setStatus('error') is called. Button text depends on status=='loading'. 
            // The form is still visible.
            expect(screen.getByText('Send Message')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});
