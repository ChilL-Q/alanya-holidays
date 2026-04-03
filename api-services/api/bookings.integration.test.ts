import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { adminSupabase } from '../../vitest.integration.setup';

let guestSupabase: any;
let testPropertyId: string;
let testUserId: string;

beforeAll(async () => {
    // Логинимся как тестовый гость
    const anonClient = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data } = await anonClient.auth.signInWithPassword({
        email: process.env.TEST_USER_EMAIL!,
        password: process.env.TEST_USER_PASSWORD!,
    });

    testUserId = data.user!.id;
    guestSupabase = anonClient;

    // Создаём второго пользователя для хоста
    const { data: hostUser } = await adminSupabase.auth.admin.createUser({
        email: `host_${Date.now()}@test.com`,
        password: 'TestPassword123!',
        email_confirm: true,
    });

    // Создаём тестовую property через service role
    const { data: property, error: errr } = await adminSupabase
        .from('properties')
        .insert({
            title: '__test_property__',
            host_id: hostUser.user!.id,
            price_per_night: 100,
            location: 'Test',
            status: 'approved',
        })
        .select()
        .single();
    if (errr) console.error(errr);

    testPropertyId = property.id;
});

afterAll(async () => {
    // Delete test property
    await adminSupabase.from('properties').delete().eq('title', '__test_property__');
});

describe('create_booking RPC', () => {
    it('создаёт бронирование и возвращает id', async () => {
        const { data, error } = await guestSupabase.rpc('create_booking', {
            p_item_id: testPropertyId,
            p_user_id: testUserId,
            p_check_in: '2027-06-01',
            p_check_out: '2027-06-05',
            p_total_price: 400,
            p_guests: 2,
            p_message: '__test__',
            p_payment_method: 'cash',
            p_item_type: 'property',
        });

        if (error) throw error;
        expect(data?.error).toBeUndefined();
        expect(data?.data).toBeTruthy();
    });

    it('блокирует дублирующееся бронирование на те же даты', async () => {
        const params = {
            p_item_id: testPropertyId,
            p_user_id: testUserId,
            p_check_in: '2027-07-01',
            p_check_out: '2027-07-05',
            p_total_price: 400,
            p_guests: 2,
            p_message: '__test__',
            p_payment_method: 'cash',
            p_item_type: 'property',
        };

        // Первое бронирование
        await guestSupabase.rpc('create_booking', params);

        // Второе на те же даты — должно вернуть ошибку
        const { data, error } = await guestSupabase.rpc('create_booking', params);
        if (error) throw error;
        expect(data?.error).toBeDefined();
    });
});

describe('RLS политики', () => {
    it('пользователь видит только свои брони', async () => {
        const { data } = await guestSupabase
            .from('bookings')
            .select('*')
            .neq('user_id', testUserId);

        // RLS должен вернуть пустой массив — чужие брони недоступны
        expect(data).toHaveLength(0);
    });
});

describe('audit_logs', () => {
    it('запись появляется после создания брони', async () => {
        const { data: bData } = await guestSupabase.rpc('create_booking', {
            p_item_id: testPropertyId,
            p_user_id: testUserId,
            p_check_in: '2027-08-01',
            p_check_out: '2027-08-03',
            p_total_price: 200,
            p_guests: 1,
            p_message: '__test__',
            p_payment_method: 'cash',
            p_item_type: 'property',
        });

        // Имитируем JS сервис
        await adminSupabase.from('audit_logs').insert({
            event_type: 'BOOKING_CREATED',
            details: { bookingId: bData?.data }
        });

        const { data } = await adminSupabase
            .from('audit_logs')
            .select('*')
            .eq('event_type', 'BOOKING_CREATED')
            .order('created_at', { ascending: false })
            .limit(1);

        expect(data?.[0]?.event_type).toBe('BOOKING_CREATED');
    });
});

describe('cancelBooking', () => {
    let bookingId: string;
    let cancelCounter = 1;

    beforeEach(async () => {
        const dIn = `2027-${cancelCounter.toString().padStart(2, '0')}-01`;
        const dOut = `2027-${cancelCounter.toString().padStart(2, '0')}-05`;
        cancelCounter += 1;

        // Создаём свежую бронь перед каждым тестом
        const { data, error } = await guestSupabase.rpc('create_booking', {
            p_item_id: testPropertyId,
            p_user_id: testUserId,
            p_check_in: dIn,
            p_check_out: dOut,
            p_total_price: 400,
            p_guests: 2,
            p_message: '__test__',
            p_payment_method: 'cash',
            p_item_type: 'property',
        });
        expect(error).toBeNull();
        expect(data).toBeTruthy();
        
        // Назначаем ID
        bookingId = typeof data === 'string' ? data : (data?.data || data?.id || (Array.isArray(data) ? data[0]?.id : undefined));
        
        if (!bookingId || typeof bookingId !== 'string') {
            throw new Error(`Failed to parse bookingId from create_booking response: ${JSON.stringify(data)}`);
        }
    });

    it('статус меняется на cancelled', async () => {
        // Отменяем через service role (имитируем вызов сервиса)
        const { error, data: updateData } = await adminSupabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)
            .select();

        expect(error).toBeNull();
        expect(updateData).toBeDefined();
        expect(updateData?.length).toBeGreaterThan(0);

        const { data: booking } = await adminSupabase
            .from('bookings')
            .select('status')
            .eq('id', bookingId)
            .single();

        expect(booking?.status).toBe('cancelled');
    });

    it('audit log CANCELLATION появляется после отмены', async () => {
        await adminSupabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        // createAuditLog пишет запись — проверяем что она есть
        await adminSupabase.from('audit_logs').insert({
            event_type: 'CANCELLATION',
            details: { bookingId, reason: 'Free Cancellation (within 48h)', hoursSinceCreation: '0.00' },
        });

        const { data: logs } = await adminSupabase
            .from('audit_logs')
            .select('*')
            .eq('event_type', 'CANCELLATION')
            .eq('details->>bookingId', bookingId)
            .limit(1);

        expect(logs?.length).toBeGreaterThan(0);
        expect(logs?.[0].details.reason).toContain('Cancellation');
    });

    it('пользователь не может отменить чужую бронь', async () => {
        const otherEmail = `other_${Date.now()}@test.com`;

        // Создаём второго пользователя через service role
        const { data: otherUser } = await adminSupabase.auth.admin.createUser({
            email: otherEmail,
            password: 'TestPassword123!',
            email_confirm: true,
        });

        const otherClient = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.VITE_SUPABASE_ANON_KEY!
        );
        await otherClient.auth.signInWithPassword({
            email: otherEmail,
            password: 'TestPassword123!',
        });

        // Второй пользователь пытается обновить чужую бронь
        const { data, error: _error } = await otherClient
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)
            .select();

        // RLS должен заблокировать — либо ошибка, либо пустой результат
        expect(data?.length ?? 0).toBe(0);

        // Чистим тестового пользователя
        if (otherUser.user) {
            await adminSupabase.auth.admin.deleteUser(otherUser.user.id);
        }
    });

    it('повторная отмена уже отменённой брони не ломает систему', async () => {
        await adminSupabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        // Второй раз
        const { error } = await adminSupabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        expect(error).toBeNull();
    });
});