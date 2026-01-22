-- Fix Chat Conversations Foreign Keys to reference public.profiles instead of auth.users
-- This is required to allow PostgREST to embed guest/host details in API responses

ALTER TABLE chat_conversations
    DROP CONSTRAINT IF EXISTS chat_conversations_guest_id_fkey,
    ADD CONSTRAINT chat_conversations_guest_id_fkey 
    FOREIGN KEY (guest_id) REFERENCES public.profiles(id);

ALTER TABLE chat_conversations
    DROP CONSTRAINT IF EXISTS chat_conversations_host_id_fkey,
    ADD CONSTRAINT chat_conversations_host_id_fkey 
    FOREIGN KEY (host_id) REFERENCES public.profiles(id);

-- Verify it worked by reloading schema cache
NOTIFY pgrst, 'reload config';
