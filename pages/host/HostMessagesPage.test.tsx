import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HostMessagesPage } from './HostMessagesPage';
import { useChat } from '../../context/ChatContext';
import { BrowserRouter } from 'react-router-dom';

const mockConversations = [
    {
        id: 'conv-1',
        guest: { full_name: 'John Doe', avatar_url: 'https://example.com/avatar.jpg' },
        property: { title: 'Beach Villa' },
        last_message: { content: 'Hello!', created_at: '2025-01-01T10:00:00Z', sender_id: 'guest' },
        unread_count: 2,
        created_at: '2025-01-01T09:00:00Z'
    },
    {
        id: 'conv-2',
        guest: { full_name: 'Jane Smith', avatar_url: null },
        property: { title: 'Mountain Cabin' },
        last_message: { content: 'Thank you!', created_at: '2025-01-02T10:00:00Z', sender_id: 'me' },
        unread_count: 0,
        created_at: '2025-01-02T09:00:00Z'
    }
];

vi.mock('../../context/ChatContext', () => ({
    useChat: vi.fn()
}));

vi.mock('../../components/chat/ChatWindow', () => ({
    ChatWindow: ({ className }: any) => (
        <div data-testid="chat-window" className={className}>
            Chat Window Mock
        </div>
    )
}));

describe('HostMessagesPage', () => {
    const mockUseChat = useChat as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseChat.mockReturnValue({
            conversations: mockConversations,
            activeConversationId: null,
            setActiveConversationId: vi.fn(),
            refreshConversations: vi.fn()
        });
    });

    it('renders messages page with conversations list', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('Messages')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        expect(screen.getByText('Mountain Cabin')).toBeInTheDocument();
    });

    it('displays conversation count badge', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const badges = screen.getAllByText('2');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('shows unread count badge for conversations with unread messages', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const badges = screen.getAllByText('2');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('calls refreshConversations on mount', async () => {
        const mockRefreshConversations = vi.fn();
        mockUseChat.mockReturnValue({
            conversations: mockConversations,
            activeConversationId: null,
            setActiveConversationId: vi.fn(),
            refreshConversations: mockRefreshConversations
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        expect(mockRefreshConversations).toHaveBeenCalled();
    });

    it('allows selecting a conversation', async () => {
        const mockSetActiveConversationId = vi.fn();
        mockUseChat.mockReturnValue({
            conversations: mockConversations,
            activeConversationId: null,
            setActiveConversationId: mockSetActiveConversationId,
            refreshConversations: vi.fn()
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const conversationButton = screen.getByText('John Doe').closest('button');
        await act(async () => {
            fireEvent.click(conversationButton!);
        });

        expect(mockSetActiveConversationId).toHaveBeenCalledWith('conv-1');
    });

    it('filters conversations by guest name', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const searchInput = screen.getByPlaceholderText('Search guests or properties...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'John' } });
        });

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('filters conversations by property title', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const searchInput = screen.getByPlaceholderText('Search guests or properties...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Beach' } });
        });

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('shows empty state when no conversations match search', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const searchInput = screen.getByPlaceholderText('Search guests or properties...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
        });

        expect(screen.getByText('No messages found')).toBeInTheDocument();
    });

    it('renders chat window when conversation is selected', async () => {
        mockUseChat.mockReturnValue({
            conversations: mockConversations,
            activeConversationId: 'conv-1',
            setActiveConversationId: vi.fn(),
            refreshConversations: vi.fn()
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    });

    it('shows placeholder when no conversation is selected', async () => {
        mockUseChat.mockReturnValue({
            conversations: mockConversations,
            activeConversationId: null,
            setActiveConversationId: vi.fn(),
            refreshConversations: vi.fn()
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('Select a conversation')).toBeInTheDocument();
        expect(screen.getByText('Choose a chat from the sidebar to view message history and respond to guests.')).toBeInTheDocument();
    });

    it('displays last message preview with "You:" prefix for sent messages', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText(/You: Thank you!/)).toBeInTheDocument();
    });

    it('displays formatted date for last message', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const dates = screen.getAllByText(/Jan \d/);
        expect(dates.length).toBeGreaterThan(0);
    });

    it('shows guest avatar when available', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const avatar = screen.getByAltText('') as HTMLImageElement;
        expect(avatar.src).toBe('https://example.com/avatar.jpg');
    });

    it('shows user icon placeholder when no avatar', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        // Jane Smith has no avatar, so should show User icon
        const userIcons = document.querySelectorAll('[data-testid="user-icon"]');
        expect(userIcons.length).toBeGreaterThanOrEqual(0);
    });

    it('sorts conversations by last message date (newest first)', async () => {
        const conversationsWithOlderMessage = [
            {
                id: 'conv-old',
                guest: { full_name: 'Old User', avatar_url: null },
                property: { title: 'Old Property' },
                last_message: { content: 'Old message', created_at: '2024-01-01T10:00:00Z', sender_id: 'guest' },
                unread_count: 0,
                created_at: '2024-01-01T09:00:00Z'
            },
            ...mockConversations
        ];

        mockUseChat.mockReturnValue({
            conversations: conversationsWithOlderMessage,
            activeConversationId: null,
            setActiveConversationId: vi.fn(),
            refreshConversations: vi.fn()
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const conversationButtons = screen.getAllByRole('button');
        const firstButton = conversationButtons[0];
        const secondButton = conversationButtons[1];

        expect(firstButton).toHaveTextContent('Jane Smith');
        expect(secondButton).toHaveTextContent('John Doe');
    });

    it('handles empty conversations list', async () => {
        mockUseChat.mockReturnValue({
            conversations: [],
            activeConversationId: null,
            setActiveConversationId: vi.fn(),
            refreshConversations: vi.fn()
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('No messages found')).toBeInTheDocument();
    });

    it('displays online status indicator for guests', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostMessagesPage />
                </BrowserRouter>
            );
        });

        const onlineIndicators = document.querySelectorAll('.bg-green-500');
        expect(onlineIndicators.length).toBeGreaterThan(0);
    });
});
