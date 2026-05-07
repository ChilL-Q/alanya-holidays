CREATE TABLE IF NOT EXISTS public.platform_testimonials (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name text NOT NULL,
    role text,
    content text NOT NULL,
    rating integer NOT NULL DEFAULT 5,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT platform_testimonials_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.platform_testimonials ENABLE ROW LEVEL SECURITY;

-- Allow public read access to visible testimonials
CREATE POLICY "Public testimonials are viewable by everyone" ON public.platform_testimonials
    AS PERMISSIVE FOR SELECT
    TO public
    USING (is_visible = true);

-- Allow admin full access
CREATE POLICY "Admins have full access to testimonials" ON public.platform_testimonials
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK ((auth.jwt() ->> 'role') = 'admin' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Also allow service_role to manage them if needed
CREATE POLICY "Service role has full access to testimonials" ON public.platform_testimonials
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
