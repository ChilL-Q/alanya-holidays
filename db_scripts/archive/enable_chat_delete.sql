-- Enable DELETE on chat_messages for conversation participants
-- This fixes the 'Clear History' functionality which was blocked by RLS.

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON chat_messages;

CREATE POLICY "Users can delete messages in their conversations" 
    ON chat_messages FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations 
            WHERE id = chat_messages.conversation_id 
            AND (guest_id = auth.uid() OR host_id = auth.uid())
        )
    );
