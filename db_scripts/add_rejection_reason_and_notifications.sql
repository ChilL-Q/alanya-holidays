-- Add rejection_reason column to services table
alter table services 
add column if not exists rejection_reason text;

-- Create notifications table if it doesn't exist
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for notifications
alter table notifications enable row level security;

-- Safely create policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own notifications' and tablename = 'notifications') then
    create policy "Users can view own notifications"
      on notifications for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Admins can insert notifications' and tablename = 'notifications') then
    create policy "Admins can insert notifications"
      on notifications for insert
      with check (
        exists (
          select 1 from profiles
          where profiles.id = auth.uid()
          and profiles.role = 'admin'
        )
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can update own notifications' and tablename = 'notifications') then
    create policy "Users can update own notifications"
      on notifications for update
      using (auth.uid() = user_id);
  end if;
end $$;
