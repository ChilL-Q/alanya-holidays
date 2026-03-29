import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InboxPage } from './InboxPage';
import * as ChatContext from '../context/ChatContext';

// Mock Auth
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { id: 'u1' } })
}));

// Mock Language
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

// Mock Router
const mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: () => [mockSearchParams],
        Navigate: () => <div>Redirected</div>
    };
});

// Mock ChatContext
vi.mock('../context/ChatContext', () => ({
    useChat: vi.fn(),
    ChatProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock ChatWindow component locally to avoid complex renders
vi.mock('../components/chat/ChatWindow', () => ({
    ChatWindow: () => <div data-testid="chat-window">Chat Window</div>
}));

describe('InboxPage', () => {
    const mockSetActiveConversationId = vi.fn();
    const mockRefreshConversations = vi.fn();

    const defaultChatContext = {
        conversations: [
            {
                id: 'c1',
                property: { title: 'Villa A', images: [] },
                host: { full_name: 'Host A' },
                last_message: { content: 'Hello', created_at: new Date().toISOString() },
                unread_count: 1
            },
            {
                id: 'c2',
                property: { title: 'Villa B', images: [] },
                host: { full_name: 'Host B' },
                last_message: { content: 'Hi', created_at: new Date().toISOString() },
                unread_count: 0
            }
        ],
        activeConversationId: null,
        setActiveConversationId: mockSetActiveConversationId,
        refreshConversations: mockRefreshConversations
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        vi.mocked(ChatContext.useChat).mockReturnValue(defaultChatContext);
    });

    it('renders conversation list', () => {
        render(<InboxPage />);
        expect(screen.getByText('Villa A')).toBeInTheDocument();
        expect(screen.getByText('Villa B')).toBeInTheDocument();
        expect(screen.getByText('Host A')).toBeInTheDocument();
    });

    it('handles deep linking for conversationId', () => {
        // Setup Search Params
        mockSearchParams.set('conversationId', 'c1');

        render(<InboxPage />);

        expect(mockSetActiveConversationId).toHaveBeenCalledWith('c1');
    });

    it('renders chat window when conversation is active', () => {
        // @ts-ignore
        vi.mocked(ChatContext.useChat).mockReturnValue({
            ...defaultChatContext,
            activeConversationId: 'c1'
        });

        render(<InboxPage />);
        expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });
});
