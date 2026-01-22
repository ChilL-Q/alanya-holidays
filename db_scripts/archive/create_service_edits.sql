-- Create a table to store pending edits for services
create table if not exists service_edits (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references services(id) on delete cascade not null,
  changed_data jsonb not null, -- Stores the partial or full data that was changed
  status text check (status in ('pending', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rejection_reason text
);

-- Enable RLS
alter table service_edits enable row level security;

-- Policies for service_edits

-- Hosts can view their own edits
create policy "Hosts can view own service edits"
  on service_edits for select
  using (
    exists (
      select 1 from services
      where services.id = service_edits.service_id
      and services.provider_id = auth.uid()
    )
  );

-- Hosts can create edits for their own services
create policy "Hosts can create edits for own services"
  on service_edits for insert
  with check (
    exists (
      select 1 from services
      where services.id = service_edits.service_id
      and services.provider_id = auth.uid()
    )
  );

-- Admins can view all edits
create policy "Admins can view all service edits"
  on service_edits for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Admins can update edits (approve/reject/delete)
create policy "Admins can update service edits"
  on service_edits for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can delete service edits"
  on service_edits for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
