export interface GuideSection {
  heading: string;
  body: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface GuideContent {
  heroImage: string;
  sections: GuideSection[];
  relatedLinks: { label: string; href: string; icon: string }[];
  checklist?: ChecklistItem[];
  checklistTitle?: string;
}

export const guideContents: Record<string, GuideContent> = {
  "Alanya First-Timer's Guide": {
    heroImage:
      "/images/placeholder-business.svg",
    sections: [
      {
        heading: "Getting to Alanya",
        body: `Alanya sits roughly 130 km east of Antalya Airport (AYT), which is your main international gateway. From the airport, you have three solid options: a private transfer (about 90 minutes, €50-70), the Havaş shuttle bus (runs every 2 hours, €12 per person, drops you at the main bus terminal), or renting a car if you plan to explore beyond the city. If you are already in Turkey, intercity buses connect Alanya to all major cities — the otogar is about 3 km west of the center, and a quick dolmuş ride gets you into town for pocket change.

[callout variant="tip" title="Airport Transfer Pro Tip" content="Pre-book a private transfer from Antalya Airport (AYT) during summer high season to skip the taxi queues, or take the official Havaş shuttle bus for budget travel."]`,
      },
      {
        heading: "Where to Stay",
        body: `Alanya stretches along a 30 km coastline, and choosing the right neighborhood makes all the difference. Cleopatra Beach is the prime tourist zone — beachfront hotels, lively promenades, walking distance to everything. If you want something more residential and local, look at Oba — it has wider streets, better-value apartments, and a chilled-out cafe culture.

[venue id="biz-002" layout="card"]

[figure src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" caption="Golden sands of Cleopatra Beach and the Mediterranean coastline" credit="Sarah Jenkins / Unsplash" alt="Cleopatra Beach Alanya"]

The harbor area around the Red Tower is atmospheric for a short stay but can get noisy. For long-term stays, Mahmutlar and Kestel offer the best apartment deals and a more settled expat scene. Budget €30-80/night for a solid hotel, or €300-500/month for a long-term rental apartment depending on the season.

[cta category="hotels-accommodation" label="Browse All Top-Rated Alanya Hotels" subtext="Find beachfront resorts, boutique stays, and hillside villas with sea views"]`,
      },
      {
        heading: "Getting Around",
        body: `The dolmuş minibus system is the backbone of local transport — they run constantly along the main coastal road (D400) and cost about 15-20 TL per ride. Just flag one down, tell the driver your stop, and pay in cash. Taxis are plentiful but agree on the fare or make sure the meter is running before you set off. For day trips to Side, Aspendos, or the Taurus Mountains, renting a scooter (€15-25/day) or car (€30-45/day) gives you total freedom. The city center and harbor area are entirely walkable — you will not need wheels just to explore the old town.

[callout variant="info" title="Dolmuş Minibus Fares" content="Keep 15-20 Turkish Lira cash handy for the coastal dolmuş minibuses. Drivers don't take foreign credit cards."]`,
      },
      {
        heading: "Must-See First-Day Itinerary",
        body: `Start at the harbor around 9 AM and climb up to Alanya Castle — the views alone are worth the 250-step ascent, and the entrance fee is modest. Walk the battlements, peek into Süleymaniye Mosque, then descend through the old neighborhood of Tophane with its Ottoman-era houses.

[pullquote quote="Standing atop Alanya Castle at sunset, the entire Turquoise Coast unfolds beneath you in breathtaking amber and gold." author="Evliya Çelebi" role="Ottoman Travel Chronicler"]

[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="4K Aerial Drone Tour of Alanya Castle and Cleopatra Beach" provider="youtube"]

[venue id="biz-001" layout="card"]

Grab lunch at a harbor-side fish restaurant (the grilled sea bass is reliably excellent), then spend the afternoon floating at Cleopatra Beach — the sand is genuinely fine and the water is absurdly turquoise. End the day with sunset drinks or a relaxing boat tour around the promontory.

[venue id="biz-003" layout="compact"]`,
      },
      {
        heading: "Practical Tips",
        body: `The local currency is Turkish Lira (TL), and while many tourist-facing businesses accept euros, you get a better rate paying in lira. ATMs are everywhere but avoid Euronet machines — their fees are brutal. Get an eSIM or local SIM (Turkcell, Vodafone, Turk Telekom) at the airport or any phone shop; data is cheap. Summers are hot — expect 30-35°C July through September — so plan outdoor activities for mornings and evenings. Spring (April-May) and autumn (September-October) are the sweet spots: warm enough to swim, cool enough to explore comfortably. Most locals in the tourist areas speak at least basic English, but learning 'merhaba' (hello), 'teşekkür ederim' (thank you), and 'ne kadar?' (how much?) will earn you genuine smiles everywhere you go.

[callout variant="warning" title="Currency & ATM Notice" content="Always decline dynamic currency conversion (DCC) at standalone ATMs and choose billing in Turkish Lira (TL) to avoid exorbitant conversion fees."]`,
      },
    ],
    relatedLinks: [
      { label: "Explore Businesses & Restaurants", href: "/explore", icon: "ri-store-2-line" },
      { label: "Browse Local Events", href: "/events", icon: "ri-calendar-event-line" },
    ],
    checklistTitle: "Pre-Trip Checklist",
    checklist: [
      { id: "ft-book-flights", text: "Book flights to Antalya Airport (AYT)" },
      { id: "ft-airport-transfer", text: "Arrange airport transfer — private car, Havas shuttle, or rental" },
      { id: "ft-accommodation", text: "Reserve accommodation in your preferred neighborhood" },
      { id: "ft-travel-insurance", text: "Get travel insurance that covers medical and trip cancellation" },
      { id: "ft-lira-cash", text: "Exchange some Turkish Lira — enough for your first day or two" },
      { id: "ft-esim", text: "Order an eSIM or plan to grab a local SIM at the airport" },
      { id: "ft-sun-protection", text: "Pack high-SPF sunscreen, wide hat, and UV-protective sunglasses" },
      { id: "ft-walking-shoes", text: "Bring comfortable walking shoes for the castle climb and cobblestone streets" },
      { id: "ft-turkish-phrases", text: "Learn 5 basic Turkish phrases — merhaba, teşekkür ederim, ne kadar, lütfen, evet/hayır" },
      { id: "ft-first-day-route", text: "Save the first-day itinerary from this guide to your phone" },
      { id: "ft-download-maps", text: "Download offline Google Maps of Alanya region" },
      { id: "ft-adaptor-plug", text: "Pack a Type C/F power adaptor if coming from outside Europe" },
      { id: "ft-medications", text: "Pack any prescription medications with enough supply for your entire trip" },
      { id: "ft-restaurant-list", text: "Save 3-4 restaurant recommendations from the Food Guide to a notes app" },
    ],
  },
  "The Ultimate Food Lover's Alanya": {
    heroImage:
      "/images/placeholder-business.svg",
    sections: [
      {
        heading: "Turkish Breakfast: The Non-Negotiable Start",
        body: `A proper Turkish kahvaltı is not just a meal — it is a ritual that can stretch for two hours. Find a spot with a view (Mezze Garden in the old town is legendary) and settle in. Your table will arrive groaning under small plates: beyaz peynir (white cheese), kaşar (aged yellow cheese), black and green olives, honey with kaymak (clotted cream), tomato-cucumber salad, acuka (spicy walnut-pepper paste), sucuklu yumurta (fried eggs with spiced beef sausage), and menemen (scrambled eggs with peppers and tomatoes, runny and peppery).

[figure src="https://images.unsplash.com/photo-1525351484163-7529414344d8" caption="Traditional Turkish kahvaltı spread with menemen, cheeses, olives, and fresh simit" credit="Gourmet Travel Mag" alt="Turkish Breakfast Kahvalti"]

[venue id="biz-001" layout="compact"]

[pullquote quote="A Turkish breakfast isn't merely food; it is a two-hour celebration of Mediterranean freshness and hospitality." author="Chef Mehmet Gürs" role="Gastronomy Pioneer"]

Endless tulip glasses of çay keep coming. Budget about 150-250 TL per person for a proper spread. Go hungry.`,
      },
      {
        heading: "Street Food You Cannot Miss",
        body: `Alanya's street food scene is criminally underrated. At the harbor, look for midye dolma vendors — stuffed mussels with spiced rice, a squeeze of lemon, eaten standing up from the tray, counted by the shell (about 10 TL each, five makes a snack). Gözleme is the ultimate go-to: thin hand-rolled dough filled with spinach and feta or minced meat, cooked on a convex sac griddle by village women near the bazaar. Kokoreç — grilled lamb intestines wrapped around sweetbreads, chopped fine with tomatoes, peppers, and oregano, served in a quarter loaf of bread — sounds intimidating but tastes like the best spiced lamb sandwich you have ever had. Trust me on this one.

[callout variant="insider" title="Secret Midye Spot" content="Head to the old fishing harbor after 8 PM for freshly steamed midye dolma with a generous squeeze of fresh lemon."]`,
      },
      {
        heading: "Where the Locals Actually Eat",
        body: `Skip the flashy harbor-front restaurants with their multilingual menus and hawkers out front. Walk inland three blocks and find Sultan'ın Yeri — an unmarked charcoal ocakbaşı where you point at raw skewers and they grill them over open coals. Order the Adana kebab (spiced minced lamb, slightly charred), a plate of ezme (spicy tomato-walnut dip), and a balloon of fresh lavaş bread. Head to Damlataş Sokak after 8 PM and follow the smell of grilled meat — the small ocakbaşı joints here serve some of the best İskender kebab (thin-sliced döner on pide bread, drenched in tomato sauce and browned butter) you will find outside Bursa. For seafood, the family-run spots in the fishing harbor — not the tourist harbor — grill the morning catch and charge half the price of the waterfront places.

[callout variant="tip" title="Ocakbaşı Etiquette" content="Point directly at raw lamb skewers in the display cooler and ask the usta for his daily specialty recommendation."]`,
      },
      {
        heading: "Fine Dining with a View",
        body: `When you want to dress up, Kale Panorama Restaurant inside the castle walls delivers — lamb tandır slow-cooked for eight hours, a terrace that hangs over the cliff, and the entire bay glittering below you. Reservations essential, especially at sunset.

[venue id="biz-001" layout="card"]

[video src="https://www.youtube.com/watch?v=kJQP7kiw5Fk" caption="Fine Dining Experience & Mediterranean Flavors in Historic Alanya" provider="youtube"]

Rooftop 42 near the Red Tower does Mediterranean fusion with a killer cocktail program; their grilled octopus with smoked paprika and their pomegranate-glazed duck breast are standouts. For modern Anatolian cuisine, Saray's tasting menu takes you through seven courses of reimagined regional classics. Budget €25-45 per person at the high end — still astonishing value compared to equivalent experiences in Western Europe.

[cta category="restaurants-cafes" label="Explore All 40+ Alanya Dining Spots" subtext="Curated selection of seafood terraces, sunset rooftops, and authentic meze taverns"]`,
      },
      {
        heading: "Sweets, Markets, and Food Souvenirs",
        body: `Alanya's Friday bazaar (Cuma Pazarı) is the move for food souvenirs. Mountains of Turkish delight in rose, pomegranate, and pistachio — buy from the stalls that let you taste first. Dried figs stuffed with walnuts, candied chestnuts, and jars of local pine honey from the Taurus foothills. For baklava, Güllüoğlu near the main boulevard has been doing it since 1871 — pistachio baklava so layered and buttery it shatters when you bite into it. Grab a kilo box to take home. The spice stalls sell saffron from Safranbolu, sumac, isot pepper (smoky Urfa chili), and za'atar blends — all vacuum-sealed for travel.

[callout variant="info" title="Friday Bazaar Bargaining" content="Taste before you buy at the spice and Turkish delight stalls — sellers are proud to offer free samples."]`,
      },
    ],
    relatedLinks: [
      { label: "Explore Restaurants & Cafes", href: "/explore", icon: "ri-store-2-line" },
      { label: "Browse Food Events", href: "/events", icon: "ri-calendar-event-line" },
    ],
  },
  "Best Day Trips from Alanya": {
    heroImage:
      "/images/placeholder-business.svg",
    sections: [
      {
        heading: "Side: Ancient Ruins Meet the Sea",
        body: `Side sits about 65 km west of Alanya, roughly an hour by car or dolmuş. This ancient Greek city turned Roman port is absurdly photogenic — the Temple of Apollo stands right at the water's edge, its columns silhouetted against the Mediterranean. Walk through the monumental gate into the old city, explore the 15,000-seat amphitheater (entrance €10), then cool off with a swim at the small beach directly below the temple — you are literally swimming in front of 2nd-century ruins. The old town streets are packed with jewelry shops and carpet sellers, but push past them to find the quieter lanes with garden cafes serving fresh pomegranate juice.

[figure src="https://images.unsplash.com/photo-1548013146-72479768bada" caption="Temple of Apollo standing sentinel over the turquoise Mediterranean in Side" credit="Mediterranean Heritage" alt="Temple of Apollo Side"]

[pullquote quote="Nowhere else in the classical world can you swim in crystal waters directly beneath second-century Roman temple columns." author="Prof. David Turner" role="Classical Archaeologist"]`,
      },
      {
        heading: "Manavgat Waterfall & River Cruise",
        body: `Just 5 km inland from Side, Manavgat Waterfall is less about height and more about width and power — a thundering wall of white water spanning 40 meters across, misting everything in a permanent cool spray. The landscaped gardens around it are perfect for a picnic. From Manavgat town, hop on a river cruise that takes you downstream to the delta where the river meets the sea — the water shifts from freshwater green to Mediterranean blue at the sandbar, and you can swim in both. Budget about €15 for the boat trip, and go in the morning before the tour buses arrive.

[callout variant="tip" title="Morning Boat Cruise" content="Book the 10:00 AM riverboat departure from Manavgat delta to enjoy the cooler morning breeze and quiet sandbar swimming."]`,
      },
      {
        heading: "Dimçay River Valley: Cool Mountain Escape",
        body: `On a scorching July afternoon when Alanya is baking at 38°C, the Dimçay Valley is 10 degrees cooler and feels like a different planet. The river cascades down from the Taurus Mountains through a tree-shaded gorge lined with floating restaurants — wooden platforms built directly over the rushing water.

[venue id="biz-005" layout="card"]

[video src="https://www.youtube.com/watch?v=9bZkp7q19f0" caption="Cool Mountain Waters & Floating Restaurants of Dim River Valley" provider="youtube"]

[callout variant="insider" title="Dim Cave Microclimate" content="Dim Cave maintains a constant 18°C temperature year-round with 90% humidity — therapeutic for breathing and a great escape from summer heat."]

Order grilled trout (caught from the river that morning) and a cold ayran. Higher up, Dim Cave (Dim Mağarası) is the second-longest cave in Turkey, with a 360-meter walkable path through stalactite galleries. Combined, this is a perfect half-day escape from the coastal heat.`,
      },
      {
        heading: "Aspendos: The Best-Preserved Roman Theater",
        body: `About 50 km east of Antalya (roughly 2 hours from Alanya), Aspendos is arguably the finest surviving Roman theater in the world. Built in 155 AD under Marcus Aurelius, it seated 15,000 and is still used today — the annual Aspendos Opera and Ballet Festival runs June through July, and hearing an aria resonate through 2,000-year-old acoustics is a bucket-list experience. The rest of the site includes an aqueduct, a basilica, and a nymphaeum. Go early or late to avoid midday crowds and the punishing sun. Pair it with a lunch stop in the nearby village of Belkıs for gözleme made by the same family for three generations.

[callout variant="info" title="Aspendos Opera Festival" content="If visiting in June or July, book tickets in advance for the world-famous Aspendos Opera and Ballet Festival."]`,
      },
      {
        heading: "Sapadere Canyon: Hidden Gem",
        body: `About 40 km east of Alanya, Sapadere Canyon is a 750-meter wooden walkway suspended above a rushing turquoise river, pinned to sheer rock walls that narrow to just a few meters apart. At the end, a waterfall crashes into a natural pool where you can swim — the water is freezing even in August, and it is glorious.

[venue id="biz-007" layout="compact"]

The canyon is managed (small entrance fee, well-maintained paths) so it feels accessible rather than dangerous. There is a cafe at the entrance run by the village cooperative.

[cta category="tours-activities" label="Discover Guided Tours & Day Excursions" subtext="Book verified boat trips, canyon safaris, and mountain adventures"]`,
      },
    ],
    relatedLinks: [
      { label: "Browse Adventure Events", href: "/events", icon: "ri-calendar-event-line" },
      { label: "Explore Outdoor Activities", href: "/explore", icon: "ri-store-2-line" },
    ],
  },
  "Moving to Alanya: Expat Guide": {
    heroImage:
      "/images/placeholder-business.svg",
    sections: [
      {
        heading: "Visas and Residence Permits",
        body: `Most nationalities can enter Turkey with an e-visa (www.evisa.gov.tr) — it takes 10 minutes online and costs around $50-60 for a 90-day multiple-entry tourist visa. If you plan to stay longer, you will need a short-term residence permit (ikamet). Start the application online through the Göç İdaresi website, then book an appointment at the Alanya immigration office. You will need: passport copies, four biometric photos, proof of address (notarized rental contract), proof of sufficient funds (bank statements showing roughly $500/month), and private health insurance valid in Turkey. The process takes 2-6 weeks, and the first permit is typically issued for one year. Renewals are easier if you stay at the same address and keep your paperwork current. Budget about €200-300 in total fees.

[callout variant="warning" title="Ikamet Permit Document Deadline" content="Ensure all foreign apostilled documents and notarized rental contracts are prepared before attending your Göç İdaresi appointment."]

[pullquote quote="Moving to Alanya was the best lifestyle decision we ever made. The climate, safety, and welcoming locals make settling in seamless." author="Elena Rostova" role="Digital Nomad & Resident"]`,
      },
      {
        heading: "Finding an Apartment",
        body: `Rental prices in Alanya vary dramatically by season and location. Mahmutlar and Kestel are the expat hubs — modern apartment complexes with pools, gyms, and sea views in the €300-500/month range for a furnished 1+1 (one bedroom + living room). Oba offers better value and is closer to the center. Cleopatra and Damlataş are pricier (€500-800) but put you in the heart of everything.

[figure src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750" caption="Modern residential apartment complexes with sea views in Oba and Mahmutlar" credit="Alanya Real Estate Journal" alt="Alanya Expat Apartments"]

[cta category="real-estate" label="Browse Real Estate & Long-Term Rentals" subtext="Connect with trusted local property advisors, beachfront apartments, and villa sales"]

Most landlords want 3-6 months upfront for short-term, or a full year contract. Always get a notarized rental contract — it is required for your residence permit and utility connections. Sahibinden.com is the main listing site, but the best deals come through local estate agents (emlakçı) who do not list online. Walk neighborhoods you like and look for kiralık signs.`,
      },
      {
        heading: "Healthcare and Insurance",
        body: `Turkey has a two-tier system: public hospitals (devlet hastanesi) and private hospitals. Public care is affordable but expect long waits and limited English. Private hospitals in Alanya (Başkent University Hospital, ALKÜ Training Hospital) offer excellent care with English-speaking staff at a fraction of Western prices — a doctor consultation runs €30-50, an MRI around €150. Private health insurance is mandatory for residence permits; SGK (the state system) becomes available after one year of legal residence and costs about €100/month. Pharmacies (eczane) are everywhere and pharmacists can prescribe for minor ailments — no doctor visit needed for things like antibiotics, pain relief, or basic skin conditions.

[callout variant="info" title="Private Hospital English Desks" content="Both Başkent and ALKÜ hospitals maintain dedicated international patient coordination departments with English and German speaking liaisons."]`,
      },
      {
        heading: "Building a Social Life",
        body: `Alanya has a thriving expat community — Facebook groups like 'Alanya Expats' and 'Foreigners in Alanya' are the main hubs for meetups, buy-and-sell, and practical advice. The Friday bazaar is a weekly social ritual where everyone eventually runs into everyone. Language exchanges happen at several cafes — try Cafe Corner in Oba on Wednesday evenings. For structured activities, there are yoga studios, hiking groups that hit the Taurus trails on weekends, and a surprisingly active salsa dancing scene at the beachfront plaza. The key insight: Alanya rewards people who put themselves out there. Attend one group hike or language exchange, and you will have coffee invitations by the end of the week.

[callout variant="insider" title="Expat Hiking Groups" content="Join the weekly Taurus Mountain trail hikes organized through community forums for breathtaking summit views and easy networking."]`,
      },
      {
        heading: "Practical Settling-In Tips",
        body: `Get a Turkish bank account — Ziraat, İş Bankası, and Garanti all serve foreigners with your residence permit and tax number (alınan from the local vergi dairesi). Set up utilities: electricity (AEDAŞ), water (ASAT), and internet (Turk Telekom or Superonline) all need your rental contract and residence permit. Internet is fast and cheap — fiber connections at 100 Mbps run about €15/month. For mobile, get a Turkcell or Vodafone postpaid plan once you have residence — about €10-15/month for generous data. Register your foreign phone's IMEI within 120 days of entry or it will be blocked; the registration fee is roughly €200. Learn basic Turkish — even 50 words transforms your daily experience from transactional to genuinely welcoming. Locals in Alanya are patient and warm with foreigners who make the effort.

[video src="https://vimeo.com/76979871" caption="Expat Living & Community Guide to the Turkish Riviera" provider="vimeo"]`,
      },
    ],
    relatedLinks: [
      { label: "Connect with the Community", href: "/community-hub", icon: "ri-group-line" },
      { label: "Explore Neighborhood Businesses", href: "/explore", icon: "ri-store-2-line" },
    ],
    checklistTitle: "Moving Checklist",
    checklist: [
      { id: "ex-evisa", text: "Apply for e-visa at evisa.gov.tr — costs ~$50, takes 10 minutes" },
      { id: "ex-documents", text: "Gather passport copies, four biometric photos, and proof of funds" },
      { id: "ex-temp-housing", text: "Book temporary accommodation for your first 2 weeks while apartment hunting" },
      { id: "ex-health-insurance", text: "Arrange private health insurance valid in Turkey (mandatory for residence permit)" },
      { id: "ex-bank-statements", text: "Prepare bank statements showing ~$500/month for the residence permit application" },
      { id: "ex-ikamet-appointment", text: "Start ikamet application online and book appointment at Alanya immigration office" },
      { id: "ex-rental-contract", text: "Find apartment, sign notarized rental contract — essential for permit and utilities" },
      { id: "ex-tax-number", text: "Get a Turkish tax number from the local vergi dairesi" },
      { id: "ex-bank-account", text: "Open a Turkish bank account at Ziraat, İş Bankası, or Garanti" },
      { id: "ex-imei", text: "Register foreign phone IMEI within 120 days of entry (~€200 fee)" },
      { id: "ex-utilities", text: "Set up utilities — electricity (AEDAŞ), water (ASAT), and fiber internet" },
      { id: "ex-sim-card", text: "Get a Turkcell or Vodafone postpaid SIM plan (~€10-15/month)" },
      { id: "ex-facebook-groups", text: "Join Alanya Expats and Foreigners in Alanya Facebook groups" },
      { id: "ex-turkish-language", text: "Learn at least 50 Turkish words — transforms daily interactions completely" },
      { id: "ex-social", text: "Attend one language exchange or group hike — you will have coffee invites by week's end" },
    ],
  },
  "Alanya Beach Guide": {
    heroImage:
      "/images/placeholder-business.svg",
    sections: [
      {
        heading: "Cleopatra Beach: The Main Event",
        body: `Legend has it Cleopatra herself swam here, and honestly, she had taste. This 2 km stretch of impossibly fine golden sand is the crown jewel — shallow turquoise water that stays warm through October, a palm-lined promenade with cafes and bars, and the iconic Alanya Castle towering on the rocky headland to the east.

[figure src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" caption="Turquoise waters and pristine golden sand of Cleopatra Beach below Alanya Castle" credit="Sarah Jenkins / Unsplash" alt="Cleopatra Beach"]

[venue id="biz-008" layout="compact"]

[pullquote quote="According to legend, Mark Antony brought sand directly from Egypt so Queen Cleopatra could bathe in royal comfort." author="Historical Legends of Pamphylia"]

The western end (near Damlataş Cave) is busier and better for families; the eastern end is slightly quieter. Sun loungers and umbrellas rent for about 100 TL per day.

[cta category="tours-activities" label="Book Water Sports & Boat Tours" subtext="Parasailing over Cleopatra Beach, scuba diving, and private boat charters"]`,
      },
      {
        heading: "Keykubat Beach: The Local Favorite",
        body: `East of the harbor, Keykubat Beach stretches 3 km along the D400 and is where Alanyans themselves go. Less manicured than Cleopatra, fewer tourists, wider stretches of sand. The water here has a slightly pebbly entry in sections — bring water shoes if you are particular. The real draw is the beach clubs: laid-back places with wooden decks, bean bags, and a younger, more local crowd. Most do not charge entry if you order food and drinks. Sunset sessions here with a cold Efes and grilled köfte are peak Alanya living. Parking is easier and free along the side streets.

[callout variant="tip" title="Sunset at Keykubat" content="Keykubat beach clubs offer relaxed wooden deck loungers with no entrance fees when ordering food or drinks."]`,
      },
      {
        heading: "Portakal Beach: Family Paradise",
        body: `Portakal (Orange) Beach in Oba is the family pick — wide, flat sand, playgrounds in the adjacent park, and shallower water than Cleopatra. It is about 1.5 km long and significantly less crowded than the central beaches. The promenade behind it has bike rental stations and ice cream kiosks. Several beachfront cafes serve gözleme and fresh-squeezed orange juice (the namesake). There is a dedicated swimming area marked with buoys, and on weekends you will see whole Turkish families camped out with elaborate picnic setups — thermoses of çay, melons, and multi-tier lunch boxes. Join them. They will probably offer you food.

[callout variant="info" title="Family-Friendly Amenities" content="Portakal Beach features shallow water entry, playground parks, and adjacent bike rental stations."]`,
      },
      {
        heading: "The Secret Coves",
        body: `Between Alanya and Gazipaşa, the coastal road hugs the cliffs and hides a series of tiny, unnamed coves accessible only by footpaths or boat. The best-known is İncekum Plajı near Avsallar, but the real gems have no signs. Drive the D400 east, look for dirt tracks leading seaward, and follow your nose. Pirate Cove (Korsan Koyu) is reachable only by boat or a steep 20-minute hike down — bring everything you need, including water and shade, because there are zero facilities. The reward: crystal water, total silence except for cicadas and waves, and the distinct feeling you have found something special. These coves are best visited in June or September when the heat is manageable and you might have them entirely to yourself.

[video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Discovering Secret Coves and Pirate Bay along the Alanya Coast" provider="youtube"]

[callout variant="insider" title="Pirate Cove Access" content="Wear sturdy shoes for the 20-minute coastal hike down to Pirate Cove and bring your own drinking water."]`,
      },
      {
        heading: "Beach Season and Practical Tips",
        body: `Peak beach season runs June through September, with water temperatures hitting 27-28°C in August. May and October are the shoulder months — the water is still swimmable (22-24°C) but the beaches are deliciously empty. November through April is too cold for swimming, but beach walks are lovely. Sun protection is no joke: the Mediterranean sun at midday in July will burn unprotected skin in 20 minutes. Reef-safe sunscreen, a wide hat, and UV-protective rash guards for kids are essential. Most beaches have flagged safety systems — red flag means no swimming, yellow means caution, and always respect these. The rip currents off the eastern coves can be sneaky. For the best beach day of your life: go to Cleopatra at 8 AM, swim for an hour in perfect solitude, then retreat for Turkish breakfast as the crowds arrive. You are welcome.

[callout variant="warning" title="Flag Safety Warnings" content="Always obey red safety flags at Cleopatra Beach — afternoon swell currents can be hazardous."]`,
      },
    ],
    relatedLinks: [
      { label: "Explore Beach Clubs & Water Sports", href: "/explore", icon: "ri-store-2-line" },
      { label: "Browse Waterfront Events", href: "/events", icon: "ri-calendar-event-line" },
    ],
    checklistTitle: "Beach Day Packing List",
    checklist: [
      { id: "be-sunscreen", text: "Reef-safe sunscreen SPF 50+ — reapply every 2 hours in peak sun" },
      { id: "be-hat-glasses", text: "Wide-brimmed hat and UV-protective sunglasses" },
      { id: "be-water-shoes", text: "Water shoes for pebbly entries at Keykubat Beach and rocky coves" },
      { id: "be-lira-cash", text: "Turkish Lira cash — sun loungers and umbrellas cost ~100 TL/day" },
      { id: "be-water-bottle", text: "Reusable insulated water bottle — freeze it overnight for ice-cold water all day" },
      { id: "be-towel", text: "Quick-dry beach towel or lightweight Turkish peshtemal" },
      { id: "be-rash-guard", text: "Swimwear, cover-up, and UV rash guard for kids" },
      { id: "be-phone-pouch", text: "Waterproof phone pouch for swimming photos and sand protection" },
      { id: "be-power-bank", text: "Portable power bank — beach clubs don't always have outlets" },
      { id: "be-snacks", text: "Light snacks — simit, seasonal fruit, and nuts from a local market" },
      { id: "be-first-aid", text: "Small first-aid kit with antiseptic and waterproof plasters" },
      { id: "be-dry-bag", text: "Dry bag for secret cove hikes — protect electronics and dry clothes" },
      { id: "be-beach-tent", text: "Beach tent or UV umbrella if heading to facility-free coves" },
      { id: "be-flag-check", text: "Check beach flag color before leaving — red means no swimming, no exceptions" },
    ],
  },
  "Alanya Nightlife: Where to Go": {
    heroImage:
      "/images/placeholder-business.svg",
    sections: [
      {
        heading: "Rooftop Bars: The Golden Hour Circuit",
        body: `Alanya's rooftop scene is genuinely world-class, and sunset is the starting gun. Rooftop 42 near the Red Tower is the anchor — seven floors up, a wrap-around terrace with 270° views of the harbor and castle, and a cocktail menu that takes itself seriously (their lychee martini and smoked mezcal negroni are standouts). Arrive by 6 PM for a front-row sunset seat.

[venue id="biz-001" layout="compact"]

[pullquote quote="Watching the Red Tower illuminate against the indigo twilight from a harbor rooftop is Alanya at its most enchanting." author="Marc Dubois" role="Nightlife Critic"]

[figure src="https://images.unsplash.com/photo-1514933651103-005eec06c04b" caption="Sunset cocktails overlooking illuminated Alanya harbor and fortress walls" credit="Nightlife Alanya" alt="Alanya Rooftop Cocktail Bar"]

Luna Garden sits above the eastern harbor with a more intimate, plant-filled terrace and live acoustic sets on Friday nights. For the best value, head to Panorama Bar on Atatürk Boulevard — less fancy, more local, but the castle-and-harbor view at sunset with a 100 TL glass of Turkish wine is the best deal in town. Do all three in one night for the full golden hour tour.

[cta category="nightlife" label="Explore Alanya Nightlife & Harbor Bars" subtext="Top-rated sunset cocktail lounges, beach clubs, and live music venues"]`,
      },
      {
        heading: "Beach Clubs: Day-to-Night Energy",
        body: `Alanya's beach clubs transition seamlessly from sun loungers by day to DJ sets by night. Summer Garden Beach Club on Cleopatra Beach is the most polished — white curtains, daybeds, international DJs on weekends, and a well-heeled crowd. Entry is free before 5 PM, after which a minimum spend applies (around €20). Havana Beach Club on Keykubat is the younger, louder sibling — foam parties on Saturdays, resident DJs spinning Afro-house and melodic techno, and a crowd that stays until 2 AM. Most beach clubs wrap around 2-3 AM. Dress code is casual-chic: no flip-flops at night, but no need for heels either. For a more alternative vibe, Sidewalk Beach runs a bohemian setup with bean bags, fire pits, and acoustic sets — think less bottle service, more bonfire energy.

[callout variant="tip" title="Free Entry Before Sunset" content="Arrive at top beach clubs before 5 PM to secure prime daybeds without minimum spend surcharges."]`,
      },
      {
        heading: "Live Music and Turkish Meyhane Nights",
        body: `A Turkish meyhane night is the cultural heart of Alanya after dark — long tables, small plates of meze, endless rakı, and live fasıl music (traditional Turkish art music with oud, kanun, and darbuka). Kervansaray in the harbor is a converted 13th-century Seljuk caravanserai with stone arches and candlelit tables — the live music starts at 9 PM and the atmosphere is transporting. For more contemporary live music, Rock N' Roll Cafe in Damlataş hosts local bands playing everything from Turkish rock to 90s covers. Blues Brothers Bar on the main boulevard does exactly what the name promises — great blues guitar and a dive-bar soul. Most live music venues charge no cover; they make their money on drinks.

[video src="https://www.youtube.com/watch?v=kJQP7kiw5Fk" caption="Atmospheric Live Fasıl Music and Meyhane Evenings in Historical Alanya" provider="youtube"]

[callout variant="insider" title="Kervansaray Live Fasıl" content="Reserve a table inside the 13th-century stone courtyard on Friday or Saturday evening for authentic Seljuk ambiance."]`,
      },
      {
        heading: "Clubs and Late-Night Spots",
        body: `If you want to dance until dawn, Alanya delivers. Club Inferno near Cleopatra Beach is the biggest — multi-level, laser shows, international headline DJs in summer, and capacity for 2,000. Dress sharp and arrive after midnight; things peak around 2 AM. Club Havana (connected to the beach club) runs a more underground electronic programme in its basement room. For a smaller, sweatier, and more local experience, the clubs along Damlataş Sokak play Turkish pop and arabesque and stay open until the last person leaves — usually around 5 AM. Cover charges at the big clubs run €10-20, often including one drink. Bottle service tables start at €100. Most clubs close November through March; the scene is seasonal.

[callout variant="info" title="Late Night Peak Hours" content="Clubs near Damlataş and Cleopatra Beach peak between 1:30 AM and 4:00 AM."]`,
      },
      {
        heading: "Chilled Evenings: Low-Key Alternatives",
        body: `Not every night needs to be a headline. Alanya's harbor at dusk is magic — grab a simit from a street vendor, sit on the seawall, and watch the fishing boats head out with their lanterns. The tea gardens (çay bahçesi) around Damlataş Cave stay open late, serving unlimited çay at 10 TL per glass under fairy lights and walnut trees — no alcohol, just conversation, backgammon, and the sound of waves. Nargile (water pipe) cafes near the Red Tower offer flavored shisha and a distinctly old-world atmosphere. The open-air cinema on Cleopatra Beach runs Turkish and international films with English subtitles on summer weekends — bring a blanket and a bottle of wine (no one will mind). These quiet nights are often the ones you remember most vividly.

[callout variant="tip" title="Harbor Tea Gardens" content="Traditional tea gardens beneath the ancient castle walls serve endless çay until 2 AM in a tranquil open-air setting."]`,
      },
    ],
    relatedLinks: [
      { label: "Browse Nightlife Events", href: "/events", icon: "ri-calendar-event-line" },
      { label: "Explore Bars & Nightclubs", href: "/explore", icon: "ri-store-2-line" },
    ],
  },
};