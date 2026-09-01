-- Migration: 20260827030000_shop_order_indexes_and_rls_tightening
-- Purpose:
-- 1. Index order_items lookup columns: the seller-orders path filters
--    order_headers by embedded items.product_id and joins on order_id;
--    both were full scans.
-- 2. Tighten direct-DB access (the SPA still ships an anon-key client):
--    - order_items loses its public SELECT (purchase history must go
--      through the API); service-role keeps full access.
--    - product_items public SELECT narrows to active rows so drafts and
--      deactivated items are no longer world-readable; service-role,
--      which backs every catalog/seller query, bypasses RLS as before.

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
    ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON public.order_items (order_id);

DROP POLICY IF EXISTS order_items_select ON public.order_items;

DROP POLICY IF EXISTS product_items_public_select ON public.product_items;
CREATE POLICY product_items_public_select_active ON public.product_items
    FOR SELECT USING (status = 'active');
