-- 1. Fix Property Visibility (Only show approved properties to public)
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
CREATE POLICY "Properties are viewable by everyone" 
ON properties FOR SELECT 
USING (status = 'approved');

-- 2. Ensure Services RLS (Restrict public read to approved)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone" 
ON services FOR SELECT 
USING (status = 'approved');

-- 3. Ensure Reviews RLS (Publicly readable, but only for approved listings/completed bookings maybe? 
-- For now, let's just make them readable to all)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" 
ON reviews FOR SELECT 
USING (true);

-- 4. Secure Service Edits (Hosts only see their own edits, Admins see all)
ALTER TABLE service_edits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hosts can see their own service edits" ON service_edits;
CREATE POLICY "Hosts can see their own service edits" 
ON service_edits FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM services 
        WHERE services.id = service_edits.service_id 
        AND services.provider_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can see all service edits" ON service_edits;
CREATE POLICY "Admins can see all service edits" 
ON service_edits FOR ALL 
USING (public.is_admin());

-- 5. Secure Products (Shop)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT 
USING (true);
