-- Fix missing UPDATE policy on chat_conversations
-- sendMessage() calls .update({ updated_at }) on chat_conversations,
-- which was broken after RLS cleanup removed the old admin ALL policy.
CREATE POLICY "chat_conversations_update" ON chat_conversations
  FOR UPDATE USING (
    (SELECT auth.uid()) = guest_id
    OR (SELECT auth.uid()) = host_id
    OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin')
  );
