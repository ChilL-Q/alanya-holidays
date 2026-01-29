
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for admin operations if RLS blocks us

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Use Service Role Key to bypass RLS for test setup/teardown
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function runTest() {
  console.log('--- Starting Booking Expiration Verification ---');

  // 1. Setup: Find a property and user
  console.log('1. Finding test data...');
  
  const { data: properties } = await supabase.from('properties').select('id, host_id').eq('status', 'approved').limit(1);
  if (!properties || properties.length === 0) {
    console.error('No approved properties found. seeding needed?');
    return;
  }
  const property = properties[0];

  // Fix: Need a user who is NOT the host
  const { data: users } = await supabase.from('auth_users_view').select('id').neq('id', property.host_id).limit(1);
  // Fallback if view doesn't exist or is empty, try to get a random user ID from profiles if possible or just use a placeholder if dev
  // Actually, for this test we can mock the user_id if foreign keys allow it, or we need a real one.
  // Let's assume there is at least one other user.
  
  let userId = users?.[0]?.id;
  if (!userId) {
     console.log('No suitable test user found, attempting to use host (might fail validation but trying)...');
     userId = property.host_id; 
     // Note: create_booking RPC blocks own property booking, so we might need to insert directly to bypass RPC validation for the SETUP
     // But we want to test the SYSTEM.
     // Let's insert directly into bookings table to simulate a "pending" state that might have been created via RPC or other means.
     // Inserting directly avoids the "cannot book own property" check of the RPC, which is fine for testing the CLEANUP logic.
  }

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 100); // Far future to avoids conflicts
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 5);

  const checkInStr = checkIn.toISOString().split('T')[0];
  const checkOutStr = checkOut.toISOString().split('T')[0];

  console.log(`Test Booking: Property ${property.id}, User ${userId}, Dates ${checkInStr} to ${checkOutStr}`);

  // 2. Action: Create a "Stuck" Booking (Pending, Created 20 mins ago)
  // We insert directly to simulate state and set created_at in the past
  const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      item_id: property.id,
      item_type: 'property',
      user_id: userId,
      check_in: checkInStr,
      check_out: checkOutStr,
      total_price: 100,
      guests: 1,
      status: 'pending',
      payment_status: 'pending',
      created_at: twentyMinsAgo // Crucial: Simulate old booking
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create test booking:', insertError);
    return;
  }
  console.log(`2. Created "Stuck" Booking: ${booking.id} (Created at: ${booking.created_at})`);

  // 3. Manually Block Dates (since we bypassed RPC)
  // The RPC normally does this. We must ensure the dates ARE blocked to test they get CLEARED.
  // We'll mimic what create_booking does.
  const dates = [];
  let currentDate = new Date(checkIn);
  while (currentDate < checkOut) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
  }

  const availabilityInserts = dates.map(d => ({
      property_id: property.id,
      date: d.toISOString().split('T')[0],
      status: 'booked',
      source: 'reservation',
      external_id: booking.id
  }));

  const { error: blockError } = await supabase.from('property_availability').insert(availabilityInserts);
  if (blockError) {
      console.error('Failed to block dates:', blockError);
      // Clean up booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return;
  }
  console.log(`3. Verified: Dates blocked in property_availability.`);


  // 4. Action: Run Cleanup RPC
  console.log('4. Running cancel_expired_bookings()...');
  const { error: rpcError } = await supabase.rpc('cancel_expired_bookings');
  
  if (rpcError) {
      console.error('RPC Failed:', rpcError);
      return;
  }

  // 5. Verification
  console.log('5. Verifying results...');

  // Check Booking Status
  const { data: updatedBooking } = await supabase.from('bookings').select('status').eq('id', booking.id).single();
  
  if (updatedBooking.status === 'cancelled') {
      console.log('✅ PASS: Booking status updated to "cancelled"');
  } else {
      console.error(`❌ FAIL: Booking status is ${updatedBooking.status}`);
  }

  // Check Availability Released
  const { data: availability } = await supabase
      .from('property_availability')
      .select('*')
      .eq('external_id', booking.id);

  if (availability.length === 0) {
      console.log('✅ PASS: Dates released from property_availability');
  } else {
      console.error(`❌ FAIL: ${availability.length} dates still blocked!`);
  }

  console.log('--- Test Complete ---');
}

runTest().catch(console.error);
