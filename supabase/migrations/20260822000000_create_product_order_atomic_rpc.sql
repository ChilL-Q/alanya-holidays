-- Migration: 20260822000000_create_product_order_atomic_rpc
-- Purpose: Atomic order creation (header + items) in a single transaction.
-- Replaces the two-step insert from ProductsRepository.createProductOrder
-- which could leave an orphaned order_headers row if order_items insert failed.

CREATE OR REPLACE FUNCTION public.create_product_order(
    p_currency TEXT,
    p_subtotal DECIMAL,
    p_customer_notes TEXT,
    p_customer_id UUID,
    p_recipient JSONB,
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_order_id BIGINT;
    v_item JSONB;
BEGIN
    -- Single transaction: any failure rolls back header + items together.
    INSERT INTO public.order_headers (
        currency,
        payment_provider,
        status,
        subtotal_items,
        customer_notes,
        customer_id,
        recipient
    ) VALUES (
        p_currency,
        'manual',
        'pending_payment',
        p_subtotal,
        p_customer_notes,
        p_customer_id,
        p_recipient
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            sku_id,
            sku_label,
            quantity,
            unit_price,
            final_price,
            subtotal
        ) VALUES (
            v_order_id,
            v_item->>'product_id',
            v_item->>'product_name',
            v_item->>'sku_id',
            v_item->>'sku_label',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'final_price')::DECIMAL,
            (v_item->>'subtotal')::DECIMAL
        );
    END LOOP;

    RETURN jsonb_build_object('data', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_product_order FROM anon, public;
