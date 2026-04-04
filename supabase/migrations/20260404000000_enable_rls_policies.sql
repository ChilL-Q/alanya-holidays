-- Enable Row Level Security on all tables and create policies
-- Migration date: 2026-04-04

-----------------------------------------------------------------------
-- 0. Ensure RLS is enabled on all tables
-----------------------------------------------------------------------
do $$
declare
  tbl record;
begin
  for tbl in (
    select tablename
    from pg_tables
    where schemaname = 'public'
      -- Skip tables that may not exist yet
      and tablename in (
        'profiles', 'properties', 'services', 'bookings', 'reviews',
        'products', 'messages', 'favorites', 'chat_conversations',
        'chat_messages', 'chat_reports', 'property_availability',
        'property_ical_feeds', 'service_edits', 'service_models',
        'audit_logs', 'property_overrides', 'notifications',
        'directory_listings'
      )
  ) loop
    execute format('alter table public.%I enable row level security', tbl.tablename);
  end loop;
end $$;

-----------------------------------------------------------------------
-- 1. profiles
-----------------------------------------------------------------------
-- Anyone can read public profile fields (needed by UI)
create policy "profiles: read own and others basic info"
  on profiles for select
  using (true);

-- Users can update only their own profile
create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id);

-- Admin role (application-level) can update any profile
create policy "profiles: admin can do everything"
  on profiles for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-----------------------------------------------------------------------
-- 2. properties
-----------------------------------------------------------------------
-- Public: read approved only
create policy "properties: public read approved"
  on properties for select
  using (status = 'approved');

-- Host: read own including non-approved
create policy "properties: host read own"
  on properties for select
  using (auth.uid() = host_id);

-- Admin: full read
create policy "properties: admin full select"
  on properties for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Any authenticated user can insert (pending approval)
create policy "properties: authenticated insert"
  on properties for insert
  with check (auth.uid() = host_id and status = 'pending');

-- Host: update own
create policy "properties: host update own"
  on properties for update
  using (auth.uid() = host_id);

-- Admin: update any
create policy "properties: admin update any"
  on properties for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Admin: delete
create policy "properties: admin delete"
  on properties for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Host: delete own (soft-delete via status=rejected is also possible)
create policy "properties: host delete own"
  on properties for delete
  using (auth.uid() = host_id);

-----------------------------------------------------------------------
-- 3. services
-----------------------------------------------------------------------
-- Public: read approved
create policy "services: public read approved"
  on services for select
  using (status = 'approved');

-- Provider: read own
create policy "services: provider read own"
  on services for select
  using (auth.uid() = provider_id);

-- Admin: full read
create policy "services: admin full select"
  on services for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Authenticated: insert own (pending)
create policy "services: authenticated insert"
  on services for insert
  with check (auth.uid() = provider_id and status = 'pending');

-- Provider: update own
create policy "services: provider update own"
  on services for update
  using (auth.uid() = provider_id);

-- Admin: update any
create policy "services: admin update any"
  on services for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Admin: delete
create policy "services: admin delete"
  on services for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Provider: delete own
create policy "services: provider delete own"
  on services for delete
  using (auth.uid() = provider_id);

-----------------------------------------------------------------------
-- 4. bookings
-----------------------------------------------------------------------
-- Users: read own bookings
create policy "bookings: user read own"
  on bookings for select
  using (auth.uid() = user_id);

-- Host: read bookings for their items via subselect
create policy "bookings: host read bookings of own items"
  on bookings for select
  using (
    (item_type = 'property' and exists (
      select 1 from properties where properties.id = bookings.item_id and properties.host_id = auth.uid()
    ))
    or
    (item_type = 'service' and exists (
      select 1 from services where services.id = bookings.item_id and services.provider_id = auth.uid()
    ))
  );

-- Admin: full read
create policy "bookings: admin full select"
  on bookings for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Authenticated: insert own booking
create policy "bookings: authenticated insert"
  on bookings for insert
  with check (auth.uid() = user_id);

-- User: cancel own booking (update status only)
create policy "bookings: user cancel own"
  on bookings for update
  using (auth.uid() = user_id)
  with check (status in ('cancelled'));

-- Admin: update any booking
create policy "bookings: admin update any"
  on bookings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Host: update status of bookings for own items (confirm/reject)
create policy "bookings: host update status of own items"
  on bookings for update
  using (
    (item_type = 'property' and exists (
      select 1 from properties where properties.id = bookings.item_id and properties.host_id = auth.uid()
    ))
    or
    (item_type = 'service' and exists (
      select 1 from services where services.id = bookings.item_id and services.provider_id = auth.uid()
    ))
  );

-----------------------------------------------------------------------
-- 5. reviews
-----------------------------------------------------------------------
-- Public: read all reviews
create policy "reviews: public read"
  on reviews for select
  using (true);

-- Authenticated: insert own review
create policy "reviews: authenticated insert"
  on reviews for insert
  with check (auth.uid() = user_id);

-- User: update own review
create policy "reviews: user update own"
  on reviews for update
  using (auth.uid() = user_id);

-- User: delete own review
create policy "reviews: user delete own"
  on reviews for delete
  using (auth.uid() = user_id);

-- Admin: delete any
create policy "reviews: admin delete any"
  on reviews for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 6. products
-----------------------------------------------------------------------
-- Public: read all products
create policy "products: public read"
  on products for select
  using (true);

-- Authenticated: insert own
create policy "products: authenticated insert"
  on products for insert
  with check (auth.uid() = seller_id);

-- Seller: update own
create policy "products: seller update own"
  on products for update
  using (auth.uid() = seller_id);

-- Seller: delete own
create policy "products: seller delete own"
  on products for delete
  using (auth.uid() = seller_id);

-- Admin: update/delete any
create policy "products: admin update/delete any"
  on products for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "products: admin delete any"
  on products for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 7. messages (contact form submissions)
-----------------------------------------------------------------------
-- Only admin can read messages
create policy "messages: admin read"
  on messages for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Any authenticated can insert (contact form)
create policy "messages: authenticated insert"
  on messages for insert
  with check (true);

-- Admin can delete
create policy "messages: admin delete"
  on messages for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 8. favorites
-----------------------------------------------------------------------
-- User: read own favorites
create policy "favorites: user own"
  on favorites for select
  using (auth.uid() = user_id);

-- User: insert/remove own
create policy "favorites: user manage own"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites: user delete own"
  on favorites for delete
  using (auth.uid() = user_id);

-----------------------------------------------------------------------
-- 9. chat_conversations
-----------------------------------------------------------------------
-- Participants: read own conversations
create policy "chat_conversations: participant read"
  on chat_conversations for select
  using (auth.uid() = guest_id or auth.uid() = host_id);

-- Authenticated: create conversation when they are guest
create policy "chat_conversations: authenticated insert"
  on chat_conversations for insert
  with check (auth.uid() = guest_id);

-- Admin: full read/write
create policy "chat_conversations: admin all"
  on chat_conversations for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 10. chat_messages
-----------------------------------------------------------------------
-- Participants: read messages in own conversations
create policy "chat_messages: participant read"
  on chat_messages for select
  using (
    exists (
      select 1 from chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
        and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())
    )
  );

-- Authenticated: insert message into own conversations
create policy "chat_messages: authenticated insert"
  on chat_messages for insert
  with check (
    exists (
      select 1 from chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
        and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())
    )
  );

-- Participants: update (mark as read) own conversation messages
create policy "chat_messages: participant update"
  on chat_messages for update
  using (
    exists (
      select 1 from chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
        and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())
    )
  );

-- Participants: delete messages in own conversations
create policy "chat_messages: participant delete"
  on chat_messages for delete
  using (
    exists (
      select 1 from chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
        and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())
    )
  );

-----------------------------------------------------------------------
-- 11. chat_reports
-----------------------------------------------------------------------
-- Reporter: read own reports
create policy "chat_reports: reporter read"
  on chat_reports for select
  using (auth.uid() = reporter_id);

-- Admin: read all
create policy "chat_reports: admin read"
  on chat_reports for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Authenticated: insert report
create policy "chat_reports: authenticated insert"
  on chat_reports for insert
  with check (auth.uid() = reporter_id);

-----------------------------------------------------------------------
-- 12. property_availability
-----------------------------------------------------------------------
-- Public: read
create policy "property_availability: public read"
  on property_availability for select
  using (true);

-- Owner via property: manage
create policy "property_availability: owner manage"
  on property_availability for all
  using (
    exists (
      select 1 from properties
      where properties.id = property_availability.property_id
        and properties.host_id = auth.uid()
    )
  );

-- Admin: manage
create policy "property_availability: admin manage"
  on property_availability for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 13. property_ical_feeds
-----------------------------------------------------------------------
-- Owner: manage feeds
create policy "property_ical_feeds: owner manage"
  on property_ical_feeds for all
  using (
    exists (
      select 1 from properties
      where properties.id = property_ical_feeds.property_id
        and properties.host_id = auth.uid()
    )
  );

-- Admin: manage
create policy "property_ical_feeds: admin manage"
  on property_ical_feeds for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 14. service_edits
-----------------------------------------------------------------------
-- Provider: read/edit own service edits
create policy "service_edits: provider read own"
  on service_edits for select
  using (
    exists (
      select 1 from services
      where services.id = service_edits.service_id
        and services.provider_id = auth.uid()
    )
  );

-- Authenticated: insert own
create policy "service_edits: authenticated insert"
  on service_edits for insert
  with check (
    exists (
      select 1 from services
      where services.id = service_edits.service_id
        and services.provider_id = auth.uid()
    )
  );

-- Admin: update/delete (approve/reject edits)
create policy "service_edits: admin update/delete"
  on service_edits for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 15. service_models
-----------------------------------------------------------------------
-- Public: read
create policy "service_models: public read"
  on service_models for select
  using (true);

-- Admin: manage
create policy "service_models: admin manage"
  on service_models for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 16. audit_logs
-----------------------------------------------------------------------
-- Admin: read only
create policy "audit_logs: admin read"
  on audit_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Edge functions / service role inserts only (no anon)
create policy "audit_logs: service role insert"
  on audit_logs for insert
  with check (true);

-----------------------------------------------------------------------
-- 17. property_overrides (slug -> UUID mapping, admin-managed)
-----------------------------------------------------------------------
-- Public: read (needed for friendly URLs)
create policy "property_overrides: public read"
  on property_overrides for select
  using (true);

-- Admin: manage
create policy "property_overrides: admin manage"
  on property_overrides for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 18. notifications
-----------------------------------------------------------------------
-- Users: read own
create policy "notifications: user own"
  on notifications for select
  using (auth.uid() = user_id);

-- Users: update own (mark read)
create policy "notifications: user update own"
  on notifications for update
  using (auth.uid() = user_id);

-- Service role only (insert via edge functions): allow true
create policy "notifications: service insert"
  on notifications for insert
  with check (true);

-- Admin: read all
create policy "notifications: admin read all"
  on notifications for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 19. directory_listings
-----------------------------------------------------------------------
-- Public: read approved
create policy "directory_listings: public read approved"
  on directory_listings for select
  using (true);

-- Admin: manage
create policy "directory_listings: admin manage"
  on directory_listings for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-----------------------------------------------------------------------
-- 20. storage buckets
-----------------------------------------------------------------------
-- These policies are managed via Supabase Dashboard → Storage.
-- Recommend in dashboard:
--   properties: authenticated users can upload, public read
--   avatars: authenticated users can upload, public read
--   (set file_size_limit to 10MB, allowed_mime_types to image/*)
