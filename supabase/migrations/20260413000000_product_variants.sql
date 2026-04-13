-- Migration: 20260413000000_product_variants
-- Purpose: Add product_variants table for size-based variants with pricing and stock
-- Task: [86] Shop — варианты размеров с ценами

-- ============================================================
-- 1. CREATE product_variants table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
    ON public.product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_sku
    ON public.product_variants (sku)
    WHERE sku IS NOT NULL;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- SELECT: public read (anyone can view variants)
CREATE POLICY "product_variants_select" ON public.product_variants
    FOR SELECT
    USING (true);

-- INSERT: product owner (seller_id or artisan_id) or admin
CREATE POLICY "product_variants_insert" ON public.product_variants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
            AND (
                p.seller_id = (SELECT auth.uid())
                OR p.artisan_id = (SELECT auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = (SELECT auth.uid())
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- UPDATE: product owner or admin
CREATE POLICY "product_variants_update" ON public.product_variants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
            AND (
                p.seller_id = (SELECT auth.uid())
                OR p.artisan_id = (SELECT auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = (SELECT auth.uid())
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- DELETE: product owner or admin
CREATE POLICY "product_variants_delete" ON public.product_variants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
            AND (
                p.seller_id = (SELECT auth.uid())
                OR p.artisan_id = (SELECT auth.uid())
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = (SELECT auth.uid())
                    AND profiles.role = 'admin'
                )
            )
        )
    );
