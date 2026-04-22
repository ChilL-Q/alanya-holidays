export interface DirectoryListing {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  website?: string;
  whatsapp?: string;
  gallery: string[];
  reviews: {
    average: number;
    count: number;
  };
  languagesSpoken?: string[];
  certifications?: string[];
  location: string;
  googleMapUrl?: string;
  priceLevel?: 1 | 2 | 3 | 4; // $, $$, $$$, $$$$
}

export interface DirectoryCategoryIntro {
  title: string;
  description: string;
  longDescription?: string[];
  faqs?: { question: string; answer: string }[];
}

export const directoryCategoryIntros: Record<string, DirectoryCategoryIntro> = {
  'medical': {
    title: 'Medical Tourism in Alanya, Turkey | Dental, Hair Transplant & Cosmetic Surgery Guide 2026',
    description: 'Planning medical tourism in Alanya, Turkey? Compare costs for dental implants, hair transplants & cosmetic surgery. Save up to 70% vs UK & Europe prices. Verified clinics, local tips.',
    longDescription: [
      'Alanya has quietly become one of Europe\'s most visited medical tourism destinations, and it\'s not hard to see why. World-class clinics, prices that are 50–70% lower than in the UK or Western Europe, and a sun-drenched Turkish Riviera holiday wrapped around your treatment. Thousands of British, German, Scandinavian, and Dutch patients make the trip every year.',
      'Alanya\'s medical tourism scene covers four main areas. Dental treatment is the most popular — Turkish clinics offer everything from routine fillings to complete smile makeovers at a fraction of European prices, and most have in-house labs so crowns, veneers, and bridges can often be completed in just a few days. Turkey is also the global leader in hair transplant tourism, with Alanya clinics offering FUE and DHI techniques — often with all-inclusive packages that cover transfers, accommodation, and aftercare. Cosmetic surgery (rhinoplasty, breast aesthetics, liposuction, eyelid surgery) is widely available from board-certified surgeons. And for those not seeking surgery, Alanya offers traditional Turkish Hamam & Spa and salt cave therapy at the famous Damlataş Cave.',
      'How long you need to stay depends on your treatment. Fillings or a single crown: 2–3 days. Veneers and multiple crowns: 5–7 days with lab time. Dental implants typically require two trips — placement, then a return 3–4 months later for the final crown. Hair transplants take 6–8 hours for the procedure itself; budget 3–4 days including consultation and recovery. Cosmetic surgery varies, but most surgeons recommend 7–10 days before flying home.',
      'The smartest patients schedule treatment in the first two days and spend the rest of the trip recovering on Cleopatra Beach, exploring Alanya Castle, taking a boat trip through the sea caves, or visiting Dim Cave and Sapadere Canyon. Recovery and a holiday are not mutually exclusive — in Alanya, they go hand in hand.',
      'Before booking any clinic, check for English-speaking staff, an in-house dental laboratory, real before/after patient photos, a written treatment plan with a full price quote, a clear aftercare protocol, and verified reviews on Google or independent platforms. All verified clinics listed on Alanya Holidays have been reviewed by our local team.'
    ],
    faqs: [
      { question: 'Is it safe to have dental treatment in Turkey?', answer: 'Yes. Reputable clinics in Alanya follow strict European hygiene standards and many hold international accreditations. Always check for verified patient reviews on Google and independent platforms, not just the clinic\'s own website.' },
      { question: 'How much can I save on dental treatment in Alanya vs the UK?', answer: 'Typical savings are 50–75%. A dental implant with crown costs €700–€1,300 in Alanya versus €2,500–€4,000 in the UK. Composite veneers are around €150 per tooth in Alanya compared to €400–€700 in the UK.' },
      { question: 'Do doctors and clinic staff speak English?', answer: 'Yes. The majority of medical tourism clinics in Alanya employ English-speaking doctors, surgeons, and patient coordinators. Many also have Russian, German, and Arabic speakers.' },
      { question: 'What is included in a typical medical package?', answer: 'Most packages include the procedure, pre-op and post-op consultations, VIP airport transfers, hotel accommodation, and sometimes a personal translator. Always confirm exactly what is and is not included before paying a deposit.' },
      { question: 'Do I need travel insurance for medical tourism in Turkey?', answer: 'Yes, and it\'s important to get a policy that specifically covers medical procedures abroad. Standard travel insurance often excludes planned medical treatment. Specialist medical travel insurers include Battleface and Cover-More.' },
      { question: 'What happens if I need aftercare once I\'m back home?', answer: 'Ask any clinic before booking: what is your aftercare protocol? Reputable clinics provide written post-treatment instructions and a direct contact for questions. Many also offer remote consultations via WhatsApp after you return.' }
    ]
  },
  'accommodations': {
    title: 'Where to Stay in Alanya 2026 | Neighbourhood Guide for Every Type of Traveller',
    description: 'Not sure where to stay in Alanya? Compare Alanya Center, Mahmutlar, Oba, and Kestel. Direct rentals, no booking fees. Villas, apartments & hotels for every budget.',
    longDescription: [
      'Where you stay in Alanya shapes your entire holiday. The city stretches along the coastline and climbs into the Taurus foothills, and each neighbourhood has a distinct character. Here is a practical breakdown to help you choose.',
      'Alanya Center and Cleopatra Beach is the heart of the action. You are walking distance from the best beach in the city, the bustling bazaar, rooftop bars, and the cable car up to Alanya Castle. It suits beach lovers, nightlife seekers, and first-time visitors who want everything within reach. Accommodation ranges from boutique hotels in the old town to modern apartments overlooking the sea.',
      'Mahmutlar, 12 km east of the center, has become the go-to district for long-term stays and expats. Apartment prices are significantly lower, there are excellent local supermarkets, and the seafront promenade is quieter than the center. It is a particularly popular choice for British, German, and Scandinavian visitors who rent for a month or more. The trade-off is that you will need a car or regular dolmuş (shared taxi) trips to reach the main attractions.',
      'Oba sits on the hills just inland from the center. It is favoured by families and those wanting a quieter base with easy access to the city. Modern apartment complexes with pools are common here, and it is one of the best areas for furnished long-term rentals at fair prices.',
      'Kestel, between Alanya and Mahmutlar, offers a genuine neighbourhood feel with local restaurants, bakeries, and far fewer tourists. Furnished apartments here are excellent value — a two-bedroom flat with a pool can cost significantly less than an equivalent in the center.',
      'For those wanting total seclusion, the hillside areas of Kargicak and Tepe offer private villas with infinity pools and panoramic sea views. These are best suited to groups, families, or couples who are happy to drive and want privacy above all else.'
    ],
    faqs: [
      { question: 'Which area is best to stay in Alanya for families?', answer: 'Oba and Mahmutlar are the top choices for families — quieter than the center, good local amenities, and plenty of apartment complexes with shared pools. Avsallar and Okurcalar further west are also ideal if you are staying in an all-inclusive resort.' },
      { question: 'Where is the best area for long-term rental in Alanya?', answer: 'Mahmutlar and Kestel offer the best value for long-term furnished rentals. You can find a well-equipped one-bedroom apartment for €200–€350 per month, compared to €400–€600+ in Alanya Center.' },
      { question: 'Can I rent an apartment in Alanya directly from the owner?', answer: 'Yes. Alanya Holidays connects you directly with property owners and local managers, so there are no guest service fees or third-party markups. You deal directly and pay less.' },
      { question: 'Are all-inclusive resorts worth it in Alanya?', answer: 'Yes, especially for families. Resorts in Okurcalar and Avsallar offer unlimited food and drinks, kids\' clubs, and private beach access — making it easy to budget your holiday precisely.' },
      { question: 'Can I rent a villa for a large group?', answer: 'Absolutely. The Kargicak and Tepe areas have stunning private villas with pools, panoramic sea views, and room for 8–14 guests. These book up fast in summer, so reserve early.' }
    ]
  },
  'tours': {
    title: 'Best Tours & Experiences in Alanya 2026 | Boat Trips, Jeep Safaris & Day Excursions',
    description: 'Browse the best tours in Alanya with real prices and honest reviews. Boat trips, jeep safaris, Sapadere Canyon, Dim Cave, and more. Book directly with local operators.',
    longDescription: [
      'Alanya punches well above its weight as an excursion base. Within an hour of the city you have dramatic mountain canyons, ancient caves, hidden rivers, and some of the best coastline in the Mediterranean. Here is what is genuinely worth doing.',
      'Boat trips are the most iconic Alanya experience. A full-day tour typically departs from Alanya harbour and visits Cleopatra Beach from the sea, Phosphorus Cave (which glows blue-green), Lovers\' Cave, Pirates\' Cave, and several swimming stops. Lunch is usually included. Prices range from €15–€30 per person — cheap enough to be one of the best-value days in Turkey.',
      'A jeep safari into the Taurus Mountains is a favourite for those wanting something more adventurous. Routes typically wind through Dim River valley, local villages, and mountain passes with sweeping views over the coast. Full-day tours include lunch at a riverside restaurant and swimming at Dim River. Prices are typically €35–€50 per person.',
      'Sapadere Canyon, 35 km north of Alanya, is a stunning natural gorge with wooden walkways, hanging bridges, and a cold mountain stream. It is far less crowded than many Turkish tourist spots and genuinely beautiful. Tours from Alanya typically run half-day and cost €20–€30 including transport.',
      'Dim Cave is one of Turkey\'s most impressive caves — 360 metres of ancient stalactites and stalagmites, with a subterranean lake at the far end. It pairs well with a Dim River picnic stop. Most operators offer a combined Dim Cave + Dim River tour for €25–€40.',
      'For history, a guided tour of Alanya Castle covers the Byzantine and Seljuk fortifications, the Red Tower, the historic dockyard, and sweeping Mediterranean views. Half-day tours cost €15–€25 and are well worth it for context you would otherwise miss.'
    ],
    faqs: [
      { question: 'What is the most popular tour in Alanya?', answer: 'The full-day boat trip from Alanya harbour is the single most popular excursion. It visits Cleopatra Beach from the water, multiple sea caves, and includes several swimming stops and usually lunch. Budget €15–€30 per person.' },
      { question: 'Is a jeep safari suitable for families with children?', answer: 'Yes, jeep safaris are very family-friendly. Children enjoy the off-road sections, the village stops, and the swimming at Dim River. Most operators have minimum age guidelines of 3–5 years.' },
      { question: 'How far is Sapadere Canyon from Alanya?', answer: 'About 35 km north of Alanya center, roughly 45 minutes by car. Most tour operators offer morning departures and return by early afternoon.' },
      { question: 'Can I book tours directly without a travel agent?', answer: 'Yes. All operators listed on Alanya Holidays can be contacted directly via WhatsApp, which means no commission markup on your booking.' },
      { question: 'What is the best time of year for tours in Alanya?', answer: 'May–October is ideal for boat trips and outdoor excursions. July and August are the busiest months, so book ahead. April and November are quieter with pleasant weather and lower prices.' }
    ]
  },
  'transport': {
    title: 'Getting to Alanya from Antalya Airport: Transfers, Car Rental & Transport Guide 2026',
    description: 'Plan your journey to Alanya. Compare private transfers from Antalya Airport (AYT), Gazipaşa Airport (GZP), car rentals, shuttle buses, and local transport. Honest prices for 2026.',
    longDescription: [
      'Alanya does not have its own airport. Your two main options are Antalya Airport (AYT), 115 km west of Alanya — the primary choice with direct flights from dozens of UK, German, Scandinavian, and Dutch airports — and Gazipaşa-Alanya Airport (GZP), just 33 km east of the city. GZP is much closer but operates seasonal routes from select European cities, so check availability for your dates.',
      'From Antalya Airport (AYT), a private transfer to Alanya takes 90–120 minutes depending on traffic. This is the most convenient option, especially with luggage or a family group. A private transfer for up to 4 passengers typically costs €35–€60 one way. Shared shuttle services exist but take longer due to multiple drop-offs and cost around €15–€25 per person.',
      'From Gazipaşa Airport (GZP), a private transfer to central Alanya is around 35–40 minutes and costs €20–€35. If flights are available from your departure city, GZP is a significant time-saver compared to the Antalya route.',
      'For getting around Alanya itself, the dolmuş (shared minibus) network is cheap and covers most of the coastal strip from Okurcalar in the west to Mahmutlar in the east. A single journey costs 15–25 TL. Taxis are metered and reliable for shorter trips. Renting a car gives you full flexibility, especially if you plan to visit Sapadere Canyon, Dim Cave, or villages inland — most rental companies in Alanya do not require a credit card for payment.',
      'For the transfer from Mahmutlar specifically: if your accommodation is in Mahmutlar rather than central Alanya, confirm this with your transfer provider at booking. Most services cover Mahmutlar at no extra cost, but journey time from Antalya Airport will be closer to 2 hours.'
    ],
    faqs: [
      { question: 'How far is Antalya Airport from Alanya?', answer: 'Antalya Airport (AYT) is approximately 115 km west of Alanya. By private transfer the journey takes 90–120 minutes. By public bus it takes around 2.5–3 hours.' },
      { question: 'How far is Gazipaşa Airport from Alanya?', answer: 'Gazipaşa-Alanya Airport (GZP) is just 33 km east of Alanya city center, making it about 35–40 minutes by transfer. Check if your airline flies to GZP — it is a much more convenient option when available.' },
      { question: 'What does a private transfer from Antalya Airport to Alanya cost?', answer: 'A private transfer for up to 4 passengers costs approximately €35–€60 one way. Prices vary by operator and vehicle type. All transfer services listed on Alanya Holidays can be contacted directly via WhatsApp for a quote.' },
      { question: 'Can I rent a car in Alanya without a credit card?', answer: 'Yes — many local car rental companies in Alanya accept debit cards or cash deposits, unlike the major international chains. Browse the transport listings on Alanya Holidays to find operators with flexible payment options.' },
      { question: 'What is the cheapest way to get from Antalya Airport to Alanya?', answer: 'The Havas airport bus to Alanya Bus Terminal costs around €10–€15 per person but takes 2.5+ hours. From the terminal you can take a dolmuş or taxi to your accommodation. For families or those with luggage, a private transfer often works out better value per person.' },
      { question: 'How do I get from Alanya to Side or Antalya city?', answer: 'Regular dolmuş and bus services run along the coast in both directions. Alanya Bus Terminal has frequent departures to Antalya, Side, and other towns. Journey time to Side is around 1 hour; to Antalya city center around 2 hours.' }
    ]
  },
  'restaurants': {
    title: 'Best Restaurants & Cafés in Alanya 2026 | Local Food Guide by Neighbourhood',
    description: 'Find the best places to eat in Alanya. From rooftop restaurants by the castle to halal dining in Mahmutlar and breakfast cafés in Kestel. Updated 2026 local food guide.',
    longDescription: [
      'Eating well in Alanya is easy — the harder part is knowing where to look beyond the tourist strip. Here is a neighbourhood-by-neighbourhood breakdown of where the good food actually is.',
      'Alanya Old Town and Castle District: The hillside restaurants around the castle walls are where you find the most atmospheric dining in the city. Rooftop terraces with views over the Red Tower and out to sea are common, and the menus lean toward Turkish classics — mezze, fresh fish, grilled lamb, and baklava. Prices are a step higher than elsewhere, but the setting justifies it for a special evening.',
      'Cleopatra Beach area: The beachfront strip is thick with restaurants competing for foot traffic, which means prices are fair and menus are broad. Look slightly away from the immediate seafront for better quality-to-price ratios. This area has the widest choice of international cuisine — Italian, Chinese, Indian — alongside Turkish options.',
      'Mahmutlar: The neighbourhood food scene here is built for residents, not tourists, which means smaller prices and more authentic cooking. The local bazaar streets have excellent gözleme (stuffed flatbread) stalls and traditional börek bakeries open from early morning. Several halal-certified restaurants serve the area\'s diverse expat community.',
      'Kestel: A genuinely local neighbourhood with family-run lokanta (canteen-style) restaurants serving daily-changing home-cooked menus at fixed low prices. If you want to eat like a local resident rather than a tourist, Kestel is worth the short trip.',
      'For breakfast specifically: Turkish breakfast culture is exceptional. Many cafés in Mahmutlar and Oba serve the full Van-style spread — cheeses, olives, eggs, tomatoes, cucumbers, honey, clotted cream, and fresh bread — for €8–€15 per person. This is one of the best-value meals you can have in Turkey.'
    ],
    faqs: [
      { question: 'What is the best area for restaurants in Alanya?', answer: 'For atmosphere: the Old Town and castle district. For variety: Cleopatra Beach area. For value and authentic Turkish food: Mahmutlar and Kestel. For halal dining options: Mahmutlar has the widest choice.' },
      { question: 'Are there halal restaurants in Alanya?', answer: 'Yes. As a predominantly Muslim country, most Turkish restaurants in Alanya serve halal meat by default. Mahmutlar in particular has a strong selection of halal-certified restaurants serving the large expat and migrant community.' },
      { question: 'How much does a meal cost in Alanya?', answer: 'A main course at a mid-range restaurant costs €8–€18. A full mezze spread with drinks at a castle-view restaurant runs €25–€45 per person. A lunchtime lokanta set menu in Kestel or Mahmutlar can be as little as €4–€6.' },
      { question: 'What Turkish foods should I try in Alanya?', answer: 'Start with Adana kebab, fresh grilled sea bass or sea bream, lahmacun (thin meat flatbread), mercimek çorbası (lentil soup), and gözleme. For dessert: baklava, künefe (warm cheese pastry with syrup), and sütlaç (rice pudding).' },
      { question: 'Are there good breakfast cafés in Alanya?', answer: 'Yes — Turkish breakfast is a highlight of any visit. Look for cafés advertising "serpme kahvaltı" (spread breakfast) in Mahmutlar and Oba. Expect a full spread of cheeses, eggs, olives, honey, and fresh bread for around €8–€15 per person.' }
    ]
  },
  'cafes': {
    title: 'Best Cafés & Coffee Shops in Alanya 2026 | Local Guide',
    description: 'Find the best cafés and coffee shops in Alanya. From specialty coffee in the Old Town to beachside breakfast spots and neighbourhood patisseries. Updated 2026 local guide.',
    longDescription: [
      'Alanya\'s café scene has grown considerably over the last few years, moving well beyond the tourist strip into neighbourhood spots that rival anything you\'d find in Istanbul. Whether you\'re after a slow Turkish breakfast, specialty espresso, or a quiet spot to work, the city has more to offer than most visitors realise.',
      'Old Town & Castle District: The streets around the castle and the historic bazaar area have a cluster of atmospheric small cafés serving Turkish tea, Turkish coffee, and light breakfasts. Many have rooftop or terrace seating with views over the Red Tower and harbour. These are the best spots for a leisurely morning before the heat sets in.',
      'Cleopatra Beach Area: The main beach strip has plenty of cafés aimed at tourists, but step back one or two streets and you\'ll find more characterful options. Specialty coffee has arrived here — a handful of independent cafés now serve proper espresso-based drinks using quality Turkish and Ethiopian beans.',
      'Mahmutlar: The neighbourhood\'s café culture is built around the local community — mostly expats and long-term residents. You\'ll find excellent Turkish breakfast cafés (serpme kahvaltı) for €8–€12 per person, alongside small pastry shops and tea gardens. The pace is slower and the prices significantly lower than the tourist areas.',
      'Oba & Kestel: These residential neighbourhoods have become home to a newer wave of Turkish specialty coffee shops catering to young locals and expat families. If you\'re staying in either area, it\'s worth exploring the side streets for hidden gems that don\'t appear in travel guides.'
    ],
    faqs: [
      { question: 'Where can I get good specialty coffee in Alanya?', answer: 'Specialty coffee options are concentrated around the Old Town, Cleopatra Beach area, and increasingly in Oba and Mahmutlar. Look for cafés advertising "filter coffee" or "V60" — these are reliably good indicators of quality.' },
      { question: 'What is a traditional Turkish breakfast like?', answer: 'A full Turkish breakfast (serpme kahvaltı) includes an assortment of cheeses, olives, tomatoes, cucumbers, eggs cooked to order, honey, clotted cream (kaymak), jams, and fresh bread. Many cafés in Mahmutlar and Oba serve this spread for €8–€15 per person. It\'s one of the best-value meals in Alanya.' },
      { question: 'Do cafés in Alanya have Wi-Fi?', answer: 'Most cafés in tourist and expat areas offer free Wi-Fi. Quality varies — the more established specialty coffee spots tend to have better connections. It\'s worth asking before settling in for a work session.' },
      { question: 'What is Turkish tea (çay) culture like?', answer: 'Tea is the national drink and is served in small tulip-shaped glasses. It\'s brewed strong and drunk without milk, sometimes with a sugar cube. Tea is often complimentary or very cheap (€0.50–€1) and is a social ritual as much as a drink. Refusing tea is mildly impolite — accepting and sipping slowly is the local norm.' },
      { question: 'Are there vegan or dairy-free café options in Alanya?', answer: 'Options are improving. Several cafés in the tourist areas now offer oat milk and almond milk alternatives. The specialty coffee shops are the safest bet. Traditional Turkish cafés may not always have alternatives, so it\'s worth checking beforehand.' }
    ]
  },
  'real-estate': {
    title: 'Buy Property in Alanya, Turkey | Foreigner & Expat Guide to Real Estate 2026',
    description: 'Complete guide to buying property in Alanya as a foreigner. Neighbourhood breakdowns for Oba, Kestel, Mahmutlar and more. Trusted local agents, legal process explained.',
    longDescription: [
      'Alanya has become one of the most active real estate markets in Turkey, driven by a steady influx of European, Russian, and Middle Eastern buyers. Foreign nationals can own freehold property in Turkey with full title deed (TAPU) rights, and the purchase process — while bureaucratic — is well-established and navigable with the right agent.',
      'The price differential with Western Europe remains significant. A modern one-bedroom apartment in Mahmutlar with a communal pool can be purchased from €45,000–€80,000. Two-bedroom apartments in Oba start around €70,000–€120,000. Larger villas with private pools in Kargicak and Tepe range from €200,000 to over €1,000,000 depending on size and view. Prices have risen sharply since 2021, but Alanya still represents strong value compared to comparable coastal properties in Spain or Greece.',
      'Neighbourhood matters more than most buyers initially realise. Mahmutlar has the most affordable prices and the largest expat community, but is a 15-minute drive from Alanya center. Oba is popular with families for its quieter streets and good schools. Kestel offers local neighbourhood character and genuine value. Alanya Center and Cleopatra Beach carry a premium but give you the most walkable lifestyle. For total seclusion and panoramic sea views, Kargicak and Tepe are the prestige options.',
      'The legal process for foreign buyers involves: selecting a property and signing a preliminary sales agreement with a deposit (typically 10%); obtaining a Turkish tax number (takes an hour at the tax office); opening a Turkish bank account; transferring funds; and completing the title deed transfer at the Land Registry Office (Tapu Müdürlüğü). The full process typically takes 4–8 weeks. You are not required to be physically present for all steps — a notarised power of attorney allows a local agent or lawyer to act on your behalf.',
      'Property investment above $400,000 USD (or equivalent in TRY) qualifies you for Turkish Citizenship by Investment. The threshold was raised in 2022, but for buyers at this level, citizenship within 3–6 months of purchase is a genuine pathway. Below that threshold, property ownership above approximately $75,000 USD qualifies for a renewable residence permit (ikamet).'
    ],
    faqs: [
      { question: 'Can foreigners buy property in Alanya, Turkey?', answer: 'Yes. Citizens of most countries can buy freehold property in Turkey with full title deed rights. The main exceptions are citizens of countries with which Turkey has reciprocity restrictions — check current regulations with a local agent or lawyer.' },
      { question: 'How much does an apartment in Alanya cost?', answer: 'Entry-level one-bedroom apartments in Mahmutlar start around €45,000–€80,000. Two-bedroom apartments in Oba range from €70,000–€120,000. Sea-view villas with private pools start around €200,000 and go significantly higher.' },
      { question: 'Which neighbourhood in Alanya is best for buying property?', answer: 'Depends on your priorities. Mahmutlar for value and expat community. Oba for families and quiet living. Kestel for genuine local character. Alanya Center for walkability and lifestyle. Kargicak/Tepe for prestige sea views and privacy.' },
      { question: 'Does buying property in Turkey give you residency?', answer: 'Yes. Property above approximately $75,000 USD qualifies for a renewable Turkish residence permit (ikamet). Property above $400,000 USD qualifies for Turkish Citizenship by Investment. Rules can change — always confirm with a legal advisor.' },
      { question: 'How long does the property purchase process take in Turkey?', answer: 'Typically 4–8 weeks from signed preliminary agreement to title deed transfer, assuming funds are in place. A notarised power of attorney allows the process to be completed without you being physically present in Turkey for every step.' },
      { question: 'Do I need a Turkish lawyer to buy property in Alanya?', answer: 'It is not legally required but is strongly recommended, especially for your first purchase. A local lawyer checks title deeds for encumbrances, debts, or planning issues, and costs €500–€1,500 for a standard transaction.' }
    ]
  },
  'visa': {
    title: 'Turkey Visa & Residency Permit Guide for Alanya | Ikamet, Digital Nomad & Investment 2026',
    description: 'Clear, practical guide to getting a Turkish residence permit (ikamet) in Alanya. Tourist visa extensions, property investment residency, digital nomad options. Updated 2026.',
    longDescription: [
      'Navigating Turkish residency bureaucracy is one of the most common pain points for expats and long-stay visitors in Alanya. This guide covers the main pathways, what the process actually involves, and where to get trustworthy help locally.',
      'Tourist visa: Most European, UK, and North American citizens can enter Turkey visa-free for 90 days within any 180-day period. This is usually sufficient for a summer holiday. If you overstay, the fine is paid at the airport on departure and is typically manageable (a few hundred euros), but overstaying is not a recommended strategy if you plan to return regularly.',
      'Short-Term Residence Permit (Kısa Dönem İkamet İzni): This is the standard option for those wanting to stay longer than 90 days. It requires proof of sufficient financial means, health insurance valid in Turkey, and a Turkish address. Applications are submitted online through the E-İkamet system and then completed in person at the local Göç İdaresi (Immigration Office) in Alanya. The initial permit is typically issued for 1–2 years and is renewable. Property ownership above approximately $75,000 USD is one of the qualifying grounds.',
      'Tourism or rental income-based residency: If you are renting accommodation rather than owning, you still qualify for the short-term permit as long as you have a signed rental contract, health insurance, and proof of funds. Many long-term renters in Mahmutlar and Kestel use this route.',
      'Turkish Citizenship by Investment: Property purchase above $400,000 USD (or equivalent) qualifies for a citizenship application. The process takes 3–6 months and grants full Turkish citizenship with a passport. It is a significant financial commitment but increasingly popular with British, German, and Ukrainian buyers who value visa-free access to 110+ countries on the Turkish passport.',
      'Digital Nomad Visa: Turkey launched a digital nomad visa in 2023, allowing remote workers to live legally in Turkey for up to one year. It requires proof of remote employment or freelance income, health insurance, and accommodation. Applications are submitted at Turkish consulates before arrival.'
    ],
    faqs: [
      { question: 'How long can I stay in Turkey without a visa?', answer: 'Most European, UK, and North American citizens can stay 90 days visa-free within any 180-day period. After 90 days, you need a residence permit or to leave and re-enter (though visa runs are not officially condoned).' },
      { question: 'How do I get a residence permit (ikamet) in Alanya?', answer: 'Apply online through the E-İkamet system, book an appointment at Alanya\'s Immigration Office (Göç İdaresi), and attend with your passport, rental contract or title deed, health insurance, proof of funds, and biometric photos. The process typically takes 4–8 weeks for the card to arrive.' },
      { question: 'What does Turkish health insurance cost for a residence permit?', answer: 'Private health insurance for the residence permit typically costs €300–€600 per year for a healthy adult under 65. Several Turkish insurers offer specific ikamet insurance products. Costs rise significantly for those over 65.' },
      { question: 'Can I work in Turkey on a tourist residence permit?', answer: 'No. A short-term residence permit does not grant the right to work in Turkey. If you intend to work for a Turkish employer, you need a separate work permit. Remote workers employed by foreign companies exist in a legal grey area — the digital nomad visa is the correct route.' },
      { question: 'What is Turkish Citizenship by Investment and how does it work?', answer: 'Purchasing property worth at least $400,000 USD (single property or multiple) qualifies you to apply for Turkish citizenship. The property must be held for at least 3 years. Processing takes roughly 3–6 months and grants full citizenship with passport rights.' },
      { question: 'Where is the immigration office in Alanya?', answer: 'The Alanya Göç İdaresi (Immigration Directorate) is located in central Alanya. All verified visa and residency advisors listed on Alanya Holidays can accompany you to appointments and handle paperwork on your behalf.' }
    ]
  },
  'shopping': {
    title: 'Shopping in Alanya 2026 | Bazaars, Souvenirs & What to Buy Guide',
    description: 'What to buy in Alanya and where to buy it. From the Grand Bazaar and local markets to leather goods, Turkish textiles, spices, and authentic souvenirs. Honest local guide.',
    longDescription: [
      'Alanya is a genuinely good place to shop, especially if you know what to look for and where the tourist-trap items end and the real quality begins. Here is a practical guide to spending your money well.',
      'The Alanya Grand Bazaar (Çarşı) in the city center is the main traditional market and the starting point for most visitors. Stalls sell everything from leather jackets and handmade carpets to spices, dried fruits, Turkish delight (lokum), ceramic plates, and Evil Eye (Nazar) jewellery. Bargaining is expected and prices are generally negotiable — a reasonable starting point is 60–70% of the first asking price.',
      'For textiles specifically, Turkey is one of the world\'s major producers of cotton and silk, and the quality available in Alanya\'s fabric shops is far higher than most visitors expect. Look for hand-embroidered tablecloths, hammam towels (peştemal), and cotton bedspreads. These are genuinely useful, lightweight to pack, and significantly cheaper than equivalent quality at home.',
      'Turkish leather goods — bags, belts, jackets — are another strong category. Quality varies enormously, so it is worth comparing several shops rather than buying from the first stall. The leather market street near the bazaar concentrates the specialist shops.',
      'For authentic local food products to take home: Alanya is known for its banana cultivation (the only commercial banana growing area in Turkey), local honey, and olive oil. The bazaar and local supermarkets stock good-quality spice mixes, pomegranate molasses, and dried herbs that are a fraction of the price of Turkish specialty shops back in Europe.',
      'For gifts with a longer shelf life than Turkish delight: hand-painted ceramic bowls from local artisan shops, backgammon sets, and small copper or brass items make genuinely useful souvenirs rather than tourist dust-catchers.'
    ],
    faqs: [
      { question: 'What are the best souvenirs to buy in Alanya?', answer: 'Top picks: hammam towels (peştemal) — lightweight and high quality; local spice mixes and pomegranate molasses; hand-painted ceramics; Evil Eye (Nazar) jewellery in silver; leather goods from the bazaar market street; and locally produced honey and olive oil.' },
      { question: 'Can you bargain in Alanya markets?', answer: 'Yes, in the Grand Bazaar and with street vendors, bargaining is expected. In regular shops with price tags, prices are fixed. A polite offer of 60–70% of the asking price is a reasonable starting point for bazaar stalls.' },
      { question: 'Where is the Grand Bazaar in Alanya?', answer: 'The main bazaar (Çarşı) is in central Alanya, near Damlataş Street and within walking distance of Cleopatra Beach. It is open daily from morning until late evening, with the most activity in the afternoons.' },
      { question: 'Is Turkish leather good quality?', answer: 'Quality varies. There are genuine high-quality leather workshops in Alanya, but also a lot of low-quality imports. Stick to specialist leather shops rather than bazaar stalls for anything important. Ask to see the leather close up and check stitching carefully before buying.' },
      { question: 'Are there shopping malls in Alanya?', answer: 'Yes. Alanya has several modern shopping centres including Alanyum and Keyifçe AVM, with international clothing chains, electronics shops, and supermarkets. These are useful for everyday shopping needs and a cool air-conditioned escape on hot days.' }
    ]
  },
  'nature': {
    title: 'Natural Attractions in Alanya 2026 | Caves, Canyons, Beaches & Hiking Guide',
    description: 'Discover Alanya\'s best natural attractions: Sapadere Canyon, Dim Cave, Cleopatra Beach, Green Canyon boat tours, and Dim River. How to visit, costs, and practical tips.',
    longDescription: [
      'Alanya sits at the point where the Taurus Mountains meet the Mediterranean, which means the natural landscape is genuinely dramatic rather than just pretty. Within an hour of the city you have some of the best caves, canyons, and coastline in Turkey.',
      'Cleopatra Beach (İsmetpaşa Beach) is the most famous beach in Alanya and one of the finest sandy beaches on the Turkish Riviera. Legend holds that Mark Antony had sand brought from Egypt as a gift to Cleopatra, though historians are sceptical. What is not in doubt: the 2.5 km of fine golden sand, clear turquoise water, and backdrop of the Alanya Castle on its promontory make this one of the most photographed beaches in Turkey. It is a Blue Flag beach, public, and free to access (though sun lounger hire costs €5–€10).',
      'Sapadere Canyon, 35 km north of Alanya, is a narrow limestone gorge with a mountain stream running through it, wooden walkways built along the canyon walls, and several small waterfalls. It is genuinely impressive and far less crowded than most Turkish tourist sites. Entry costs around 150 TL and includes access to a small café at the canyon exit. Best visited in the morning before tour groups arrive.',
      'Dim Cave (Dim Mağarası) is one of the largest and most dramatic caves in Turkey — 360 metres long with a subterranean lake at the far end. The stalactite and stalagmite formations are genuinely spectacular, and the cave is lit to highlight the best formations. Entry costs around 200–300 TL. The adjacent Dim River is a perfect picnic spot, with clear cool water and natural swimming pools popular with local families.',
      'The Green Canyon is technically a reservoir in the Taurus Mountains formed by the Oymapınar Dam, but the emerald-green water set against dramatic limestone cliffs makes for a spectacular boat trip. Typical tours from Alanya include a full day on a boat, swimming stops, and lunch. The canyon itself is about 90 minutes from Alanya, making this a full-day commitment.',
      'Damlataş Cave, right next to Cleopatra Beach, is Alanya\'s most accessible cave — a 5-minute walk from the town center. It is smaller than Dim Cave but historically significant: the humid, mineral-rich air inside is traditionally recommended for respiratory conditions, and local people with asthma have visited early each morning for generations.'
    ],
    faqs: [
      { question: 'How do I visit Sapadere Canyon from Alanya?', answer: 'You can join an organised tour from Alanya (€20–€30 including transport) or drive yourself — the canyon is about 35 km north of Alanya on a well-signposted road. The drive takes around 45 minutes. Entry fee is approximately 150 TL. Arrive early to avoid tour groups.' },
      { question: 'How far is Dim Cave from Alanya?', answer: 'Dim Cave is approximately 12 km east of Alanya city center, about 20 minutes by car. Taxis are affordable and most transfer services can arrange a drop-off. Entry costs around 200–300 TL. Combine with a stop at Dim River for a half-day excursion.' },
      { question: 'Is Cleopatra Beach free to access?', answer: 'Yes, Cleopatra Beach is a public beach and free to visit. Sun lounger and umbrella hire from beach operators typically costs €5–€10 per person per day. The beach has public toilets, showers, and plenty of cafés.' },
      { question: 'What is the Green Canyon tour and is it worth it?', answer: 'The Green Canyon is a stunning emerald reservoir in the Taurus Mountains, reached by a full-day boat trip from Alanya. It costs €30–€50 per person including lunch. If you enjoy boat trips and dramatic mountain scenery, it is well worth the investment.' },
      { question: 'Are there good hiking routes near Alanya?', answer: 'Yes. The Lycian Way section near Alanya, the Taurus Mountain trails above Mahmutlar, and the ridge walk to the back of Alanya Castle all offer excellent hiking. The best months for hiking are April–June and September–October when temperatures are manageable.' }
    ]
  },
  'spa-hamam': {
    title: 'Best Spa & Turkish Hamam in Alanya 2026 | Authentic Baths, Massage & Wellness',
    description: 'Find the best Turkish hamam and spa in Alanya. Traditional baths, deep tissue massage, and wellness treatments. What to expect, prices, and how to book.',
    longDescription: [
      'A traditional Turkish hamam (hammam) is one of the most genuinely distinctive experiences you can have in Alanya — not a tourist gimmick, but a centuries-old bathing ritual that is still part of everyday Turkish life. Here is what to expect and where to find the best.',
      'A classic hamam experience involves three phases: first, you sweat in a hot marble room (the hararet) to open your pores; then a tellak (bath attendant) gives you a vigorous kese scrub with a coarse mitten to remove dead skin; finally, a soap massage using a foamy lather. The full ritual takes 45–90 minutes and leaves your skin noticeably softer. A basic session costs €15–€30; a full package with massage typically runs €40–€70.',
      'There is a meaningful difference between traditional neighbourhood hamams (built for locals, cheaper, less English spoken) and tourist-oriented hamams (more polished, English-speaking staff, higher prices, slightly less authentic atmosphere). Both have their merits — the tourist hamams are better for first-timers who want clear communication and a relaxed pace; the neighbourhood hammams offer a more genuine cultural experience.',
      'Beyond the hamam, Alanya has a well-developed spa sector, particularly concentrated around the larger hotels and in Alanya Center. Services range from Thai and Swedish massage to deep tissue, hot stone, and couples\' treatments. Standalone spa centres typically offer better value than hotel spas.',
      'Damlataş Cave, adjacent to Cleopatra Beach, is worth special mention as a wellness destination. The cave\'s naturally humid, mineral-rich atmosphere — consistent at 22°C and 95% humidity year-round — has been used therapeutically for respiratory conditions for decades. The cave opens early each morning specifically for people with asthma and chronic respiratory conditions.'
    ],
    faqs: [
      { question: 'What happens in a Turkish hamam?', answer: 'You enter a hot marble steam room to sweat and open your pores, then a bath attendant (tellak) scrubs your skin with a coarse kese mitten to remove dead skin, followed by a soap and foam massage. The full experience takes 45–90 minutes. Towels and slippers are provided; swimwear is worn throughout.' },
      { question: 'How much does a Turkish hamam cost in Alanya?', answer: 'A basic hamam session (steam + scrub) costs €15–€30. A full package including soap massage runs €40–€70. Add-on treatments like oil massage, face mask, or hair wash are typically €10–€20 extra each.' },
      { question: 'Is a Turkish hamam suitable for everyone?', answer: 'Most people enjoy it, but it is not recommended if you have certain cardiovascular conditions, very sensitive skin, or severe sunburn. Pregnant women should consult a doctor first. The heat is intense — if you feel dizzy, leave the hot room immediately and cool down.' },
      { question: 'What is the difference between a hamam and a spa?', answer: 'A hamam is a traditional bathing ritual with specific cultural roots — the scrub and soap massage are the defining elements. A spa is a broader wellness facility offering a range of treatments including massage, facials, and body wraps in a more modern setting. Many Alanya venues offer both.' },
      { question: 'Should I tip at a hamam?', answer: 'Yes, tipping is customary. 15–20% of the service price is appreciated and goes directly to the attendant. In tourist hamams this is sometimes included automatically — check your bill.' }
    ]
  },
  'hair-beauty': {
    title: 'Hair Salons & Beauty in Alanya 2026 | Hairdressers, Nail Bars & Cosmetic Treatments',
    description: 'Find the best hair salons, nail bars, and beauty centres in Alanya. Local English-friendly salons for cuts, colour, extensions, lashes, and cosmetic treatments.',
    longDescription: [
      'Alanya has a well-developed hair and beauty sector shaped by its large European expat community and year-round tourist trade. Prices are significantly lower than in the UK or Western Europe, and the quality at established salons is consistently high.',
      'For haircuts and colour, a women\'s cut and blow-dry at a reputable Alanya salon costs €15–€30. Full colour with highlights typically runs €40–€80 depending on hair length and technique — roughly half what you would pay at a comparable salon in the UK or Germany. Many salons in Alanya use European professional brands (L\'Oréal, Wella, Schwarzkopf) and staff are accustomed to working with European clients.',
      'Nail services are similarly well-priced. Gel manicure: €15–€25. Full set acrylics: €25–€40. Pedicure with gel polish: €20–€35. The nail salon market is competitive in Alanya and standards at established places are high.',
      'Eyelash extensions have become one of the most popular beauty treatments among both expats and visitors. Classic lash sets cost €30–€50; Russian volume lashes €50–€80. Many salons offer maintenance appointments at reduced rates for clients who had their original set done there.',
      'For more significant cosmetic treatments — semi-permanent makeup (microblading, lip blush), laser hair removal, and skin treatments — Alanya has a growing number of specialist clinics with trained practitioners. These are less regulated than in the EU, so do your research, ask about the practitioner\'s qualifications, and read reviews carefully before booking.'
    ],
    faqs: [
      { question: 'How much does a haircut cost in Alanya?', answer: 'A women\'s cut and blow-dry at a reputable salon costs €15–€30. Men\'s cuts are €8–€15. Full colour with highlights typically runs €40–€80 depending on hair length. Prices are roughly 40–60% lower than equivalent salons in the UK or Germany.' },
      { question: 'Do hair salons in Alanya speak English?', answer: 'Many do, especially in tourist areas and in salons that cater to the expat community. Salons listed on Alanya Holidays are tagged with the languages spoken by their staff.' },
      { question: 'Is it safe to have eyelash extensions in Turkey?', answer: 'Yes, at established and reputable salons. Check that the salon uses professional-grade adhesive, that the technician has proper training, and read recent reviews. Avoid the cheapest options — lash adhesive quality matters for eye health.' },
      { question: 'Where are the best hair salons in Alanya?', answer: 'Good salons are found throughout Alanya Center, Mahmutlar, and Oba. The Saray neighbourhood of central Alanya has a concentration of well-regarded salons serving both locals and expats. Browse the listings on Alanya Holidays for verified salons with direct WhatsApp booking.' },
      { question: 'Can I book a hair or beauty appointment via WhatsApp?', answer: 'Yes — WhatsApp booking is standard practice in Alanya for hair and beauty services. All salons listed on Alanya Holidays show their WhatsApp number for direct contact.' }
    ]
  }
};

export const MOCK_DIRECTORY_DATA: DirectoryListing[] = [
  // NATURAL ATTRACTIONS
  {
    id: 'nat-1',
    categoryId: 'nature',
    name: 'Cleopatra Beach',
    shortDescription: 'The most famous sandy beach in Alanya, legend says it was a gift from Mark Antony to Cleopatra.',
    isFeatured: true,
    isVerified: true,
    gallery: [
      'https://images.unsplash.com/photo-1542384955-4a6015b3c583?auto=format&fit=crop&q=80&w=800',
    ],
    reviews: { average: 4.9, count: 5000 },
    location: 'Alanya Center',
  },
  {
    id: 'nat-2',
    categoryId: 'nature',
    name: 'Dim Cave',
    shortDescription: 'Spectacular 360-meter long cave filled with ancient stalactites and stalagmites, located high above the Dim River.',
    isFeatured: true,
    isVerified: true,
    website: 'https://www.kulturportali.gov.tr/turkiye/antalya/gezilecek-yer/dim-magarasi',
    gallery: [
      'https://images.unsplash.com/photo-1519045761895-cdbed8ec1db2?auto=format&fit=crop&q=80&w=800',
    ],
    reviews: { average: 4.6, count: 850 },
    location: 'Dimcayi',
  },

  // --- SPREADSHEET DATA IMPORTS ---

  // ACCOMMODATIONS
  {
    id: 'acc-1',
    categoryId: 'accommodations',
    name: 'Alanya Holidays',
    shortDescription: 'Premium vacation rentals and comprehensive directory services.',
    isFeatured: true,
    isVerified: true,
    website: 'www.alanyaholidays.com',
    whatsapp: '1 438 929 4208',
    gallery: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 5.0, count: 120 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'acc-2',
    categoryId: 'accommodations',
    name: 'Ozgur Bey Spa Hotel',
    shortDescription: 'Relaxing spa hotel offering comfortable stays and excellent service.',
    website: 'https://www.ozgurbeyspahotel.com/en',
    whatsapp: '90 242 514 0104',
    gallery: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.5, count: 230 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'acc-3',
    categoryId: 'accommodations',
    name: 'Villa Sonata Hotel',
    shortDescription: 'Charming boutique hotel nestled in the heart of Alanya.',
    website: 'https://www.villasonata.com/',
    whatsapp: '90 242 513 0991',
    gallery: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.7, count: 156 },
    location: 'Alanya, Turkiye',
  },

  // TRANSPORT (Spreadsheet Table1_2)
  {
    id: 'trans-3',
    categoryId: 'transport',
    name: '724 Alanya Airport Transfer',
    shortDescription: 'Reliable 24/7 airport transfer services to and from Alanya.',
    website: 'https://724alanyaairporttransfer.com/',
    whatsapp: '90 541 207 5707',
    gallery: ['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 320 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'trans-4',
    categoryId: 'transport',
    name: 'Alanya Transfer',
    shortDescription: 'Professional transfer services focused on punctuality and comfort.',
    website: 'https://alanyatransfer.com/',
    whatsapp: '90 532 557 2135',
    gallery: ['https://images.unsplash.com/photo-1549317661-bc32c125df80?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.6, count: 210 },
    location: 'Alanya, Turkiye',
  },

  // TOURS (Spreadsheet Table1_3)
  {
    id: 'tour-1',
    categoryId: 'tours',
    name: 'Fresh Tourism Tour Alanya',
    shortDescription: 'Exciting local tours and memorable excursions.',
    website: 'https://www.touralanya.com/en',
    whatsapp: '90 555 330 9442',
    gallery: ['https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.9, count: 412 },
    location: 'Alanya, Turkiye',
  },
  {
    id: 'tour-2',
    categoryId: 'tours',
    name: 'Daily Tours in Alanya',
    shortDescription: 'Discover the beauty of the region with daily guided tours.',
    website: 'https://www.dailytoursinalanya.com/',
    whatsapp: '90 553 103 2336',
    gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 180 },
    location: 'Alanya, Turkiye',
  },

  // MEDICAL (Spreadsheet Table1_4)
  {
    id: 'med-4',
    categoryId: 'medical',
    name: 'Tour Medical',
    shortDescription: 'Comprehensive dental and medical treatments for international patients.',
    website: 'https://www.tourmedical.com/',
    whatsapp: '90 537 305 7377',
    gallery: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 154 },
    location: 'Kusadasi, Aydin, Turkiye',
  },
  {
    id: 'med-5',
    categoryId: 'medical',
    name: 'Medical Tourism Turkey',
    shortDescription: 'Leading health tourism provider delivering exceptional surgical care.',
    website: 'https://mtturkey.com/',
    whatsapp: '90 530 070 3914',
    gallery: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.7, count: 322 },
    location: 'Konyaalti, Antalya, Turkiye',
  },

  // SPA & HAMAM (Spreadsheet Table1_5)
  {
    id: 'spa-1',
    categoryId: 'spa-hamam',
    name: 'Kleopatra',
    shortDescription: 'Authentic Turkish Hamam and relaxing massage therapies.',
    website: 'https://www.kleopatra.com.tr/',
    whatsapp: '90 532 541 98 00',
    gallery: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.9, count: 504 },
    location: 'Saray, Alanya',
  },
  {
    id: 'spa-2',
    categoryId: 'spa-hamam',
    name: 'Crystal Spa Center',
    shortDescription: 'Luxurious spa retreat offering deep tissue massages and skin care.',
    website: 'https://crystalspacenter.com/',
    whatsapp: '90 544 880 28 56',
    gallery: ['https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.6, count: 211 },
    location: 'Guller Pinari, Alanya',
  },

  // HAIR & BEAUTY (Spreadsheet Table1_6)
  {
    id: 'beauty-1',
    categoryId: 'hair-beauty',
    name: 'Nuri Ezveci Hair Salon',
    shortDescription: 'Premium hairdressing, coloring, and styling services.',
    website: 'https://www.instagram.com/nuriezvecihairsalon',
    whatsapp: '90 530 300 8080',
    gallery: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 88 },
    location: 'Saray, Alanya',
  },
  {
    id: 'beauty-2',
    categoryId: 'hair-beauty',
    name: 'Hairstory Professional Alanya - Bayan Kuaforu',
    shortDescription: 'Expert women\'s hair salon specializing in modern trends.',
    website: 'https://www.instagram.com/hairstory_professional_alany',
    whatsapp: '90 506 934 3923',
    gallery: ['https://images.unsplash.com/photo-1595476108010-b4d1f10c1448?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.7, count: 142 },
    location: 'Saray, Alanya',
  },

  // RESTAURANTS & CAFES (Spreadsheet Table1_7)
  {
    id: 'rest-1',
    categoryId: 'restaurants',
    name: 'Nabucco',
    shortDescription: 'Fine dining experience featuring Turkish and Mediterranean cuisine.',
    website: 'https://www.buyukhotel.com/nabucco',
    whatsapp: '90 242 513 1138',
    gallery: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 620 },
    location: 'Alanya, Turkiye',
    priceLevel: 3
  },
  {
    id: 'rest-2',
    categoryId: 'restaurants',
    name: 'Cozy Alanya',
    shortDescription: 'Relaxed cafe atmosphere with great coffee and quick bites.',
    website: 'https://www.facebook.com/cozyalanya/',
    whatsapp: '90 552 540 1278',
    gallery: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.5, count: 180 },
    location: 'Alanya, Turkiye',
    priceLevel: 2
  },

  // SHOPPING (Spreadsheet Table1_8)
  {
    id: 'shop-1',
    categoryId: 'shopping',
    name: 'Alanya Grand Bazaar',
    shortDescription: 'The ultimate destination for authentic Turkish souvenirs, textiles, and spices.',
    gallery: ['https://images.unsplash.com/photo-1590483256050-0bbcbfe96515?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.6, count: 1400 },
    location: 'Alanya Center',
  },

  // ATTRACTIONS (Spreadsheet Table1_9)
  {
    id: 'nat-3', // Added under nature/attractions
    categoryId: 'nature',
    name: 'Alanya Castle',
    shortDescription: 'Historical fortress offering panoramic views of the Mediterranean Sea and Cleopatra Beach.',
    gallery: ['https://images.unsplash.com/photo-1610014526955-40899ab4da4d?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.9, count: 12500 },
    location: 'Alanya',
  },
  {
    id: 'nat-4',
    categoryId: 'nature',
    name: 'Sapadere Canyon',
    shortDescription: 'A stunning natural gorge with walking paths, wooden bridges, and refreshing waterfalls.',
    gallery: ['https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=800'],
    reviews: { average: 4.8, count: 3200 },
    location: 'Sapadere, Alanya',
  }
];
