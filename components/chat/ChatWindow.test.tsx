import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ChatWindow } from './ChatWindow';
import * as ChatContext from '../../context/ChatContext';
import { chatService } from '../../api-services/api/chat';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1' } })
}));

// Mock ChatContext
vi.mock('../../context/ChatContext', () => ({
    useChat: vi.fn(),
    ChatProvider: ({ children }: any) => <div>{children}</div>
}));

// Mock API Services
vi.mock('../../api-services/api/chat', () => ({
    chatService: {
        getMessages: vi.fn(),
        subscribeToMessages: vi.fn(),
    }
}));

// Mock matchMedia for subcomponents
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock Icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        MoreVertical: () => <div data-testid="chat-menu-trigger" />,
        X: () => <div data-testid="close-icon" />,
        User: () => <div data-testid="user-icon" />,
        Send: () => <div data-testid="send-icon" />
    };
});

describe('ChatWindow', () => {
    const mockClearHistory = vi.fn();
    const mockSubmitReport = vi.fn().mockResolvedValue({});
    const mockSetActiveConversationId = vi.fn();
    const mockSendMessage = vi.fn();

    let mockSubscribeCallback: any = null;
    const mockUnsubscribe = vi.fn();

    const defaultChatContext = {
        activeConversationId: 'c1',
        setActiveConversationId: mockSetActiveConversationId,
        sendMessage: mockSendMessage,
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

        // Default mocks
        global.confirm = vi.fn(() => true);
        Element.prototype.scrollTo = vi.fn();

        (chatService.getMessages as any).mockResolvedValue([
            { id: 'm1', content: 'Hello', sender_id: 'u2', created_at: new Date().toISOString() }
        ]);

        (chatService.subscribeToMessages as any).mockImplementation((_cId: string, cb: any) => {
            mockSubscribeCallback = cb;
            return { unsubscribe: mockUnsubscribe };
        });
    });

    it('returns null if no active conversation', () => {
        // @ts-ignore
        vi.mocked(ChatContext.useChat).mockReturnValue({ ...defaultChatContext, activeConversationId: null });
        const { container } = render(<ChatWindow />);
        expect(container).toBeEmptyDOMElement();
    });

    it('loads and renders messages', async () => {
        await act(async () => {
            render(<ChatWindow />);
        });

        expect(chatService.getMessages).toHaveBeenCalledWith('c1');
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('sends a message optimistically', async () => {
        const mockRealMsg = { id: 'm2', content: 'Testing send', sender_id: 'u1', created_at: new Date().toISOString() };
        mockSendMessage.mockResolvedValueOnce(mockRealMsg);

        await act(async () => {
            render(<ChatWindow />);
        });

        const input = screen.getByPlaceholderText(/Type a message/i);
        await act(async () => {
            fireEvent.change(input, { target: { value: 'Testing send' } });
            fireEvent.submit(input.closest('form')!);
        });

        // Optimistic UI updates right away
        expect(screen.getByText('Testing send')).toBeInTheDocument();
        expect(mockSendMessage).toHaveBeenCalledWith('Testing send');

        // wait for replacement
        await waitFor(() => {
            expect(screen.getByText('Testing send')).toBeInTheDocument();
        });
    });

    it('handles message send failure by reverting optimistic message', async () => {
        mockSendMessage.mockImplementationOnce(() => Promise.reject(new Error('Send failed')));

        await act(async () => {
            render(<ChatWindow />);
        });

        const input = screen.getByPlaceholderText(/Type a message/i);
        await act(async () => {
            fireEvent.change(input, { target: { value: 'Fail message' } });
            fireEvent.submit(input.closest('form')!);
        });

        // The input value should be restored if it fails
        await waitFor(() => {
            expect(screen.queryByText('Fail message')).not.toBeInTheDocument();
            expect((input as HTMLInputElement).value).toBe('Fail message');
        });
    });

    it('handles real-time incoming messages', async () => {
        await act(async () => {
            render(<ChatWindow />);
        });

        await act(async () => {
            mockSubscribeCallback({ id: 'm3', content: 'Real-time text', sender_id: 'u2', created_at: new Date().toISOString() });
        });

        expect(screen.getByText('Real-time text')).toBeInTheDocument();
    });

    it('unsubscribes on unmount', async () => {
        let unmountFn: any;
        await act(async () => {
            const { unmount } = render(<ChatWindow />);
            unmountFn = unmount;
        });

        unmountFn();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('clears history via header menu', async () => {
        await act(async () => {
            render(<ChatWindow />);
        });

        const menuBtn = screen.getByTestId('chat-menu-trigger').parentElement;
        await act(async () => {
            fireEvent.click(menuBtn!);
        });

        const clearBtn = screen.getByText('Clear history');
        await act(async () => {
            fireEvent.click(clearBtn);
        });

        expect(global.confirm).toHaveBeenCalled();
        expect(mockClearHistory).toHaveBeenCalledWith('c1');
        // Verify messages list is cleared
        expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });

    it('sets active conversation to null when closing chat', async () => {
        await act(async () => {
            render(<ChatWindow embedded={false} />);
        });

        const closeBtn = screen.getByTestId('close-icon').parentElement;
        await act(async () => {
            if (closeBtn) fireEvent.click(closeBtn);
        });

        expect(mockSetActiveConversationId).toHaveBeenCalledWith(null);
    });

    it('opens report modal and submits report', async () => {
        await act(async () => {
            render(<ChatWindow />);
        });

        const menuBtn = screen.getByTestId('chat-menu-trigger').parentElement;
        await act(async () => {
            fireEvent.click(menuBtn!);
        });

        const reportBtn = screen.getByText('Report issue');
        await act(async () => {
            fireEvent.click(reportBtn);
        });

        expect(screen.getByText('Report Issue')).toBeInTheDocument();

        const reasonSelect = screen.getByTestId('report-reason-select');
        const descInput = screen.getByTestId('report-description');

        await act(async () => {
            fireEvent.change(reasonSelect, { target: { value: 'spam' } });
            fireEvent.change(descInput, { target: { value: 'Spamming me' } });
        });

        expect(reasonSelect).toHaveValue('spam');
        expect(descInput).toHaveValue('Spamming me');

        await act(async () => {
            fireEvent.submit(screen.getByTestId('report-form'));
        });

        await waitFor(() => {
            expect(screen.queryByText('Report Issue')).not.toBeInTheDocument();
        });

        expect(mockSubmitReport).toHaveBeenCalled();
    });
});
