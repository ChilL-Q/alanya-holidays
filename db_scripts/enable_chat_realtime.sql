-- Enable Realtime for chat_messages
begin;
  -- Add table to publication if not already added
  alter publication supabase_realtime add table chat_messages;
commit;
