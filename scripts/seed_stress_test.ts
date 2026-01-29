
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

// Create Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Configuration
const CONFIG = {
    USERS_COUNT: 50,
    PROPERTIES_COUNT: 500,
    BOOKINGS_COUNT: 2000,
    REVIEWS_COUNT: 1000,
    BATCH_SIZE: 50
};

// Valid Amenities (matching typical icons)
const AMENITIES_LIST = [
    { icon: 'Wifi', label: 'Fast Wi-Fi' },
    { icon: 'Pool', label: 'Swimming Pool' },
    { icon: 'Car', label: 'Parking' },
    { icon: 'Wind', label: 'Air Conditioning' },
    { icon: 'Tv', label: 'Smart TV' },
    { icon: 'ChefHat', label: 'Kitchen' },
    { icon: 'Utensils', label: 'BBQ Grill' },
    { icon: 'Dumbbell', label: 'Gym' },
    { icon: 'Waves', label: 'Sea View' },
    { icon: 'Shield', label: 'Security' }
];

const PROPERTY_TYPES = ['villa', 'apartment'];

// Helpers
const getRandomItems = <T>(arr: T[], count: number): T[] => {
    return faker.helpers.arrayElements(arr, count);
};

const generateUser = () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
        email: faker.internet.email({ firstName, lastName }),
        password: 'password123', // Default password
        email_confirm: true,
        user_metadata: {
            full_name: `${firstName} ${lastName}`,
            avatar_url: faker.image.avatar(),
            role: faker.helpers.arrayElement(['user', 'host'])
        }
    };
};

// Main Seed Function
async function seed() {
    console.log(`🚀 Starting Stress Test Seeding...`);
    console.log(`Target: ${CONFIG.USERS_COUNT} Users, ${CONFIG.PROPERTIES_COUNT} Properties, ${CONFIG.BOOKINGS_COUNT} Bookings, ${CONFIG.REVIEWS_COUNT} Reviews`);

    // 1. Create Users
    console.log(`\n👤 Generating ${CONFIG.USERS_COUNT} Users...`);
    const users = [];
    const hosts = [];
    const guests = [];

    // Note: Creating users via auth.admin.createUser is slow (sequential). 
    // We cannot batch insert into auth.users directly easily.
    // We will limit concurrency to avoid rate limits.
    
    // For verifying large data, maybe 50 is fine.
    // Let's create them in chunks of 5 parallel requests
    for (let i = 0; i < CONFIG.USERS_COUNT; i++) {
        const userData = generateUser();
        const { data, error } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: userData.user_metadata
        });

        if (error) {
            console.error(`Failed to create user ${userData.email}:`, error.message);
        } else if (data.user) {
            users.push(data.user);
            if (userData.user_metadata.role === 'host') hosts.push(data.user);
            else guests.push(data.user);
        }
        
        if (i % 10 === 0) process.stdout.write('.');
    }
    console.log(`\n✅ Created ${users.length} users (${hosts.length} hosts, ${guests.length} guests)`);

    if (hosts.length === 0) {
        console.warn('⚠️ No hosts generated! Forcing first user to be host.');
        if (users.length > 0) {
            hosts.push(users[0]);
            // Update metadata
             await supabase.auth.admin.updateUserById(users[0].id, { user_metadata: { role: 'host' }});
        }
    }

    // 2. Create Properties
    console.log(`\n🏠 Generating ${CONFIG.PROPERTIES_COUNT} Properties...`);
    const properties = [];
    for (let i = 0; i < CONFIG.PROPERTIES_COUNT; i++) {
        const host = faker.helpers.arrayElement(hosts);
        properties.push({
            title: faker.location.streetAddress() + ' ' + faker.helpers.arrayElement(['Villa', 'Resort', 'Apartment', 'Loft']),
            description: faker.lorem.paragraphs(2),
            price_per_night: faker.number.int({ min: 50, max: 1000 }),
            location: faker.location.city() + ', Alanya', // Keeping it roughly Alanya context
            latitude: faker.location.latitude({ min: 36.5, max: 36.6 }), // Approximate Alanya Lat
            longitude: faker.location.longitude({ min: 31.9, max: 32.1 }), // Approximate Alanya Long
            type: faker.helpers.arrayElement(PROPERTY_TYPES),
            amenities: getRandomItems(AMENITIES_LIST, faker.number.int({ min: 3, max: 8 })),
            images: [
                faker.image.urlLoremFlickr({ category: 'city' }),
                faker.image.urlLoremFlickr({ category: 'nightlife' }),
                faker.image.urlLoremFlickr({ category: 'nature' })
            ],
            host_id: host.id,
            bedrooms: faker.number.int({ min: 1, max: 6 }),
            bathrooms: faker.number.int({ min: 1, max: 4 }),
            max_guests: faker.number.int({ min: 2, max: 12 }),
            beds: faker.number.int({ min: 1, max: 8 }),
            status: 'approved' // Auto-approve for stress test
        });
    }

    // Batch Insert Properties
    let propertyIds: string[] = [];
    for (let i = 0; i < properties.length; i += CONFIG.BATCH_SIZE) {
        const batch = properties.slice(i, i + CONFIG.BATCH_SIZE);
        const { data, error } = await supabase.from('properties').insert(batch).select('id');
        if (error) {
            console.error('Error inserting properties batch:', error);
        } else if (data) {
            propertyIds = [...propertyIds, ...data.map(p => p.id)];
        }
        process.stdout.write('.');
    }
    console.log(`\n✅ Inserted ${propertyIds.length} properties.`);

    // 3. Create Bookings
    console.log(`\n📅 Generating ${CONFIG.BOOKINGS_COUNT} Bookings...`);
    const bookings = [];
    for (let i = 0; i < CONFIG.BOOKINGS_COUNT; i++) {
        const guest = faker.helpers.arrayElement(guests.length > 0 ? guests : users);
        const propertyId = faker.helpers.arrayElement(propertyIds);
        
        const isPast = faker.datatype.boolean();
        const checkIn = isPast ? faker.date.past() : faker.date.future();
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 2, max: 14 }));

        const status = isPast ? 'completed' : faker.helpers.arrayElement(['confirmed', 'pending', 'cancelled']);

        bookings.push({
            user_id: guest.id,
            item_id: propertyId,
            item_type: 'property',
            check_in: checkIn.toISOString().split('T')[0], // YYYY-MM-DD
            check_out: checkOut.toISOString().split('T')[0],
            status: status,
            total_price: faker.number.int({ min: 200, max: 5000 }),
            guests: faker.number.int({ min: 1, max: 6 })
        });
    }

    // Batch Insert Bookings
    for (let i = 0; i < bookings.length; i += CONFIG.BATCH_SIZE) {
        const batch = bookings.slice(i, i + CONFIG.BATCH_SIZE);
        const { error } = await supabase.from('bookings').insert(batch);
        if (error) console.error('Error inserting bookings batch:', error);
        process.stdout.write('.');
    }
    console.log(`\n✅ Inserted ${bookings.length} bookings.`);

    // 4. Create Reviews
    console.log(`\n⭐ Generating ${CONFIG.REVIEWS_COUNT} Reviews...`);
    // Only for completed items ideally, but for stress test we just link to random properties
    const reviews = [];
    for (let i = 0; i < CONFIG.REVIEWS_COUNT; i++) {
        const guest = faker.helpers.arrayElement(guests.length > 0 ? guests : users);
        const propertyId = faker.helpers.arrayElement(propertyIds);
        
        reviews.push({
            property_id: propertyId,
            user_id: guest.id,
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentences(2),
            created_at: faker.date.past().toISOString()
        });
    }

    // Batch Insert Reviews
    for (let i = 0; i < reviews.length; i += CONFIG.BATCH_SIZE) {
        const batch = reviews.slice(i, i + CONFIG.BATCH_SIZE);
        const { error } = await supabase.from('reviews').insert(batch);
        if (error) console.error('Error inserting reviews batch:', error);
        process.stdout.write('.');
    }
    console.log(`\n✅ Inserted ${reviews.length} reviews.`);

    console.log('\n✨ Stress Test Seeding Complete! ✨');
}

seed().catch(console.error);
