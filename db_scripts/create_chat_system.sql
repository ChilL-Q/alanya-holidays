-- Create Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    guest_id UUID REFERENCES auth.users(id) NOT NULL,
    host_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent duplicate conversations for same context
    UNIQUE(guest_id, host_id, property_id)
);

-- Create Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
CREATE POLICY "Users can view their own conversations" 
    ON chat_conversations FOR SELECT 
    USING (auth.uid() = guest_id OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations" 
    ON chat_conversations FOR INSERT 
    WITH CHECK (auth.uid() = guest_id); 

-- Policies for Messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations" 
    ON chat_messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND (guest_id = auth.uid() OR host_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON chat_messages;
CREATE POLICY "Users can insert messages in their conversations" 
    ON chat_messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = conversation_id 
            AND (guest_id = auth.uid() OR host_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update read status" ON chat_messages;
CREATE POLICY "Users can update read status" 
    ON chat_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND (guest_id = auth.uid() OR host_id = auth.uid())
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(guest_id, host_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
