-- Migration: 20260827020000_decrement_stock_on_order_rpc
-- Purpose: Decrement product/sku stock when an order line is created.
-- Previously stock was validated in the API but never reduced anywhere,
-- allowing unbounded overselling under manual payment flow. The decrement
-- happens inside the same transaction as header+items and guards on the
-- remaining quantity, so a concurrent order that wins the race rolls this
-- one back completely (no orphaned order rows).

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
    v_quantity INTEGER;
    v_sku_id BIGINT;
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
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_sku_id := NULLIF(v_item->>'sku_id', '')::BIGINT;

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
            v_quantity,
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'final_price')::DECIMAL,
            (v_item->>'subtotal')::DECIMAL
        );

        IF v_sku_id IS NOT NULL THEN
            UPDATE public.product_skus
            SET stock = stock - v_quantity
            WHERE id = v_sku_id AND stock >= v_quantity;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient stock for sku %', v_sku_id;
            END IF;
        ELSE
            UPDATE public.product_items
            SET stock = stock - v_quantity
            WHERE id = (v_item->>'product_id')::BIGINT AND stock >= v_quantity;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('data', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_product_order FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_product_order(text, numeric, text, uuid, jsonb, jsonb) TO service_role;
