import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Message {
    role: 'user' | 'model';
    content: string;
}

interface ChatContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: Message[];
    addMessage: (message: Message) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    chatContext: { propertyName?: string; location?: string } | null;
    setChatContext: (context: { propertyName?: string; location?: string } | null) => void;
    clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [chatContext, setChatContext] = useState<{ propertyName?: string; location?: string } | null>(null);

    // Initialize messages from localStorage
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('chat_history');
        return saved ? JSON.parse(saved) : [];
    });

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('chat_history', JSON.stringify(messages));
    }, [messages]);

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const clearMessages = () => {
        setMessages([]);
        localStorage.removeItem('chat_history');
    };

    return (
        <ChatContext.Provider value={{
            isOpen,
            setIsOpen,
            messages,
            addMessage,
            isLoading,
            setIsLoading,
            chatContext,
            setChatContext,
            clearMessages
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (undefined === context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
