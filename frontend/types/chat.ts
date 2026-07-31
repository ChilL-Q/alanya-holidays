export interface Message {
    id?: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    visa_type?: string;
    phone?: string;
    created_at?: string;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface ChatConversation {
    id: string;
    property_id?: string;
    guest_id: string;
    host_id: string;
    created_at: string;
    updated_at: string;
    
    // Joined data
    property?: {
        title: string;
        images: string[];
    };
    guest?: {
        full_name: string;
        avatar_url: string;
    };
    host?: {
        full_name: string;
        avatar_url: string;
    };
    
    // Computed/Virtual
    last_message?: ChatMessage;
    unread_count?: number;
}
