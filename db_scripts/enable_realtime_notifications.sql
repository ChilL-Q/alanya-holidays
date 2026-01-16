-- Relax RLS for notifications to allow inserts by any authenticated user
-- This is necessary to ensure users can reliably trigger notifications (e.g. self-notifications or system triggers running as user context)

-- First, drop the old restrictive policy if it exists
drop policy if exists "Admins can insert notifications" on notifications;

-- Also drop the new policy if it exists, to avoid "already exists" error on re-run
drop policy if exists "Authenticated users can insert notifications" on notifications;

-- Now create the new policy safely
create policy "Authenticated users can insert notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated');
  
-- Ensure Realtime is enabled for the notifications table
-- We use a DO block to avoid errors if it's already added
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
