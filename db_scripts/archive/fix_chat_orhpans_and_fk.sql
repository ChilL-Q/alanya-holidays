-- 1. DELETE Orphaned Data
-- Remove conversations/messages where the user does not exist in 'profiles' table.
-- This usually happens if a user was created before the 'profiles' trigger was working correctly.

DELETE FROM chat_messages 
WHERE conversation_id IN (
    SELECT id FROM chat_conversations 
    WHERE guest_id NOT IN (SELECT id FROM profiles) 
       OR host_id NOT IN (SELECT id FROM profiles)
);

DELETE FROM chat_conversations 
WHERE guest_id NOT IN (SELECT id FROM profiles) 
   OR host_id NOT IN (SELECT id FROM profiles);

-- 2. Apply the Foreign Key Fix
ALTER TABLE chat_conversations
    DROP CONSTRAINT IF EXISTS chat_conversations_guest_id_fkey,
    ADD CONSTRAINT chat_conversations_guest_id_fkey 
    FOREIGN KEY (guest_id) REFERENCES public.profiles(id);

ALTER TABLE chat_conversations
    DROP CONSTRAINT IF EXISTS chat_conversations_host_id_fkey,
    ADD CONSTRAINT chat_conversations_host_id_fkey 
    FOREIGN KEY (host_id) REFERENCES public.profiles(id);

-- 3. Reload Config
NOTIFY pgrst, 'reload config';
