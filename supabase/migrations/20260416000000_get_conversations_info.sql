-- Get conversations with last message and unread count in one query
-- Fixes N+1 problem in chat service
CREATE OR REPLACE FUNCTION get_conversations_info(p_user_id UUID)
RETURNS TABLE (
    conversation_id UUID,
    last_message_created_at TIMESTAMPTZ,
    last_message_text TEXT,
    last_message_sender_id UUID,
    unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH conversation_ids AS (
        SELECT id FROM chat_conversations
        WHERE guest_id = p_user_id OR host_id = p_user_id
    ),
    last_messages AS (
        SELECT DISTINCT ON (conversation_id)
            conversation_id,
            created_at AS last_message_created_at,
            text AS last_message_text,
            sender_id AS last_message_sender_id
        FROM chat_messages
        WHERE conversation_id IN (SELECT id FROM conversation_ids)
        ORDER BY conversation_id, created_at DESC
    )
    SELECT
        ci.id AS conversation_id,
        lm.last_message_created_at,
        lm.last_message_text,
        lm.last_message_sender_id,
        COUNT(cm.id)::BIGINT AS unread_count
    FROM conversation_ids ci
    LEFT JOIN last_messages lm ON lm.conversation_id = ci.id
    LEFT JOIN chat_messages cm ON cm.conversation_id = ci.id
        AND cm.sender_id != p_user_id
        AND cm.is_read = false
    GROUP BY ci.id, lm.last_message_created_at, lm.last_message_text, lm.last_message_sender_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_conversations_info(UUID) TO authenticated;
