-- Enable Row Level Security on all tables and create policies
-- Migration date: 2026-04-04
-- Safe to run multiple times — idempotent

-----------------------------------------------------------------------
-- Helper: create policy only if table exists and policy does not exist
-----------------------------------------------------------------------
create or replace function safe_create_policy(
    p_policy_name text,
    p_table text,
    p_statement text
) returns void as $$
declare
    tbl_exists boolean;
    pol_exists boolean;
begin
    select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = p_table
    ) into tbl_exists;

    if not tbl_exists then
        raise notice 'Table % does not exist, skipping policy %', p_table, p_policy_name;
        return;
    end if;

    select exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = p_table and policyname = p_policy_name
    ) into pol_exists;

    if pol_exists then
        raise notice 'Policy % already exists on %, skipping', p_policy_name, p_table;
        return;
    end if;

    execute p_statement;
    raise info 'Created policy % on %', p_policy_name, p_table;
end;
$$ language plpgsql;

-- Also enable RLS on all existing public tables
do $$
declare
  tbl record;
begin
  for tbl in (
    select tablename from pg_tables
    where schemaname = 'public' and tablename != '_prisma_migrations'
  ) loop
    execute format('alter table public.%I enable row level security', tbl.tablename);
  end loop;
end $$;

-----------------------------------------------------------------------
-- 1. profiles
-----------------------------------------------------------------------
select safe_create_policy('profiles: read own and others basic info', 'profiles',
  'create policy "profiles: read own and others basic info" on profiles for select using (true)');

select safe_create_policy('profiles: update own', 'profiles',
  'create policy "profiles: update own" on profiles for update using (auth.uid() = id)');

select safe_create_policy('profiles: admin can do everything', 'profiles',
  'create policy "profiles: admin can do everything" on profiles for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 2. properties
-----------------------------------------------------------------------
select safe_create_policy('properties: public read approved', 'properties',
  'create policy "properties: public read approved" on properties for select using (status = ''approved'')');

select safe_create_policy('properties: host read own', 'properties',
  'create policy "properties: host read own" on properties for select using (auth.uid() = host_id)');

select safe_create_policy('properties: admin full select', 'properties',
  'create policy "properties: admin full select" on properties for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('properties: authenticated insert', 'properties',
  'create policy "properties: authenticated insert" on properties for insert with check (auth.uid() = host_id and status = ''pending'')');

select safe_create_policy('properties: host update own', 'properties',
  'create policy "properties: host update own" on properties for update using (auth.uid() = host_id)');

select safe_create_policy('properties: admin update any', 'properties',
  'create policy "properties: admin update any" on properties for update using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('properties: admin delete', 'properties',
  'create policy "properties: admin delete" on properties for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('properties: host delete own', 'properties',
  'create policy "properties: host delete own" on properties for delete using (auth.uid() = host_id)');

-----------------------------------------------------------------------
-- 3. services
-----------------------------------------------------------------------
select safe_create_policy('services: public read approved', 'services',
  'create policy "services: public read approved" on services for select using (status = ''approved'')');

select safe_create_policy('services: provider read own', 'services',
  'create policy "services: provider read own" on services for select using (auth.uid() = provider_id)');

select safe_create_policy('services: admin full select', 'services',
  'create policy "services: admin full select" on services for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('services: authenticated insert', 'services',
  'create policy "services: authenticated insert" on services for insert with check (auth.uid() = provider_id and status = ''pending'')');

select safe_create_policy('services: provider update own', 'services',
  'create policy "services: provider update own" on services for update using (auth.uid() = provider_id)');

select safe_create_policy('services: admin update any', 'services',
  'create policy "services: admin update any" on services for update using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('services: admin delete', 'services',
  'create policy "services: admin delete" on services for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('services: provider delete own', 'services',
  'create policy "services: provider delete own" on services for delete using (auth.uid() = provider_id)');

-----------------------------------------------------------------------
-- 4. bookings
-----------------------------------------------------------------------
select safe_create_policy('bookings: user read own', 'bookings',
  'create policy "bookings: user read own" on bookings for select using (auth.uid() = user_id)');

select safe_create_policy('bookings: host read bookings of own items', 'bookings',
  'create policy "bookings: host read bookings of own items" on bookings for select using ((item_type = ''property'' and exists (select 1 from properties where properties.id = bookings.item_id and properties.host_id = auth.uid())) or (item_type = ''service'' and exists (select 1 from services where services.id = bookings.item_id and services.provider_id = auth.uid())))');

select safe_create_policy('bookings: admin full select', 'bookings',
  'create policy "bookings: admin full select" on bookings for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('bookings: authenticated insert', 'bookings',
  'create policy "bookings: authenticated insert" on bookings for insert with check (auth.uid() = user_id)');

select safe_create_policy('bookings: user cancel own', 'bookings',
  'create policy "bookings: user cancel own" on bookings for update using (auth.uid() = user_id) with check (status in (''cancelled''))');

select safe_create_policy('bookings: admin update any', 'bookings',
  'create policy "bookings: admin update any" on bookings for update using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('bookings: host update status of own items', 'bookings',
  'create policy "bookings: host update status of own items" on bookings for update using ((item_type = ''property'' and exists (select 1 from properties where properties.id = bookings.item_id and properties.host_id = auth.uid())) or (item_type = ''service'' and exists (select 1 from services where services.id = bookings.item_id and services.provider_id = auth.uid())))');

-----------------------------------------------------------------------
-- 5. reviews
-----------------------------------------------------------------------
select safe_create_policy('reviews: public read', 'reviews',
  'create policy "reviews: public read" on reviews for select using (true)');

select safe_create_policy('reviews: authenticated insert', 'reviews',
  'create policy "reviews: authenticated insert" on reviews for insert with check (auth.uid() = user_id)');

select safe_create_policy('reviews: user update own', 'reviews',
  'create policy "reviews: user update own" on reviews for update using (auth.uid() = user_id)');

select safe_create_policy('reviews: user delete own', 'reviews',
  'create policy "reviews: user delete own" on reviews for delete using (auth.uid() = user_id)');

select safe_create_policy('reviews: admin delete any', 'reviews',
  'create policy "reviews: admin delete any" on reviews for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 6. products
-----------------------------------------------------------------------
select safe_create_policy('products: public read', 'products',
  'create policy "products: public read" on products for select using (true)');

select safe_create_policy('products: authenticated insert', 'products',
  'create policy "products: authenticated insert" on products for insert with check (auth.uid() = seller_id)');

select safe_create_policy('products: seller update own', 'products',
  'create policy "products: seller update own" on products for update using (auth.uid() = seller_id)');

select safe_create_policy('products: seller delete own', 'products',
  'create policy "products: seller delete own" on products for delete using (auth.uid() = seller_id)');

select safe_create_policy('products: admin update/delete any', 'products',
  'create policy "products: admin update/delete any" on products for update using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('products: admin delete any', 'products',
  'create policy "products: admin delete any" on products for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 7. messages (contact form submissions)
-----------------------------------------------------------------------
select safe_create_policy('messages: admin read', 'messages',
  'create policy "messages: admin read" on messages for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('messages: authenticated insert', 'messages',
  'create policy "messages: authenticated insert" on messages for insert with check (true)');

select safe_create_policy('messages: admin delete', 'messages',
  'create policy "messages: admin delete" on messages for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 8. favorites
-----------------------------------------------------------------------
select safe_create_policy('favorites: user own', 'favorites',
  'create policy "favorites: user own" on favorites for select using (auth.uid() = user_id)');

select safe_create_policy('favorites: user manage own', 'favorites',
  'create policy "favorites: user manage own" on favorites for insert with check (auth.uid() = user_id)');

select safe_create_policy('favorites: user delete own', 'favorites',
  'create policy "favorites: user delete own" on favorites for delete using (auth.uid() = user_id)');

-----------------------------------------------------------------------
-- 9. auth_conversations
-----------------------------------------------------------------------
select safe_create_policy('chat_conversations: participant read', 'chat_conversations',
  'create policy "chat_conversations: participant read" on chat_conversations for select using (auth.uid() = guest_id or auth.uid() = host_id)');

select safe_create_policy('chat_conversations: authenticated insert', 'chat_conversations',
  'create policy "chat_conversations: authenticated insert" on chat_conversations for insert with check (auth.uid() = guest_id)');

select safe_create_policy('chat_conversations: admin all', 'chat_conversations',
  'create policy "chat_conversations: admin all" on chat_conversations for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 10. chat_messages
-----------------------------------------------------------------------
select safe_create_policy('chat_messages: participant read', 'chat_messages',
  'create policy "chat_messages: participant read" on chat_messages for select using (exists (select 1 from chat_conversations where chat_conversations.id = chat_messages.conversation_id and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())))');

select safe_create_policy('chat_messages: authenticated insert', 'chat_messages',
  'create policy "chat_messages: authenticated insert" on chat_messages for insert with check (exists (select 1 from chat_conversations where chat_conversations.id = chat_messages.conversation_id and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())))');

select safe_create_policy('chat_messages: participant update', 'chat_messages',
  'create policy "chat_messages: participant update" on chat_messages for update using (exists (select 1 from chat_conversations where chat_conversations.id = chat_messages.conversation_id and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())))');

select safe_create_policy('chat_messages: participant delete', 'chat_messages',
  'create policy "chat_messages: participant delete" on chat_messages for delete using (exists (select 1 from chat_conversations where chat_conversations.id = chat_messages.conversation_id and (chat_conversations.guest_id = auth.uid() or chat_conversations.host_id = auth.uid())))');

-----------------------------------------------------------------------
-- 11. chat_reports
-----------------------------------------------------------------------
select safe_create_policy('chat_reports: reporter read', 'chat_reports',
  'create policy "chat_reports: reporter read" on chat_reports for select using (auth.uid() = reporter_id)');

select safe_create_policy('chat_reports: admin read', 'chat_reports',
  'create policy "chat_reports: admin read" on chat_reports for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('chat_reports: authenticated insert', 'chat_reports',
  'create policy "chat_reports: authenticated insert" on chat_reports for insert with check (auth.uid() = reporter_id)');

-----------------------------------------------------------------------
-- 12. property_availability
-----------------------------------------------------------------------
select safe_create_policy('property_availability: public read', 'property_availability',
  'create policy "property_availability: public read" on property_availability for select using (true)');

select safe_create_policy('property_availability: owner manage', 'property_availability',
  'create policy "property_availability: owner manage" on property_availability for all using (exists (select 1 from properties where properties.id = property_availability.property_id and properties.host_id = auth.uid()))');

select safe_create_policy('property_availability: admin manage', 'property_availability',
  'create policy "property_availability: admin manage" on property_availability for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 13. property_ical_feeds
-----------------------------------------------------------------------
select safe_create_policy('property_ical_feeds: owner manage', 'property_ical_feeds',
  'create policy "property_ical_feeds: owner manage" on property_ical_feeds for all using (exists (select 1 from properties where properties.id = property_ical_feeds.property_id and properties.host_id = auth.uid()))');

select safe_create_policy('property_ical_feeds: admin manage', 'property_ical_feeds',
  'create policy "property_ical_feeds: admin manage" on property_ical_feeds for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 14. service_edits
-----------------------------------------------------------------------
select safe_create_policy('service_edits: provider read own', 'service_edits',
  'create policy "service_edits: provider read own" on service_edits for select using (exists (select 1 from services where services.id = service_edits.service_id and services.provider_id = auth.uid()))');

select safe_create_policy('service_edits: authenticated insert', 'service_edits',
  'create policy "service_edits: authenticated insert" on service_edits for insert with check (exists (select 1 from services where services.id = service_edits.service_id and services.provider_id = auth.uid()))');

select safe_create_policy('service_edits: admin update/delete', 'service_edits',
  'create policy "service_edits: admin update/delete" on service_edits for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 15. service_models
-----------------------------------------------------------------------
select safe_create_policy('service_models: public read', 'service_models',
  'create policy "service_models: public read" on service_models for select using (true)');

select safe_create_policy('service_models: admin manage', 'service_models',
  'create policy "service_models: admin manage" on service_models for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 16. audit_logs
-----------------------------------------------------------------------
select safe_create_policy('audit_logs: admin read', 'audit_logs',
  'create policy "audit_logs: admin read" on audit_logs for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

select safe_create_policy('audit_logs: service role insert', 'audit_logs',
  'create policy "audit_logs: service role insert" on audit_logs for insert with check (true)');

-----------------------------------------------------------------------
-- 17. property_overrides
-----------------------------------------------------------------------
select safe_create_policy('property_overrides: public read', 'property_overrides',
  'create policy "property_overrides: public read" on property_overrides for select using (true)');

select safe_create_policy('property_overrides: admin manage', 'property_overrides',
  'create policy "property_overrides: admin manage" on property_overrides for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 18. notifications
-----------------------------------------------------------------------
select safe_create_policy('notifications: user own', 'notifications',
  'create policy "notifications: user own" on notifications for select using (auth.uid() = user_id)');

select safe_create_policy('notifications: user update own', 'notifications',
  'create policy "notifications: user update own" on notifications for update using (auth.uid() = user_id)');

select safe_create_policy('notifications: service insert', 'notifications',
  'create policy "notifications: service insert" on notifications for insert with check (true)');

select safe_create_policy('notifications: admin read all', 'notifications',
  'create policy "notifications: admin read all" on notifications for select using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- 19. directory_listings
-----------------------------------------------------------------------
select safe_create_policy('directory_listings: public read approved', 'directory_listings',
  'create policy "directory_listings: public read approved" on directory_listings for select using (true)');

select safe_create_policy('directory_listings: admin manage', 'directory_listings',
  'create policy "directory_listings: admin manage" on directory_listings for all using (exists (select 1 from public.profiles where id = auth.uid() and role = ''admin''))');

-----------------------------------------------------------------------
-- Cleanup helper
-----------------------------------------------------------------------
drop function if exists safe_create_policy(text, text, text);
