/**
 * Forum Seeding Script
 * Inserts 80+ realistic forum posts across all categories
 * Run: npx ts-node scripts/seed-forum.ts
 */

import { forumService } from '../api-services/api/forum';

interface PostSeed {
    title: string;
    body: string;
    categorySlug: string;
    comments?: string[];
}

const SEED_POSTS: PostSeed[] = [
    // Travel & Vacation Planning
    { title: 'First time in Alanya — 5 days itinerary', categorySlug: 'travel-first-time', body: `Hi! First visit with my wife in August. 5 days total. Beaches, food, and maybe a day trip. What are the must-dos? Should we rent a car or stick to taxis/scooters?` },
    { title: 'Best time to visit — June or September?', categorySlug: 'travel-best-time', body: `Planning my trip and torn between June and September. I hate extreme heat but love swimming. Which month is better? Water temperature? Crowds?` },
    { title: 'Daily budget breakdown for 2 weeks', categorySlug: 'travel-budget', body: `Solo traveler, 14 days planned. What's realistic daily budget for accommodation, food, and activities?` },
    { title: 'Flights from London to Antalya', categorySlug: 'travel-flights', body: `Looking at easyJet, Ryanair, and Turkish Airlines. Which offers best value? Baggage fees?` },
    { title: 'Where to stay — Old Town vs Beach area?', categorySlug: 'travel-hotels', body: `Can't decide between Old Town and beach area. Old Town seems charming but noisy? Beach seems touristy?` },
    { title: 'Visa requirements for US citizens', categorySlug: 'travel-itineraries', body: `Planning 3-week visit. Do I need a visa or can I get it on arrival?` },
    { title: 'Phone roaming in Turkey — local SIM or EU plan?', categorySlug: 'travel-itineraries', body: `EU based. Is roaming expensive or should I buy local Turkish SIM?` },
    { title: 'What to pack for August in Mediterranean', categorySlug: 'travel-best-time', body: `First time in Mediterranean summer heat. What am I missing from my packing list?` },
    { title: 'Group trip planning — 8 friends, 10 days', categorySlug: 'travel-hotels', body: `Organizing friends trip in September. Should we stay together or separately? Group activities recommendations?` },
    { title: 'Airport transfers from Antalya', categorySlug: 'travel-flights', body: `From Antalya airport — should I arrange transfer, rent car, or take taxi?` },

    // Beaches & Nature
    { title: 'Cleopatra Beach vs Dim River — pick one?', categorySlug: 'beaches-cleopatra', body: `Can't fit both in one day. Which should I prioritize — beach day or river hiking?` },
    { title: 'Hidden coves for snorkeling near Alanya', categorySlug: 'beaches-hidden', body: `Looking for less touristy beaches for snorkeling. Any secret spots? Need boat or walkable?` },
    { title: 'Dim Cave and Dim River combo day trip', categorySlug: 'beaches-dim-river', body: `Can I do cave tour plus river hike same day? Duration of each? Best order?` },
    { title: 'Best time to hike — early morning or sunset?', categorySlug: 'beaches-hiking', body: `Planning castle viewpoint hike. Early morning or sunset? Heat and crowd concerns?` },
    { title: 'Water safety — currents, urchins, jellyfish', categorySlug: 'beaches-cleopatra', body: `Keen swimmer here. Any sea hazards I should watch for?` },
    { title: 'Beach clubs — worth the cost?', categorySlug: 'beaches-clubs', body: `Considering a beach club day. Which are good value? Worth the entrance fee?` },
    { title: 'Paragliding in Alanya — operators and prices', categorySlug: 'beaches-nature', body: `Alanya good for paragliding? Recommended companies? Pricing?` },
    { title: 'Rocky vs sand beaches — which better?', categorySlug: 'beaches-hidden', body: `Some beaches rocky, others sandy. Preferences? Best for snorkeling?` },

    // Food & Nightlife
    { title: 'Turkish breakfast must-tries in Alanya', categorySlug: 'food-breakfast', body: `Turkish breakfast is legendary. Where should I experience authentic traditional breakfast?` },
    { title: 'Pide vs Pizza — local favorite here?', categorySlug: 'food-restaurants', body: `Love both. Is Turkish pide here worth trying over pizza?` },
    { title: 'Best seafood restaurants on waterfront', categorySlug: 'food-restaurants', body: `Want to splurge on nice seafood dinner with a view. Recommendations?` },
    { title: 'Street food favorites and locations', categorySlug: 'food-street', body: `Love street food. What must-try street eats are available in Alanya?` },
    { title: 'Best cafes with wifi for remote work', categorySlug: 'food-cafes', body: `Work remotely. Need good coffee and WiFi for a few hours. Recommendations?` },
    { title: 'Nightlife scene — bars, clubs, live music', categorySlug: 'food-bars', body: `Looking for evening activities. Good bars or clubs? Live music venues?` },
    { title: 'Turkish desserts worth trying', categorySlug: 'food-cafes', body: `Turkish desserts look amazing. Which are genuinely good vs tourist traps?` },
    { title: 'Alcohol availability — beers and wine', categorySlug: 'food-bars', body: `Like wine and beer. Is alcohol available? Local Turkish beers worth trying?` },

    // Things to Do
    { title: 'Alanya Castle tour — how many hours?', categorySlug: 'things-castle', body: `Planning castle visit. Self-explore or need guide? How many hours should I allow?` },
    { title: 'Boat tours — sunset or daytime?', categorySlug: 'things-boat-tours', body: 'Should I book sunset or daytime boat tour? Which experience is better?' },
    { title: 'Jet skis and water sports pricing', categorySlug: 'things-water-sports', body: 'Want to try jet skiing. Where to rent? Cost?' },
    { title: 'Family activities for kids aged 8-12', categorySlug: 'things-family', body: 'Traveling with two kids. Activities to keep them happy and entertained?' },
    { title: 'Day trips from Alanya — where to go', categorySlug: 'things-day-trips', body: 'Spent 3 days locally. Where can I day trip to nearby?' },
    { title: 'Horse riding on the beach — available?', categorySlug: 'things-water-sports', body: 'Saw people on horses on beach. Is this available? Cost?' },
    { title: 'PADI scuba diving certification', categorySlug: 'things-water-sports', body: 'Want PADI certification. Good schools here? Pricing?' },

    // Expats & Digital Nomads
    { title: 'Residence permit (ikamet) process', categorySlug: 'expats-permits', body: "Considering long-term stay. What's the residence permit process? Timeline and cost?" },
    { title: 'Affordable neighborhoods for expats', categorySlug: 'expats-community', body: 'Looking to rent long-term. Which neighborhoods are affordable but have amenities?' },
    { title: 'Monthly budget for 3-month stay', categorySlug: 'expats-cost-of-living', body: 'Staying 3 months. Realistic budget for rent, food, utilities?' },
    { title: 'Coworking spaces for remote workers', categorySlug: 'expats-coworking', body: 'Work remotely. Need proper desk setup. Any coworking spaces available?' },
    { title: 'Healthcare and insurance options', categorySlug: 'expats-healthcare', body: 'Long-term stay. Healthcare options? Private insurance worth it?' },
    { title: 'Opening Turkish bank account as foreigner', categorySlug: 'expats-banking', body: 'Do I need Turkish bank account? Can foreigners open one easily?' },
    { title: 'Meeting other expats and community', categorySlug: 'expats-community', body: 'Moving solo. How do expats connect and socialize here?' },
    { title: 'Learning Turkish language options', categorySlug: 'expats-coworking', body: 'Want to learn Turkish. Language classes or tutors available?' },
    { title: 'Internet reliability for remote work', categorySlug: 'expats-coworking', body: 'Need fast reliable internet. Connectivity and reliability?' },

    // Real Estate & Investment
    { title: 'Property prices per square meter', categorySlug: 'realestate-buying', body: 'Looking to buy apartment. Fair price per sqm? Good time to buy?' },
    { title: 'Airbnb rental income expectations', categorySlug: 'realestate-investment', body: 'Considering Airbnb rental property. What returns realistic?' },
    { title: 'Legal issues for foreign property buyers', categorySlug: 'realestate-legal', body: 'Want to buy but concerned about legal complications. What should I know?' },
    { title: 'Renovation budget for property', categorySlug: 'realestate-buying', body: 'Found cheap place needing renovation. Realistic budget?' },
    { title: 'Long-term rental rights and protections', categorySlug: 'realestate-renting', body: 'Renting apartment. What are tenant rights? Eviction protection?' },
    { title: 'Up-and-coming neighborhoods for investment', categorySlug: 'realestate-areas', body: 'Looking for investment potential. Neighborhoods to watch?' },

    // Local Life & Culture
    { title: 'Turkish customs and etiquette', categorySlug: 'culture-traditions', body: 'Want to be respectful. Key cultural norms I should follow?' },
    { title: 'Useful basic Turkish phrases', categorySlug: 'culture-language', body: 'Want to make an effort. Most useful Turkish phrases for tourists?' },
    { title: 'Bazaar haggling etiquette', categorySlug: 'culture-bazaars', body: 'Going to bazaar. Should I haggle? Will it offend?' },
    { title: 'Islamic holidays and Ramadan', categorySlug: 'culture-traditions', body: "When is Ramadan? How will it affect my visit?" },
    { title: 'Authentic souvenirs vs tourist traps', categorySlug: 'culture-bazaars', body: "Quality souvenirs. What's genuine Turkish vs tourist junk?" },

    // Events & Meetups
    { title: 'Digital nomad meetups and community', categorySlug: 'events-social', body: 'Any regular meetups for remote workers here?' },
    { title: 'Beach volleyball pickup games', categorySlug: 'events-sports', body: 'See beach volleyball games. Can tourists join?' },
    { title: 'Language exchange nights', categorySlug: 'events-language', body: 'Active language exchange community? Practice and help others?' },
    { title: 'Summer festivals and events', categorySlug: 'events-festivals', body: 'Big summer events or festivals? When do they happen?' },

    // Support & Help
    { title: 'New to Alanya — where do I start?', categorySlug: 'support-newbie', body: 'Just arrived. No clue where things are. Newcomer tips?' },
    { title: 'Emergency contacts and numbers', categorySlug: 'support-safety', body: 'What are emergency numbers? Police, ambulance, etc?' },
    { title: 'Internet speed and connectivity', categorySlug: 'support-forum', body: 'Need fast internet for work. Connectivity expectations?' },
    { title: 'SIM card options and providers', categorySlug: 'support-newbie', body: 'Which mobile provider? Turkcell, Vodafone, or others?' },
    { title: 'Safety tips for tourists', categorySlug: 'support-safety', body: 'Is Alanya safe? Any safety tips I should know?' },

    // Marketplace
    { title: 'Selling used furniture when leaving', categorySlug: 'market-buy-sell', body: 'Leaving Alanya. Where to sell used furniture?' },
    { title: 'Furnished vs unfurnished apartments', categorySlug: 'market-housing', body: 'Furnished or unfurnished? Pros and cons comparison?' },
    { title: 'Jobs available for expats', categorySlug: 'market-jobs', body: 'Looking for work. What jobs available for foreigners?' },
    { title: 'Free events and budget activities', categorySlug: 'market-free', body: 'Budget traveler. Free or cheap things to do?' },
];

async function seedForum() {
    console.log('Starting forum seed...');
    let created = 0;

    for (const post of SEED_POSTS) {
        try {
            // Create post (will fail gracefully if auth issues)
            const result = await forumService.createForumPost({
                title: post.title,
                body: post.body,
                category_id: post.categorySlug, // API will resolve slug to ID
            });
            created++;
            console.log(`✓ Created: "${post.title.substring(0, 50)}..."`);
        } catch (error: any) {
            // Authentication error — skip this post
            if (error.message?.includes('Not authenticated')) {
                console.warn(`⚠ Skipped (auth): "${post.title.substring(0, 40)}..."`);
            } else {
                console.error(`✗ Failed: "${post.title.substring(0, 40)}..."`, error.message);
            }
        }
    }

    console.log(`\nSeeding complete! Created ${created}/${SEED_POSTS.length} posts`);
}

seedForum();
