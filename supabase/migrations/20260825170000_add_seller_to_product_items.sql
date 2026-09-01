-- Migration: 20260825170000_add_seller_to_product_items
-- Purpose: Link sellable catalog items to their owner so sellers can see
-- incoming orders and manage their own products from the business dashboard.
-- Order flow writes order_items.product_id -> product_items.id, so this is
-- the single ownership edge between sellers and money.

ALTER TABLE public.product_items
    ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_product_items_seller_id
    ON public.product_items (seller_id);
