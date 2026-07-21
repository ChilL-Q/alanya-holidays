// ── Types ────────────────────────────────────────────────────────────

export type NationalityMarket = 'UK' | 'DE' | 'NL' | 'NO' | 'SE';

export type LanguageCode = 'en' | 'de' | 'nl';

export interface FlightRoute {
  fromCity: string;
  airline: string;
  toAirport: string;
  duration: string;
  frequency: string;
}

export interface TravelTip {
  icon: 'visa' | 'booking' | 'currency' | 'weather' | 'transport' | 'culture';
  title: string;
  content: string;
}

export interface NationalityPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  market: NationalityMarket;
  language: LanguageCode;
  hreflangCode?: string; // BCP 47 tag for hreflang + html lang; omit for non-representative pages
  heroSubtitle: string;
  longDescription: string[];
  flightRoutes: FlightRoute[];
  flightSectionIntro: string;
  whyAlanyaHighlights: string[];
  travelTips: TravelTip[];
  faqs: { question: string; answer: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────

export const MARKET_FLAGS: Record<NationalityMarket, string> = {
  UK: '\u{1F1EC}\u{1F1E7}',
  DE: '\u{1F1E9}\u{1F1EA}',
  NL: '\u{1F1F3}\u{1F1F1}',
  NO: '\u{1F1F3}\u{1F1F4}',
  SE: '\u{1F1F8}\u{1F1EA}',
};

export const MARKET_LABELS: Record<NationalityMarket, string> = {
  UK: 'United Kingdom',
  DE: 'Deutschland',
  NL: 'Nederland',
  NO: 'Norge',
  SE: 'Sverige',
};

// Representative pages for each locale (used for hreflang alternates)
export const HREFLANG_REPRESENTATIVES: Record<string, string> = {
  'en-GB': 'alanya-holidays-from-uk',
  de: 'alanya-urlaub',
  nl: 'alanya-vakantie',
  'en-NO': 'alanya-holidays-from-norway',
  'en-SE': 'alanya-holidays-from-sweden',
};

// ── Data ─────────────────────────────────────────────────────────────

export const NATIONALITY_PAGES: NationalityPage[] = [
  // ── UK Pages ──────────────────────────────────────────────────────
  {
    slug: 'alanya-holidays-from-uk',
    title: 'Alanya Holidays from the UK',
    metaTitle: 'Alanya Holidays from the UK — Flights, Hotels & Tips 2026',
    metaDescription: 'Plan your Alanya holiday from the UK. Direct flights from London, Manchester & more. Best hotels, excursions, airport transfers, and travel tips for British travellers.',
    keywords: [
      'alanya holidays from uk',
      'alanya turkey holiday',
      'alanya from britain',
      'turkish riviera uk holidays',
      'alanya vacation uk',
    ],
    market: 'UK',
    language: 'en',
    hreflangCode: 'en-GB',
    heroSubtitle: 'Sun-drenched beaches, ancient history, and incredible value — Alanya is the Turkish Riviera gem that British travellers keep coming back to.',
    longDescription: [
      'Alanya has become one of the most popular holiday destinations for British travellers seeking guaranteed sunshine, stunning beaches, and rich history at a fraction of Mediterranean resort prices. With direct flights from major UK airports and a welcoming atmosphere, it is no surprise that Alanya consistently ranks among the top Turkish Riviera destinations for UK visitors.',
      'The town offers something for every type of British holidaymaker. Whether you are after a lazy beach holiday on Cleopatra Beach, an action-packed adventure with jeep safaris and boat tours, or a cultural deep-dive into the Ottoman and Seljuk heritage, Alanya delivers on all fronts.',
      'British visitors particularly appreciate the warm Turkish hospitality, the excellent value for money compared to Spanish and Greek alternatives, and the fact that English is widely spoken in restaurants, shops, and hotels. The exchange rate works strongly in favour of UK travellers, making Alanya one of the most affordable quality beach destinations accessible from Britain.',
      'From all-inclusive resorts to private villas with pools, from family-friendly beaches to lively nightlife, Alanya caters to every budget and preference. This guide covers everything you need to plan your perfect Alanya holiday from the UK.',
    ],
    flightRoutes: [
      { fromCity: 'London Gatwick', airline: 'easyJet / SunExpress', toAirport: 'GZP', duration: '4h 25m', frequency: '3x weekly (Apr-Oct)' },
      { fromCity: 'London Stansted', airline: 'Corendon / Ryanair', toAirport: 'GZP', duration: '4h 20m', frequency: '2x weekly (May-Oct)' },
      { fromCity: 'Manchester', airline: 'SunExpress / Jet2', toAirport: 'AYT', duration: '4h 45m', frequency: '2x weekly (Apr-Oct)' },
      { fromCity: 'Birmingham', airline: 'SunExpress', toAirport: 'AYT', duration: '4h 40m', frequency: 'Weekly (May-Sep)' },
    ],
    flightSectionIntro: 'Several airlines operate direct flights from the UK to Alanya during the summer season. Gazipasa Airport (GZP) is just 40 minutes from Alanya centre, while Antalya Airport (AYT) is about 2 hours by road — both have regular transfer services.',
    whyAlanyaHighlights: [
      'Exceptional value — holidays cost 30-40% less than comparable Greek or Spanish resorts',
      'Cleopatra Beach — Blue Flag sand and warm Mediterranean water',
      'Direct flights from London, Manchester, and Birmingham',
      'English widely spoken — no language barrier for British tourists',
      'Rich history — Alanya Castle, Red Tower, and ancient ruins on your doorstep',
      'Family-friendly — safe beaches, water parks, and kid-friendly excursions',
    ],
    travelTips: [
      { icon: 'visa', title: 'Visa Requirements', content: 'British passport holders need an e-Visa for Turkey, obtainable online in minutes at evisa.gov.tr for approximately £50. Your passport must be valid for 150 days from your arrival date.' },
      { icon: 'currency', title: 'Currency & Money', content: 'The Turkish Lira (TRY) offers excellent value for British travellers. Cards are widely accepted, but carry some cash for local markets. ATMs are everywhere in Alanya.' },
      { icon: 'weather', title: 'Best Time to Go', content: 'May-June and September-October offer the best balance of warm weather (25-30°C), lower prices, and fewer crowds. July-August peaks at 35°C+ with higher hotel rates.' },
      { icon: 'transport', title: 'Airport Transfer', content: 'Pre-book an airport transfer for the best rates. Gazipasa to Alanya centre takes 40 minutes; Antalya takes about 2 hours. Shared shuttles and private transfers are both available.' },
      { icon: 'booking', title: 'Booking Tips', content: 'Book flights and hotels separately for the best deals — package holidays are convenient but often cost more. Early booking (Jan-Mar) for summer holidays saves up to 25%.' },
    ],
    faqs: [
      { question: 'Do I need a visa to visit Alanya from the UK?', answer: 'Yes, British citizens need an e-Visa for Turkey. Apply online at evisa.gov.tr before travel. The process takes about 10 minutes and costs approximately £50.' },
      { question: 'How long is the flight to Alanya from the UK?', answer: 'Direct flights from London take approximately 4h 20m. Flights from Manchester and Birmingham take around 4h 40m. Connecting flights via Istanbul take 6-8 hours.' },
      { question: 'Is Alanya safe for British tourists?', answer: 'Alanya is very safe for tourists. It is a well-established resort town with a low crime rate. The local economy depends heavily on tourism, and British visitors are warmly welcomed.' },
      { question: 'What is the best area to stay in Alanya?', answer: 'Cleopatra Beach area is best for beach lovers and first-timers. Mahmutlar and Konakli are quieter and better value. Oba is popular with families and long-stay visitors.' },
      { question: 'How much spending money do I need for Alanya?', answer: 'A budget of £40-60 per person per day covers meals, drinks, and activities comfortably. Alanya is significantly cheaper than most Mediterranean resorts — a restaurant meal costs £5-12.' },
    ],
  },
  {
    slug: 'alanya-holidays-from-london',
    title: 'Alanya Holidays from London',
    metaTitle: 'Alanya Holidays from London — Direct Flights & Best Deals 2026',
    metaDescription: 'Flying from London to Alanya? Direct flights from Gatwick & Stansted in under 4.5h. Best hotels, tours, airport transfers, and London-specific travel tips.',
    keywords: [
      'alanya holidays from london',
      'flights london to alanya',
      'london to alanya direct',
      'alanya from gatwick',
      'alanya from stansted',
    ],
    market: 'UK',
    language: 'en',
    // no hreflangCode — non-representative UK page
    heroSubtitle: 'From Gatwick or Stansted to the Turkish Riviera in under 4.5 hours — your complete London-to-Alanya travel guide.',
    longDescription: [
      'Londoners have some of the best flight options to Alanya of any UK departure point. Both Gatwick and Stansted offer direct seasonal flights to Gazipasa Airport, landing you just 40 minutes from Alanya city centre. No connections, no hassle — you step off the plane and into your holiday.',
      'Gatwick departures with easyJet and SunExpress run three times per week during the summer season, while Stansted offers Corendon and Ryanair options twice weekly. For travellers who prefer Antalya Airport, connecting flights via Istanbul are available year-round from Heathrow.',
      'London travellers benefit from the widest choice of departure dates and the most competitive fares. Booking early in the season (January-March) often yields return flights for under £150. Combined with Alanya\'s low cost of living, a week-long holiday can cost less than a long weekend in many European capitals.',
      'Whether you are escaping the British weather for a long weekend or planning a two-week family holiday, Alanya from London is one of the easiest and most affordable Mediterranean escapes available.',
    ],
    flightRoutes: [
      { fromCity: 'London Gatwick', airline: 'easyJet / SunExpress', toAirport: 'GZP', duration: '4h 25m', frequency: '3x weekly (Apr-Oct)' },
      { fromCity: 'London Stansted', airline: 'Corendon / Ryanair', toAirport: 'GZP', duration: '4h 20m', frequency: '2x weekly (May-Oct)' },
      { fromCity: 'London Heathrow', airline: 'Turkish Airlines (via Istanbul)', toAirport: 'AYT', duration: '6h 30m', frequency: 'Daily (year-round)' },
    ],
    flightSectionIntro: 'London has the best direct flight connections to Alanya of any UK city. Both Gatwick and Stansted offer seasonal non-stop services to Gazipasa Airport, while Heathrow provides year-round connections via Istanbul.',
    whyAlanyaHighlights: [
      'Direct flights in under 4.5 hours from Gatwick and Stansted',
      'Return flights from £150 when booked early',
      'Gazipasa Airport just 40 minutes from Alanya centre',
      'Significantly cheaper than Greek islands or Spanish Costas',
      'Warm Turkish hospitality and English widely spoken',
      'Blue Flag beaches, ancient castle, and vibrant nightlife all in one town',
    ],
    travelTips: [
      { icon: 'booking', title: 'Best Flight Deals', content: 'Set price alerts on Skyscanner for LGW-GZP and STN-GZP routes. The best fares appear 8-12 weeks before departure. Tuesday and Wednesday departures are typically cheapest.' },
      { icon: 'transport', title: 'Getting to Gatwick/Stansted', content: 'Gatwick Express from Victoria (30 min) or Stansted Express from Liverpool Street (45 min). Allow extra time during peak commuting hours.' },
      { icon: 'currency', title: 'Money Tips for Londoners', content: 'Avoid airport currency exchanges — rates are poor. Use a fee-free travel card (Monzo, Starling, Revolut) for the best exchange rates in Alanya.' },
      { icon: 'weather', title: 'When to Fly', content: 'May-June and September offer the best weather-to-price ratio. July-August is hottest (35°C+) and most expensive. October is a hidden gem — still 28°C with half the crowds.' },
    ],
    faqs: [
      { question: 'Which London airport is best for Alanya flights?', answer: 'Gatwick has the most frequent direct flights (3x weekly) with easyJet and SunExpress. Stansted also has direct flights (2x weekly) which can be cheaper. Heathrow connects via Istanbul year-round.' },
      { question: 'How much does a London to Alanya flight cost?', answer: 'Return flights from London to Alanya typically cost £120-£300 depending on season and how early you book. Early booking (Jan-Mar) for summer departures often yields the best fares under £150 return.' },
      { question: 'Can I do a long weekend in Alanya from London?', answer: 'Absolutely. With direct flights under 4.5 hours, a Thursday-to-Sunday trip is very doable. The short transfer from Gazipasa Airport (40 min) means you can be on the beach by early afternoon on arrival day.' },
      { question: 'Is Alanya better than the Spanish Costas for a Londoner?', answer: 'Alanya offers significantly better value — hotel and restaurant prices are 30-50% lower than Spanish resorts. The weather is warmer, the beaches are comparable, and the cultural attractions (castle, caves, canyons) are far more impressive.' },
    ],
  },
  {
    slug: 'alanya-package-holidays-uk',
    title: 'Alanya Package Holidays UK',
    metaTitle: 'Alanya Package Holidays from UK — All-Inclusive & Best Deals 2026',
    metaDescription: 'Compare Alanya package holidays from UK operators. All-inclusive resorts, flight + hotel bundles, and tips to get the best deal on your Turkish Riviera package holiday.',
    keywords: [
      'alanya package holidays uk',
      'alanya all inclusive uk',
      'alanya package deal',
      'cheap alanya holiday package',
      'alanya turkey package holiday',
    ],
    market: 'UK',
    language: 'en',
    // no hreflangCode — non-representative UK page
    heroSubtitle: 'All-inclusive convenience or build-your-own flexibility — find the best Alanya package holiday deal for your budget.',
    longDescription: [
      'Package holidays to Alanya remain popular with British travellers who value the convenience of having flights, accommodation, and transfers arranged in a single booking. Major UK operators including Jet2holidays, TUI, and easyJet Holidays offer Alanya packages with ATOL protection and flexible payment terms.',
      'All-inclusive packages are the most popular option, with 3-4 star resorts starting from around £500 per person for a week in peak season. These typically include flights, airport transfers, all meals and drinks, and often some entertainment and activities. For families, the all-inclusive model eliminates the stress of budgeting for daily meals and drinks.',
      'However, savvy British travellers are increasingly discovering that booking flights and hotels separately often yields better value and more choice. Alanya\'s hotel scene offers everything from boutique guesthouses to luxury villas — many of which are not available through package operators. Adding an airport transfer and booking excursions independently can save 20-30% compared to equivalent package deals.',
      'Whether you prefer the security of a package or the flexibility of independent travel, Alanya offers outstanding value compared to Mediterranean alternatives. A comparable holiday in Majorca, Crete, or the Algarve would cost 30-50% more.',
    ],
    flightRoutes: [
      { fromCity: 'Multiple UK Airports', airline: 'Jet2 / TUI / easyJet', toAirport: 'AYT / GZP', duration: '4h 20m-4h 45m', frequency: 'Multiple weekly (Apr-Oct)' },
    ],
    flightSectionIntro: 'Package holiday operators fly from over 10 UK airports to Antalya and Gazipasa during the summer season. Package flights typically use charter services with specific departure days tied to hotel check-in/check-out dates.',
    whyAlanyaHighlights: [
      'All-inclusive packages from £500pp/week — far cheaper than Greek or Spanish equivalents',
      'ATOL-protected packages from major UK operators (Jet2, TUI, easyJet)',
      'Wide range of all-inclusive resorts with entertainment and kids\' clubs',
      'Separate booking saves 20-30% over package deals for flexible travellers',
      'Low cost of living means even independently booked holidays are excellent value',
      'Turkish hospitality makes package holiday guests feel like VIPs',
    ],
    travelTips: [
      { icon: 'booking', title: 'Package vs Independent', content: 'Packages are best for families wanting hassle-free holidays with ATOL protection. Independent booking saves 20-30% and offers more accommodation choice. Compare both before deciding.' },
      { icon: 'visa', title: 'Visa for Package Holidays', content: 'Your package operator may include the e-Visa in the price — check before applying separately. If not, apply online at evisa.gov.tr for approximately £50.' },
      { icon: 'currency', title: 'All-Inclusive Tips', content: 'Even on all-inclusive packages, carry some Turkish Lira for tips, local markets, and off-resort excursions. The exchange rate is very favourable for British travellers.' },
      { icon: 'weather', title: 'Best Package Season', content: 'May-June packages offer the best value — warm weather (25-30°C) with peak-season prices yet to kick in. September packages are also excellent after the August price peak.' },
    ],
    faqs: [
      { question: 'How much does an Alanya package holiday cost from the UK?', answer: 'A 7-night all-inclusive package starts from around £500 per person in shoulder season (May/September) and £700-900 in peak summer (July-August). Prices vary by hotel rating, departure airport, and operator.' },
      { question: 'Is it cheaper to book Alanya independently?', answer: 'Usually yes — booking flights and hotels separately typically saves 20-30% compared to equivalent package deals. However, packages offer ATOL protection, convenience, and fixed pricing which many families prefer.' },
      { question: 'Which UK operators offer Alanya package holidays?', answer: 'Jet2holidays, TUI, and easyJet Holidays are the main operators serving Alanya. Some also offer flight-only or hotel-only bookings if you prefer to mix and match.' },
      { question: 'Are Alanya all-inclusive resorts good quality?', answer: 'Yes — Alanya has invested heavily in its resort infrastructure. 4-5 star all-inclusive hotels offer facilities and food quality comparable to Mediterranean resorts costing 30-50% more. Check recent reviews on TripAdvisor for specific hotel recommendations.' },
    ],
  },

  // ── DE Pages (German content) ─────────────────────────────────────
  {
    slug: 'alanya-urlaub',
    title: 'Alanya Urlaub',
    metaTitle: 'Alanya Urlaub — Flüge, Hotels & Reisetipps 2026',
    metaDescription: 'Planen Sie Ihren Alanya-Urlaub. Direktflüge ab Deutschland, beste Hotels, Ausflüge, Flughafentransfers und Reisetipps für deutsche Urlauber.',
    keywords: [
      'alanya urlaub',
      'alanya türkei urlaub',
      'alanya holiday',
      'urlaub alanya türkei',
      'alanya reise',
    ],
    market: 'DE',
    language: 'de',
    hreflangCode: 'de',
    heroSubtitle: 'Sonne, Strand und antike Geschichte — Alanya ist das türkische Riviera-Juwel, das deutsche Urlauber immer wieder begeistert.',
    longDescription: [
      'Alanya gehört zu den beliebtesten Urlaubzielen für deutsche Reisende, die nach garantiertem Sonnenschein, wunderschönen Stränden und reicher Kultur suchen. Die türkische Riviera bietet deutschen Urlaubern ein einzigartiges Preis-Leistungs-Verhältnis, das südeuropäische Destinationen kaum erreichen können.',
      'Deutsche Urlauber schätzen besonders die herzliche türkische Gastfreundschaft, die exzellenten Strandbedingungen am Kleopatra-Strand und die faszinierende Historie der Stadt. Die seldschukische Festung, der Rote Turm und die alten Schiffswerften erzählen Geschichten aus tausend Jahren.',
      'Die Deutschsprachigkeit in vielen Hotels, Restaurants und Geschäften macht den Urlaub besonders unkompliziert. Auch ohne Türkisch-Kenntnisse kommen deutsche Gäste problemlos zurecht — Englisch und teilweise Deutsch werden in touristischen Bereichen flächendeckend gesprochen.',
      'Ob All-Inclusive-Resort, gemütliche Ferienwohnung oder Luxusvilla mit Pool — Alanya bietet für jedes Budget und jeden Geschmack die passende Unterkunft. Naturfreunde kommen mit dem Dim-Cay, Sapadere-Canyon und dem grünen Canyon voll auf ihre Kosten.',
    ],
    flightRoutes: [
      { fromCity: 'Berlin', airline: 'SunExpress / Corendon', toAirport: 'GZP', duration: '3h 30m', frequency: '2x wöchentlich (Apr-Okt)' },
      { fromCity: 'Düsseldorf', airline: 'SunExpress / Pegasus', toAirport: 'GZP', duration: '3h 45m', frequency: '3x wöchentlich (Apr-Okt)' },
      { fromCity: 'Frankfurt', airline: 'SunExpress', toAirport: 'AYT', duration: '3h 30m', frequency: '2x wöchentlich (Mai-Okt)' },
      { fromCity: 'München', airline: 'SunExpress / Corendon', toAirport: 'GZP', duration: '3h 15m', frequency: '2x wöchentlich (Mai-Okt)' },
      { fromCity: 'Hamburg', airline: 'SunExpress', toAirport: 'AYT', duration: '3h 45m', frequency: 'Wöchentlich (Mai-Sep)' },
    ],
    flightSectionIntro: 'Mehrere deutsche Flughäfen bieten Direktflüge nach Alanya in der Sommersaison an. Der Flughafen Gazipasa (GZP) liegt nur 40 Minuten vom Stadtzentrum entfernt, während Antalya (AYT) etwa 2 Stunden Fahrt entfernt liegt.',
    whyAlanyaHighlights: [
      'Hervorragendes Preis-Leistungs-Verhältnis — 30-50% günstiger als griechische oder spanische Alternativen',
      'Kleopatra-Strand — Blue-Flag-Strand mit warmem Mittelmeerwasser',
      'Direktflüge ab Berlin, Düsseldorf, Frankfurt, München und Hamburg',
      'Deutschsprachige Betreuung in vielen Hotels und Ausflugsanbietern',
      'Reiche Geschichte — Festung, Roter Turm und antike Ruinen',
      'Vielfältige Naturerlebnisse — Dim-Cay, Sapadere-Canyon, Grüner Canyon',
    ],
    travelTips: [
      { icon: 'visa', title: 'Einreisebestimmungen', content: 'Deutsche Staatsbürger benötigen einen e-Visum für die Türkei. Online unter evisa.gov.tr in wenigen Minuten beantragen (ca. 50 €). Der Reisepass muss bei Einreise noch 150 Tage gültig sein.' },
      { icon: 'currency', title: 'Währung & Geld', content: 'Die Türkische Lira (TRY) bietet deutschen Reisenden ein exzellentes Wechselkurs-Verhältnis. Kreditkarten werden akzeptiert, aber Bargeld ist auf lokalen Märkten empfehlenswert.' },
      { icon: 'weather', title: 'Beste Reisezeit', content: 'Mai-Juni und September-Oktober bieten das beste Verhältnis von warmem Wetter (25-30°C), moderaten Preisen und weniger Touristen. Juli-August ist heiß (35°C+) und teurer.' },
      { icon: 'transport', title: 'Flughafentransfer', content: 'Buchen Sie den Flughafentransfer im Voraus für die besten Raten. Gazipasa nach Alanya-Zentrum dauert 40 Minuten, von Antalya etwa 2 Stunden.' },
    ],
    faqs: [
      { question: 'Brauche ich ein Visum für Alanya?', answer: 'Ja, deutsche Staatsbürger benötigen ein e-Visum für die Türkei. Beantragen Sie es online unter evisa.gov.tr vor der Reise. Der Prozess dauert etwa 10 Minuten und kostet ca. 50 €.' },
      { question: 'Wie lange dauert der Flug nach Alanya?', answer: 'Direktflüge ab Deutschland dauern etwa 3h 15m bis 3h 45m, je nach Abflughafen. Umsteigeverbindungen über Istanbul dauern 5-7 Stunden.' },
      { question: 'Ist Alanya für deutsche Urlauber sicher?', answer: 'Alanya ist ein etabliertes und sicheres Urlaubsziel. Die Kriminalitätsrate ist niedrig, und deutsche Touristen sind herzlich willkommen. Die lokale Wirtschaft ist stark vom Tourismus abhängig.' },
      { question: 'Wie viel Taschengeld brauche ich in Alanya?', answer: 'Mit 40-60 € pro Person und Tag sind Sie für Essen, Trinken und Aktivitäten gut versorgt. Alanya ist deutlich günstiger als die meisten Mittelmeerdestinationen — ein Restaurantbesuch kostet 5-12 €.' },
    ],
  },
  {
    slug: 'alanya-reisen',
    title: 'Alanya Reisen',
    metaTitle: 'Alanya Reisen — Ihr Reiseführer für die türkische Riviera 2026',
    metaDescription: 'Alanya Reisen: Direktflüge, beste Unterkünfte, Ausflüge und Reisetipps. Alles für Ihren perfekten Urlaub an der türkischen Riviera.',
    keywords: [
      'alanya reisen',
      'reisen alanya',
      'alanya turkei reisen',
      'alanya reise tips',
      'alanya urlaub reisen',
    ],
    market: 'DE',
    language: 'de',
    // no hreflangCode — non-representative DE page
    heroSubtitle: 'Ihr kompletter Reiseführer für Alanya — von Direktflügen bis zu versteckten Naturwundern an der türkischen Riviera.',
    longDescription: [
      'Alanya Reisen bedeuten mehr als nur Strandurlaub — sie sind die Entdeckung einer lebendigen Küstenstadt mit 3000 Jahren Geschichte, atemberaubender Natur und einer Gastfreundschaft, die ihresgleichen sucht. Für deutsche Reisende bietet Alanya die perfekte Kombination aus Erholung und Abenteuer.',
      'Die Stadt liegt an einem malerischen Landvorsprung, der von der mächtigen seldschukischen Festung gekrönt wird. Strände mit Blue-Flag-Auszeichnung, kristallklares Mittelmeerwasser und ein lebhaftes Stadtzentrum mit Restaurants, Basaren und Marina sorgen dafür, dass es nie langweilig wird.',
      'Deutsche Reisende schätzen besonders die Vielfalt der Ausflüge: Jeep-Safari durch das Taurusgebirge, Bootstouren entlang der Küste, Schnorcheln im klaren Wasser, oder Besichtigungen von Dim-Höhle und Sapadere-Canyon. Jeder Tag kann ein neues Abenteuer sein.',
      'Mit hervorragenden Flugverbindungen, einem günstigen Preisniveau und einem warmen, trockenen Klima von April bis November gehört Alanya zu den attraktivsten Reisezielen für deutsche Urlauber.',
    ],
    flightRoutes: [
      { fromCity: 'Berlin', airline: 'SunExpress / Corendon', toAirport: 'GZP', duration: '3h 30m', frequency: '2x wöchentlich (Apr-Okt)' },
      { fromCity: 'Düsseldorf', airline: 'SunExpress / Pegasus', toAirport: 'GZP', duration: '3h 45m', frequency: '3x wöchentlich (Apr-Okt)' },
      { fromCity: 'Frankfurt', airline: 'SunExpress', toAirport: 'AYT', duration: '3h 30m', frequency: '2x wöchentlich (Mai-Okt)' },
      { fromCity: 'München', airline: 'SunExpress / Corendon', toAirport: 'GZP', duration: '3h 15m', frequency: '2x wöchentlich (Mai-Okt)' },
    ],
    flightSectionIntro: 'Deutschland hat exzellente Direktflugverbindungen nach Alanya. In der Sommersaison fliegen mehrere Airlines ab Berlin, Düsseldorf, Frankfurt und München direkt nach Gazipasa oder Antalya.',
    whyAlanyaHighlights: [
      'Kompakte 3-3,5h Flugzeit ab Deutschland',
      'Breites Ausflugsangebot — von Jeep-Safari bis Bootstour',
      'Blue-Flag-Strände und kristallklares Wasser',
      'Seldschukische Festung und historische Sehenswürdigkeiten',
      'Günstiges Preisniveau gegenüber europäischen Zielen',
      'Deutschfreundliche Hotels und Ausflugsanbieter',
    ],
    travelTips: [
      { icon: 'booking', title: 'Reisebuchung', content: 'Frühbucher (Januar-März) sparen bis zu 25% auf Sommerreisen. Flug und Hotel separat zu buchen ist oft günstiger als Pauschalreisen.' },
      { icon: 'visa', title: 'Einreise', content: 'e-Visum online unter evisa.gov.tr beantragen (ca. 50 €). Reisepass muss 150 Tage gültig sein. Der Prozess ist unkompliziert und dauert wenige Minuten.' },
      { icon: 'culture', title: 'Kultur & Etikette', content: 'Die Türken sind sehr gastfreundlich. Ein freundliches "Merhaba" (Hallo) öffnet viele Türen. In Moscheen sollten Frauen ein Tuch für die Haare dabei haben.' },
      { icon: 'weather', title: 'Klima', content: 'Von April bis November ist das Wetter warm und trocken. Die beste Reisezeit für deutsche Urlauber ist Mai-Juni und September-Oktober — warm, aber nicht extrem heiß.' },
    ],
    faqs: [
      { question: 'Was macht Alanya als Reiseziel besonders?', answer: 'Alanya vereint Strandurlaub, Kultur und Naturabenteuer in einer Stadt. Die seldschukische Festung, der Kleopatra-Strand und die nahegelegenen Canyons bieten mehr Abwechslung als die meisten Mittelmeerziele — zu deutlich günstigeren Preisen.' },
      { question: 'Welche Ausflüge sind in Alanya empfehlenswert?', answer: 'Jeep-Safari ins Taurusgebirge, Bootstour entlang der Küste, Sapadere-Canyon, Dim-Höhle und Dim-Cay, Grüner Canyon und Alanya-Stadtrundfahrt mit Festung und Rotem Turm.' },
      { question: 'Kann ich in Alanya mit Euro bezahlen?', answer: 'Offizielles Zahlungsmittel ist die Türkische Lira. In touristischen Gebieten wird teilweise Euro akzeptiert, aber der Kurs ist meist ungünstig. Nutzen Sie besser eine gebührenfreie Reisekarte oder heben Sie Lira am Geldautomaten ab.' },
      { question: 'Wie weit ist Alanya vom Flughafen entfernt?', answer: 'Gazipasa-Flughafen liegt 40 Minuten von Alanya entfernt. Antalya-Flughafen benötigt etwa 2 Stunden Fahrt. Ein Vorab-gebuchter Transfer ist die bequemste Option.' },
    ],
  },

  // ── NL Page (Dutch content) ────────────────────────────────────────
  {
    slug: 'alanya-vakantie',
    title: 'Alanya Vakantie',
    metaTitle: 'Alanya Vakantie — Vluchten, Hotels & Reistips 2026',
    metaDescription: 'Plan uw Alanya vakantie. Directe vluchten vanaf Nederland, beste hotels, uitjes, luchthaventransfers en reistips voor Nederlandse vakantiegangers.',
    keywords: [
      'alanya vakantie',
      'alanya turkije vakantie',
      'vakantie alanya',
      'alanya holiday nederland',
      'alanya turkse riviera',
    ],
    market: 'NL',
    language: 'nl',
    hreflangCode: 'nl',
    heroSubtitle: 'Zon, strand en eeuwenoude geschiedenis — Alanya is de Turkse Riviera-bestemming die Nederlandse vakantiegangers keer op keer verrast.',
    longDescription: [
      'Alanya is een van de meest geliefde vakantiebestemmingen voor Nederlandse reizigers die op zoek zijn naar gegarandeerd zonneschijn, prachtige stranden en een rijke cultuur tegen een fractie van de prijs van mediterrane resorts. Met directe vluchten vanaf Nederland en een gastvrije sfeer is het geen verrassing dat Alanya steeds populairder wordt bij Nederlandse toeristen.',
      'Nederlandse bezoekers waarderen bijzonder de warme Turkse gastvrijheid, het uitstekende prijs-kwaliteitsverbintenis vergeleken met Spaanse en Griekse alternatieven, en het feit dat Engels en soms Duits veelal gesproken wordt in restaurants, winkels en hotels. De wisselkoers is gunstig voor Nederlandse reizigers, waardoor Alanya een van de meest betaalbare kwaliteitsstrandbestemmingen is.',
      'De stad biedt voor elk type Nederlandse vakantieganger iets. Of u nu op zoek bent naar een luie strandvakantie op het Kleopatra-strand, een actief avontuur met jeep-safari\'s en boottochten, of een culturele verkenning van het Ottomaanse en Seltsjoekse erfgoed — Alanya heeft het allemaal.',
      'Van all-inclusive resorts tot vakantieappartementen, van kindvriendelijke stranden tot levendig nachtleven, Alanya past zich aan elk budget en elke voorkeur aan.',
    ],
    flightRoutes: [
      { fromCity: 'Amsterdam Schiphol', airline: 'SunExpress / Corendon', toAirport: 'GZP', duration: '3h 50m', frequency: '2x per week (apr-okt)' },
      { fromCity: 'Eindhoven', airline: 'Corendon / Pegasus', toAirport: 'GZP', duration: '3h 40m', frequency: '2x per week (mei-okt)' },
      { fromCity: 'Rotterdam-Den Haag', airline: 'Corendon', toAirport: 'AYT', duration: '3h 55m', frequency: 'Wekelijks (mei-sep)' },
    ],
    flightSectionIntro: 'Verschillende Nederlandse luchthavens bieden directe vluchten naar Alanya tijdens het zomerseizoen. Luchthaven Gazipasa (GZP) ligt slechts 40 minuten van het centrum van Alanya, terwijl Antalya (AYT) ongeveer 2 uur rijden is.',
    whyAlanyaHighlights: [
      'Uitstekend prijs-kwaliteitsverbintenis — 30-40% goedkoper dan Griekse of Spaanse resorts',
      'Kleopatra-strand — Blue Flag zand en warm Middellandse Zee-water',
      'Directe vluchten vanaf Amsterdam, Eindhoven en Rotterdam',
      'Engels en Duits veelal gesproken in toeristische gebieden',
      'Rijke geschiedenis — Seltsjoekse burcht, Rode Toren en antieke ruïnes',
      'Gevarieerde natuur — Dim-rivier, Sapadere-kloof, Groene Canyon',
    ],
    travelTips: [
      { icon: 'visa', title: 'Visumvereisten', content: 'Nederlandse paspoorthouders hebben een e-Visum nodig voor Turkije. Online aanvragen op evisa.gov.tr in enkele minuten (ca. € 50). Uw paspoort moet bij aankomst nog 150 dagen geldig zijn.' },
      { icon: 'currency', title: 'Valuta & Geld', content: 'De Turkse Lira (TRY) biedt een gunstige wisselkoers voor Nederlandse reizigers. Creditcards worden geaccepteerd, maar contant geld is handig voor lokale markten. Pinautomaten zijn overal in Alanya beschikbaar.' },
      { icon: 'weather', title: 'Beste Reistijd', content: 'Mei-juni en september-oktober bieden de beste balans tussen warm weer (25-30°C), lagere prijzen en minder drukte. Juli-augustus piekt op 35°C+ met hogere hotelprijzen.' },
      { icon: 'transport', title: 'Luchthaventransfer', content: 'Boek vooraf een luchthaventransfer voor de beste tarieven. Gazipasa naar Alanya-centrum duurt 40 minuten; Antalya ongeveer 2 uur. Zowel gedeelde shuttles als privétransfers zijn beschikbaar.' },
    ],
    faqs: [
      { question: 'Heb ik een visum nodig voor Alanya vanuit Nederland?', answer: 'Ja, Nederlandse burgers hebben een e-Visum nodig voor Turkije. Vraag het online aan op evisa.gov.tr voor uw reis. Het proces duurt ongeveer 10 minuten en kost ca. € 50.' },
      { question: 'Hoe lang is de vlucht naar Alanya vanuit Nederland?', answer: 'Directe vluchten vanaf Amsterdam en Eindhoven duren ongeveer 3h 40m tot 3h 50m. Vluchten met overstap via Istanbul duren 5-7 uur.' },
      { question: 'Is Alanya veilig voor Nederlandse toeristen?', answer: 'Alanya is een veilige en gevestigde badplaats. De criminaliteit is er laag en Nederlandse toeristen worden hartelijk verwelkomd. De lokale economie is sterk afhankelijk van het toerisme.' },
      { question: 'Hoeveel zakgeld heb ik nodig in Alanya?', answer: 'Met € 40-60 per persoon per dag bent u comfortabel voorzien van maaltijden, drankjes en activiteiten. Alanya is aanzienlijk goedkoper dan de meeste Middellandse Zee-bestemmingen.' },
    ],
  },

  // ── NO Page (English content) ─────────────────────────────────────
  {
    slug: 'alanya-holidays-from-norway',
    title: 'Alanya Holidays from Norway',
    metaTitle: 'Alanya Holidays from Norway — Flights, Hotels & Travel Tips 2026',
    metaDescription: 'Plan your Alanya holiday from Norway. Direct flights from Oslo, best hotels, excursions, airport transfers, and travel tips for Norwegian travellers.',
    keywords: [
      'alanya holidays from norway',
      'alanya from oslo',
      'alanya tyrkia ferie',
      'alanya norway holiday',
      'turkish riviera norway',
    ],
    market: 'NO',
    language: 'en',
    hreflangCode: 'en-NO',
    heroSubtitle: 'Escape the Norwegian winter for sun, warmth, and adventure — Alanya is the perfect getaway for Norwegian travellers.',
    longDescription: [
      'Norwegian travellers have discovered what makes Alanya special: a warm, welcoming destination that offers outstanding value and guaranteed sunshine when Norway is at its coldest and darkest. With direct flights from Oslo and excellent connections, Alanya has become a favourite for Norwegians seeking a reliable sunshine break.',
      'The contrast could not be starker — while Norway endures its long, dark winters, Alanya enjoys mild temperatures of 15-20°C even in December-January. For Norwegians, a winter escape to Alanya means trading grey skies and snow for palm trees, warm sea breezes, and al-fresco dining under clear blue skies.',
      'Norwegian visitors appreciate the excellent value for money. The Norwegian Krone goes far in Turkey, making Alanya one of the most affordable warm-weather destinations accessible from Norway. Hotel rates, restaurant prices, and excursion costs are a fraction of what you would pay in comparable Mediterranean destinations.',
      'Whether you are planning a winter sun escape, a summer beach holiday, or a spring walking trip through the Taurus Mountains, Alanya offers Norwegian travellers the warmth, variety, and value that keeps them coming back year after year.',
    ],
    flightRoutes: [
      { fromCity: 'Oslo Gardermoen', airline: 'SunExpress / Norwegian', toAirport: 'GZP', duration: '4h 10m', frequency: '2x weekly (Apr-Oct)' },
      { fromCity: 'Oslo Gardermoen', airline: 'Turkish Airlines (via Istanbul)', toAirport: 'AYT', duration: '6h', frequency: 'Daily (year-round)' },
      { fromCity: 'Bergen', airline: 'Connecting via Istanbul', toAirport: 'AYT', duration: '7h+', frequency: 'Daily (year-round)' },
    ],
    flightSectionIntro: 'Direct seasonal flights from Oslo to Gazipasa Airport make Alanya easily accessible for Norwegian travellers. Year-round connections via Istanbul are also available for winter escapes.',
    whyAlanyaHighlights: [
      'Guaranteed sunshine — escape the Norwegian winter with 300+ sunny days per year',
      'Mild winter temperatures (15-20°C) — perfect for a winter sun break',
      'Excellent value — the Norwegian Krone stretches far in Turkey',
      'Direct flights from Oslo in just over 4 hours',
      'Warm Turkish hospitality and English widely spoken',
      'Diverse activities — beaches, history, nature, and adventure all in one place',
    ],
    travelTips: [
      { icon: 'visa', title: 'Visa for Norwegians', content: 'Norwegian passport holders need an e-Visa for Turkey. Apply online at evisa.gov.tr in minutes for approximately 50 EUR. Your passport must be valid for 150 days from arrival.' },
      { icon: 'currency', title: 'Currency Exchange', content: 'The Turkish Lira offers excellent value for Norwegian travellers. Use fee-free travel cards or withdraw Lira from ATMs in Alanya for the best rates.' },
      { icon: 'weather', title: 'Winter Sun Season', content: 'November-March temperatures (15-20°C) feel like a warm Norwegian summer. Perfect for sightseeing, walking, and relaxing outdoors. Water is too cool for swimming but beach walks are lovely.' },
      { icon: 'booking', title: 'Booking Tips', content: 'Winter flights via Istanbul can be surprisingly affordable. Book early for summer direct flights — they sell out quickly from March onwards.' },
    ],
    faqs: [
      { question: 'Can Norwegians visit Alanya in winter?', answer: 'Absolutely! Alanya is one of the best winter sun destinations for Norwegians. Temperatures of 15-20°C from November to March are a stark contrast to Norwegian winter. Many hotels and restaurants stay open year-round.' },
      { question: 'How long is the flight from Norway to Alanya?', answer: 'Direct flights from Oslo to Gazipasa take approximately 4h 10m during the summer season. Year-round connections via Istanbul take about 6 hours total.' },
      { question: 'Do Norwegians need a visa for Turkey?', answer: 'Yes, Norwegian citizens need an e-Visa. Apply online at evisa.gov.tr before travel. The process is quick and costs approximately 50 EUR.' },
      { question: 'Is Alanya good for a family holiday from Norway?', answer: 'Very much so. Alanya offers safe beaches, family-friendly hotels, water parks, and activities for all ages. The value for money is exceptional compared to Mediterranean alternatives.' },
    ],
  },

  // ── SE Page (English content) ─────────────────────────────────────
  {
    slug: 'alanya-holidays-from-sweden',
    title: 'Alanya Holidays from Sweden',
    metaTitle: 'Alanya Holidays from Sweden — Flights, Hotels & Travel Tips 2026',
    metaDescription: 'Plan your Alanya holiday from Sweden. Direct flights from Stockholm, best hotels, excursions, airport transfers, and travel tips for Swedish travellers.',
    keywords: [
      'alanya holidays from sweden',
      'alanya from stockholm',
      'alanya turkiet semester',
      'alanya sweden holiday',
      'turkish riviera sweden',
    ],
    market: 'SE',
    language: 'en',
    hreflangCode: 'en-SE',
    heroSubtitle: 'Trade Swedish winter darkness for Mediterranean sunshine — Alanya is the warm escape Swedish travellers love.',
    longDescription: [
      'Swedish travellers seeking guaranteed sunshine and warm temperatures have found their ideal destination in Alanya. With direct flights from Stockholm and an incredibly favourable exchange rate, Alanya delivers warmth, culture, and value that keeps Swedish visitors returning year after year.',
      'For Swedes tired of long, dark winters, Alanya offers a stark and welcome contrast. Even in December and January, temperatures reach 15-20°C with bright blue skies — perfect for exploring the historic castle, strolling along the harbour, or simply soaking up the sun on Cleopatra Beach.',
      'The Swedish Krona goes remarkably far in Turkey. Restaurant meals, hotel stays, and excursions cost a fraction of what they would in comparable Mediterranean destinations. This exceptional value makes Alanya one of the most affordable warm-weather holidays accessible from Sweden.',
      'Whether you are planning a winter sun escape, a summer family holiday, or a spring adventure exploring the canyons and mountains around Alanya, the Turkish Riviera has something special for every Swedish traveller.',
    ],
    flightRoutes: [
      { fromCity: 'Stockholm Arlanda', airline: 'SunExpress / Corendon', toAirport: 'GZP', duration: '3h 55m', frequency: '2x weekly (Apr-Oct)' },
      { fromCity: 'Stockholm Arlanda', airline: 'Turkish Airlines (via Istanbul)', toAirport: 'AYT', duration: '5h 45m', frequency: 'Daily (year-round)' },
      { fromCity: 'Gothenburg', airline: 'Connecting via Istanbul', toAirport: 'AYT', duration: '6h 30m', frequency: 'Daily (year-round)' },
    ],
    flightSectionIntro: 'Direct seasonal flights from Stockholm to Gazipasa Airport make Alanya easily accessible for Swedish travellers during summer. Year-round connections via Istanbul provide options for winter escapes too.',
    whyAlanyaHighlights: [
      'Escape Swedish winter — 300+ sunny days per year in Alanya',
      'Mild winter temperatures (15-20°C Dec-Jan) — perfect winter sun destination',
      'Exceptional value — the Swedish Krona stretches far in Turkey',
      'Direct flights from Stockholm in under 4 hours',
      'Safe, family-friendly resort town with warm hospitality',
      'History, beaches, and nature adventures all in one destination',
    ],
    travelTips: [
      { icon: 'visa', title: 'Visa for Swedes', content: 'Swedish passport holders need an e-Visa for Turkey. Apply online at evisa.gov.tr in minutes for approximately 50 EUR. Your passport must be valid for 150 days from arrival.' },
      { icon: 'currency', title: 'Currency & Value', content: 'The Turkish Lira offers exceptional value for Swedish travellers. Use fee-free cards or withdraw locally for the best rates. Everything from meals to excursions costs significantly less than in Sweden or Mediterranean Europe.' },
      { icon: 'weather', title: 'When to Visit', content: 'Winter (Nov-Mar): 15-20°C, ideal for sightseeing and escaping the cold. Summer (Jun-Aug): 30-35°C, peak beach season. Spring/Autumn: 25°C, best overall value and comfort.' },
      { icon: 'culture', title: 'Cultural Tips', content: 'Turks are famously hospitable. A friendly greeting goes a long way. Swedish punctuality is appreciated for excursions. Dress modestly when visiting mosques — women should bring a headscarf.' },
    ],
    faqs: [
      { question: 'Can I visit Alanya from Sweden in winter?', answer: 'Yes! Alanya is an excellent winter sun destination for Swedes. Temperatures of 15-20°C from November to March are a world away from Swedish winter. Many hotels stay open year-round, and the town remains lively.' },
      { question: 'How long is the flight from Sweden to Alanya?', answer: 'Direct flights from Stockholm to Gazipasa take approximately 3h 55m during the summer season. Year-round connections via Istanbul take about 5h 45m total.' },
      { question: 'Do Swedes need a visa for Turkey?', answer: 'Yes, Swedish citizens need an e-Visa. Apply online at evisa.gov.tr before travel. It takes about 10 minutes and costs approximately 50 EUR.' },
      { question: 'Is Alanya good value for Swedish travellers?', answer: 'Exceptional value. The exchange rate makes Alanya one of the most affordable warm-weather destinations accessible from Sweden. A restaurant meal costs a fraction of Swedish prices, and hotels offer far more for your money than comparable Mediterranean destinations.' },
    ],
  },
];

// ── Localized UI strings (structural/chrome text not in page content) ──

export const UI_STRINGS: Record<LanguageCode, Record<string, string>> = {
  en: {
    home: 'Home',
    readMore: 'Read More',
    readLess: 'Read Less',
    flightsHeading: 'Flights to Alanya from',
    whyAlanyaHeading: 'Why Alanya is Perfect for',
    whyAlanyaSuffix: 'Travellers',
    travelTipsHeading: 'Travel Tips for',
    travelTipsSuffix: 'Visitors',
    ctaHeading: 'Plan Your Alanya Visit',
    ctaHotels: 'Find Hotels',
    ctaHotelsDesc: 'Browse hotels & villas in Alanya',
    ctaExcursions: 'Book Excursions',
    ctaExcursionsDesc: 'Tours, boat trips, and activities',
    ctaTransfer: 'Airport Transfer',
    ctaTransferDesc: 'Fixed-price transfer from AYT & GZP',
    faqHeading: 'Frequently Asked Questions',
    fromCol: 'From',
    airlineCol: 'Airline',
    toCol: 'To',
    durationCol: 'Duration',
    frequencyCol: 'Frequency',
    holidaysFrom: 'Holidays from',
    otherMarkets: 'Alanya Holidays for Other Markets',
  },
  de: {
    home: 'Startseite',
    readMore: 'Weiterlesen',
    readLess: 'Weniger',
    flightsHeading: 'Flüge nach Alanya ab',
    whyAlanyaHeading: 'Warum Alanya perfekt ist für',
    whyAlanyaSuffix: 'Urlauber',
    travelTipsHeading: 'Reisetipps für',
    travelTipsSuffix: 'Besucher',
    ctaHeading: 'Planen Sie Ihren Alanya-Urlaub',
    ctaHotels: 'Hotels finden',
    ctaHotelsDesc: 'Hotels & Villen in Alanya durchsuchen',
    ctaExcursions: 'Ausflüge buchen',
    ctaExcursionsDesc: 'Touren, Bootsfahrten und Aktivitäten',
    ctaTransfer: 'Flughafentransfer',
    ctaTransferDesc: 'Festpreistransfer ab AYT & GZP',
    faqHeading: 'Häufig gestellte Fragen',
    fromCol: 'Von',
    airlineCol: 'Fluggesellschaft',
    toCol: 'Nach',
    durationCol: 'Dauer',
    frequencyCol: 'Häufigkeit',
    holidaysFrom: 'Urlaub ab',
    otherMarkets: 'Alanya Urlaub für andere Märkte',
  },
  nl: {
    home: 'Home',
    readMore: 'Lees meer',
    readLess: 'Minder',
    flightsHeading: 'Vluchten naar Alanya vanaf',
    whyAlanyaHeading: 'Waarom Alanya perfect is voor',
    whyAlanyaSuffix: 'Vakantiegangers',
    travelTipsHeading: 'Reistips voor',
    travelTipsSuffix: 'Bezoekers',
    ctaHeading: 'Plan uw Alanya-vakantie',
    ctaHotels: 'Hotels vinden',
    ctaHotelsDesc: 'Hotels & villa\'s in Alanya bekijken',
    ctaExcursions: 'Uitjes boeken',
    ctaExcursionsDesc: 'Tours, boottochten en activiteiten',
    ctaTransfer: 'Luchthaventransfer',
    ctaTransferDesc: 'Vasteprijstransfer vanaf AYT & GZP',
    faqHeading: 'Veelgestelde vragen',
    fromCol: 'Van',
    airlineCol: 'Luchtvaartmaatschappij',
    toCol: 'Naar',
    durationCol: 'Duur',
    frequencyCol: 'Frequentie',
    holidaysFrom: 'Vakantie vanaf',
    otherMarkets: 'Alanya Vakantie voor andere Markten',
  },
};

// ── Getter ───────────────────────────────────────────────────────────

export function getNationalityPage(slug: string): NationalityPage | undefined {
  return NATIONALITY_PAGES.find(page => page.slug === slug);
}