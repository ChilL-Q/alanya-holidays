import { create } from 'zustand';

type MessageRole = 'user' | 'model';

interface ChatMessage {
    role: MessageRole;
    content: string;
}

interface ChatContextData {
    propertyName?: string;
    location?: string;
}

interface ChatStore {
    // UI State
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;

    // AI Assistant State
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: ChatMessage[];
    addMessage: (msg: ChatMessage) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    chatContext: ChatContextData | null;
    setChatContext: (ctx: ChatContextData | null) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    // UI State
    activeConversationId: null,
    setActiveConversationId: (id) => set({ activeConversationId: id }),

    // AI Assistant State
    isOpen: false,
    setIsOpen: (open) => set({ isOpen: open }),
    messages: [],
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
    chatContext: null,
    setChatContext: (ctx) => set({ chatContext: ctx }),
    clearMessages: () => set({ messages: [] })
}));
