import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from './ChatWindow';
import * as ChatContext from '../../context/ChatContext';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1' } })
}));

// Mock ChatContext
vi.mock('../../context/ChatContext', () => ({
    useChat: vi.fn(),
    ChatProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock ChatService
vi.mock('../../services/api/chat', () => ({
    chatService: {
        getMessages: vi.fn().mockResolvedValue([
            { id: 'm1', content: 'Hello', sender_id: 'u2', created_at: new Date().toISOString() }
        ]),
        subscribeToMessages: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
    }
}));

// Mock Icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        MoreVertical: () => <div data-testid="chat-menu-trigger" />,
        X: () => <div data-testid="close-icon" />,
        User: () => <div data-testid="user-icon" />
    };
});

describe('ChatWindow', () => {
    const mockClearHistory = vi.fn();
    const mockSubmitReport = vi.fn().mockResolvedValue({});
    const mockSetActiveConversationId = vi.fn();

    const defaultChatContext = {
        activeConversationId: 'c1',
        setActiveConversationId: mockSetActiveConversationId,
        sendMessage: vi.fn(),
        conversations: [
            {
                id: 'c1',
                guest_id: 'u1',
                host_id: 'u2',
                host: { full_name: 'Host User', avatar_url: 'avatar.jpg' },
                property: { title: 'Test Property' }
            }
        ],
        clearHistory: mockClearHistory,
        submitReport: mockSubmitReport
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        vi.mocked(ChatContext.useChat).mockReturnValue(defaultChatContext);
        // Mock window.confirm
        global.confirm = vi.fn(() => true);
        // Mock scrollTo
        Element.prototype.scrollTo = vi.fn();
    });

    it('renders chat header with host info', async () => {
        render(<ChatWindow />);
        // Wait for rendering because of useEffect fetch
        await waitFor(() => {
            expect(screen.getByText('Host User')).toBeInTheDocument();
            expect(screen.getByText('Test Property')).toBeInTheDocument();
        });
    });

    it('opens menu and clears history', async () => {
        render(<ChatWindow />);

        const menuBtn = screen.getByTestId('chat-menu-trigger').parentElement;
        fireEvent.click(menuBtn!);

        const clearBtn = screen.getByText('Clear history');
        fireEvent.click(clearBtn);

        expect(global.confirm).toHaveBeenCalled();
        expect(mockClearHistory).toHaveBeenCalledWith('c1');
    });

    it('opens report modal and submits report', async () => {
        render(<ChatWindow />);

        // Open menu
        const menuBtn = screen.getByTestId('chat-menu-trigger').parentElement;
        fireEvent.click(menuBtn!);

        // Click Report Issue
        const reportBtn = screen.getByText('Report issue');
        fireEvent.click(reportBtn);

        // Check if modal opens
        expect(screen.getByText('Report Issue')).toBeInTheDocument();
        // screen.debug();

        // Fill form
        const reasonSelect = screen.getByTestId('report-reason-select');
        const descInput = screen.getByTestId('report-description');

        fireEvent.change(reasonSelect, { target: { value: 'spam' } });
        fireEvent.change(descInput, { target: { value: 'Spamming me' } });

        expect(reasonSelect).toHaveValue('spam');
        expect(descInput).toHaveValue('Spamming me');

        // Submit
        fireEvent.submit(screen.getByTestId('report-form'));

        await waitFor(() => {
            expect(screen.queryByText('Report Issue')).not.toBeInTheDocument();
        });

        expect(mockSubmitReport).toHaveBeenCalled();
    });
});
