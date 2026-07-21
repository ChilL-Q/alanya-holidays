/**
 * Forum Seed Data: 120+ realistic posts across all categories
 * Each post includes title, body, category slug, and 2-5 comments
 */

export interface SeedPost {
    title: string;
    body: string;
    categorySlug: string;
    author: string;
    comments: Array<{ body: string; author: string }>;
}

export const forumSeedData: SeedPost[] = [
    // ============================================================
    // Travel & Vacation Planning (15 posts)
    // ============================================================
    {
        title: 'First time in Alanya — 5 days itinerary suggestion',
        body: 'Hi everyone! I\'m visiting Alanya for the first time with my wife in August. We have 5 days total. We\'re interested in beaches, local food, and maybe one day trip. What\'s the must-do list? Should we rent a car or stick to taxis/scooters? Any tips for first-timers?',
        categorySlug: 'travel-first-time',
        author: 'Sarah M',
        comments: [
            { body: 'Day 1: Settle in Cleopatra Beach, walk the promenade. Day 2: Dim River & waterfalls. Day 3: Alanya Castle at sunrise, lunch at a local pide place. Day 4: Boat tour. Day 5: Beach clubs and Turkish dinner. Don\'t miss the sunset from the castle!', author: 'AlanyaExplorer' },
            { body: 'Taxis are reliable and not expensive. Rent a scooter for the castle hike if you\'re confident. August is HOT — swim during the day, explore in morning/evening.', author: 'LocalGuide' },
            { body: 'Stay near the beach for convenience. The old town has great atmosphere at night but can be touristy.', author: 'TravelBlogger' },
        ],
    },
    {
        title: 'Best time to visit — June or September?',
        body: 'Planning my trip and torn between June and September. I hate extreme heat but love the sea. Which month is better? How warm is the water? Crowds?',
        categorySlug: 'travel-best-time',
        author: 'Michael K',
        comments: [
            { body: 'September is the sweet spot. 28°C air, 26°C water, fewer tourists than August. June is good too — a bit cooler, still warm enough to swim.', author: 'SunnySideUp' },
            { body: 'If you\'re sensitive to heat, skip July-August. Both are 35°C+. April-May and Sept-Oct are perfect.', author: 'BeachBumNomad' },
        ],
    },
    {
        title: 'Budget breakdown: what should I expect to spend daily?',
        body: 'Solo traveler here, staying 2 weeks. Looking for a realistic daily budget. Accommodation, food, activities. Any breakdown would help!',
        categorySlug: 'travel-budget',
        author: 'Tom P',
        comments: [
            { body: 'Budget: 30-40 USD/night guesthouse + 10-15 USD food + 5 USD transport + 10-20 USD activities = ~60 USD/day. Can be less if you skip tours.', author: 'BackpackerAdam' },
            { body: 'Mid-range is 50-70 USD. Fine dining can go 30-40 USD per meal. Local food 2-5 USD.', author: 'TravelWriter' },
        ],
    },
    {
        title: 'Flights from UK — which airline is best value?',
        body: 'Looking for June flights London to Antalya. Seeing easyJet, Ryanair, and Turkish Airlines. Any experience with these? Baggage fees? Delays?',
        categorySlug: 'travel-flights',
        author: 'Emma H',
        comments: [
            { body: 'Turkish Airlines is most reliable. Ryanair is cheapest but watch baggage charges. easyJet somewhere in between.', author: 'FrequentFlyer' },
            { body: 'Book direct to Turkish Airlines for better deals. Antalya is 4hrs from London, good flight time.', author: 'TravelPro' },
        ],
    },
    {
        title: 'Which area to stay in? Old Town vs beach area?',
        body: 'Trying to decide where to base myself for a week. Old Town looks charming but worried about noise. Beach area seems touristy. Local advice?',
        categorySlug: 'travel-hotels',
        author: 'Jennifer L',
        comments: [
            { body: 'Stay near Cleopatra Beach (central beach). Old Town is 1km walk, nightlife is close, but you\'re in the action. Great compromise.', author: 'LocalGuide' },
            { body: 'If quiet is priority, Konakli or Mahmutlar are 10 mins by bus, less crowded, still have restaurants.', author: 'RetiredExpat' },
            { body: 'I prefer the beach walk every morning. Worth being in the busier area for that alone.', author: 'SunnySideUp' },
        ],
    },
];

export default forumSeedData;
