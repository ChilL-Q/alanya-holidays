export interface BusinessReview {
  id: string;
  businessId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  visitType: string;
}

export const businessReviews: Record<string, BusinessReview[]> = {
  "biz-001": [
    {
      id: "rev-001",
      businessId: "biz-001",
      reviewerName: "Emma Lindström",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-18",
      title: "Best dining experience in Alanya, hands down",
      content: "We booked Kale Panorama for our anniversary dinner and it exceeded every expectation. The lamb tandir was melt-in-your-mouth tender, the meze platter was beautifully presented with incredible variety, and the view of the castle lit up at sunset was simply magical. Our waiter Mehmet was attentive without being intrusive and recommended a fantastic local wine. Not cheap, but worth every lira for a special occasion.",
      visitType: "Couples",
    },
    {
      id: "rev-002",
      businessId: "biz-001",
      reviewerName: "Marcus Weber",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-10",
      title: "Incredible views and even better food",
      content: "The terrace at Kale Panorama really lives up to its name — you can see the entire coastline stretching from the harbor to Cleopatra Beach. We went for lunch and it was equally stunning during daylight. The grilled sea bass was perfectly cooked with crispy skin, and the baklava for dessert was the best I've had anywhere in Turkey. Reservations are a must, especially for sunset seating.",
      visitType: "Friends",
    },
    {
      id: "rev-003",
      businessId: "biz-001",
      reviewerName: "Sofia Petrov",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 4,
      date: "2026-06-28",
      title: "Beautiful setting, slightly rushed service",
      content: "The food and location are absolutely five-star. The Ottoman-style interior is gorgeous and the terrace views are breathtaking. We had the mixed grill platter and it was excellent. Only giving 4 stars because the service felt a bit rushed — our mains arrived while we were still eating our starters. Still, I'd return in a heartbeat and recommend it to anyone visiting Alanya.",
      visitType: "Family",
    },
    {
      id: "rev-004",
      businessId: "biz-001",
      reviewerName: "James O'Connell",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-06-15",
      title: "A culinary journey through Ottoman cuisine",
      content: "This was the highlight of our two-week trip along the Turkish coast. The chef clearly takes immense pride in his craft — every dish was beautifully plated and the flavors were incredibly balanced. The stuffed eggplant with lamb (karniyarik) was divine. The house-made pomegranate sorbet between courses was a lovely touch. Pricey by Alanya standards but comparable to a nice restaurant in any European capital, and the quality is on that level.",
      visitType: "Couples",
    },
  ],
  "biz-002": [
    {
      id: "rev-005",
      businessId: "biz-002",
      reviewerName: "Lena Johansson",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-22",
      title: "The ultimate beach day experience",
      content: "Spent a full day at Cleopatra Beach Club and it was everything we hoped for. The sun loungers are super comfortable, the cabana service was attentive, and the wood-fired pizza was genuinely excellent — not just 'good for a beach club'. The DJ on Saturday created such a fun vibe without being too loud. The frozen mango daiquiri is a must-try. We'll be back every time we're in Alanya.",
      visitType: "Friends",
    },
    {
      id: "rev-006",
      businessId: "biz-002",
      reviewerName: "Thomas Nielsen",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 4,
      date: "2026-07-15",
      title: "Great vibe, kids loved the shallow water",
      content: "Brought our two young children here and it was perfect for families. The water is shallow for quite a distance so the kids could safely play while we relaxed. The kids menu was actually decent (not just sad chicken nuggets). Only minor complaint is that the lounge chairs fill up fast on weekends — get there before 10am to secure a good spot. The shower and changing facilities are clean and well-maintained.",
      visitType: "Family",
    },
    {
      id: "rev-007",
      businessId: "biz-002",
      reviewerName: "Chloe Martin",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-05",
      title: "Best cocktails on Cleopatra Beach",
      content: "We tried three different beach clubs along Cleopatra Beach and this one was by far the best. The cocktails were properly made with fresh ingredients (not pre-mix), the music was chill during the day, and the service was genuinely friendly rather than transactional. The sunset here is absolutely stunning — the whole beach turns golden. Pro tip: book the front-row cabanas in advance.",
      visitType: "Couples",
    },
  ],
  "biz-003": [
    {
      id: "rev-008",
      businessId: "biz-003",
      reviewerName: "Anna Kowalski",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-20",
      title: "The Turkish breakfast of your dreams",
      content: "I've had Turkish breakfast in Istanbul, Antalya, and Cappadocia — this one at Mezze Garden is honestly the best. Over 40 little dishes covering every inch of the table. The gözleme stuffed with spinach and cheese was incredible, made fresh by the loveliest village women right in the garden. The homemade sour cherry jam and clotted cream (kaymak) with honeycomb was a religious experience. Come hungry and plan to stay for two hours.",
      visitType: "Solo",
    },
    {
      id: "rev-009",
      businessId: "biz-003",
      reviewerName: "David Lindberg",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-12",
      title: "A hidden oasis in the old town",
      content: "Finding this place almost felt like discovering a secret. Tucked down a narrow lane in the old town, you walk through a small doorway into this lush garden courtyard with vines overhead and the sound of a fountain. The atmosphere is incredibly peaceful — a world away from the busy main streets. The menemen (Turkish scrambled eggs) was the best I've had. Such a perfect start to a day exploring the castle.",
      visitType: "Couples",
    },
    {
      id: "rev-010",
      businessId: "biz-003",
      reviewerName: "Fatima Al-Rashid",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-06-30",
      title: "Like eating in someone's beautiful garden",
      content: "This isn't just a café — it feels like you've been invited to eat in someone's lovingly tended garden. The ladies making gözleme are so warm and welcoming. Everything is made from scratch with obvious care. The olive selection alone was remarkable, with varieties I'd never tried before. We loved it so much we came back three times during our week in Alanya. Cash only though, so come prepared!",
      visitType: "Friends",
    },
  ],
  "biz-004": [
    {
      id: "rev-011",
      businessId: "biz-004",
      reviewerName: "Isabelle Moreau",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-15",
      title: "Pure Ottoman elegance, the most romantic hotel",
      content: "We stayed here for our honeymoon and it was absolutely perfect. Our room (the Rose Suite) had hand-painted ceiling tiles, an antique wooden bed, and a balcony overlooking the harbor. The rooftop infinity pool at sunset with a glass of champagne while the call to prayer echoed across the water — I'll never forget it. The staff arranged flowers, a private dinner on the rooftop, and even a couples hammam experience. Worth every euro.",
      visitType: "Couples",
    },
    {
      id: "rev-012",
      businessId: "biz-004",
      reviewerName: "Robert Chen",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 4,
      date: "2026-07-08",
      title: "Stunning building, minor room size issue",
      content: "The hotel itself is a work of art — the restoration of this Ottoman mansion is impeccable. Every corner is Instagram-worthy. The location can't be beat, literally steps from the harbor restaurants and the castle lift. Our room was beautifully decorated but a bit on the small side for a deluxe category. The breakfast was exceptional with local cheeses, fresh-baked simit, and made-to-order eggs. Staff were wonderfully helpful arranging a private boat tour.",
      visitType: "Couples",
    },
  ],
  "biz-006": [
    {
      id: "rev-013",
      businessId: "biz-006",
      reviewerName: "Mark Thompson",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-25",
      title: "The kids won't stop talking about the pirate ship",
      content: "Hands down the best day of our holiday. Our kids (7 and 9) were absolutely mesmerized by the pirate-themed boat — the crew dress up, there's sword-fighting shows, and the foam party on the deck was pure joy. But it's not just for kids — the swimming stops at Phosphorus Cave and Lovers Cave were stunning, and the lunch was way better than expected. Great value for a full day out. The crew are amazing with children.",
      visitType: "Family",
    },
    {
      id: "rev-014",
      businessId: "biz-006",
      reviewerName: "Nina Haugen",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 4,
      date: "2026-07-18",
      title: "Fun day on the water, great swimming spots",
      content: "We were a group of six friends and had a blast. The boat is proper pirate-themed and you can't miss it in the harbor. The swimming stops are the highlight — the water is unbelievably clear and the caves are fascinating. Lunch was grilled chicken, salad, and rice — simple but tasty. The only reason for 4 stars is that the music was a bit too loud at times. But overall, fantastic value and a really fun way to see the coastline.",
      visitType: "Friends",
    },
  ],
  "biz-008": [
    {
      id: "rev-015",
      businessId: "biz-008",
      reviewerName: "Sarah Mitchell",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-20",
      title: "Best hammam experience I've ever had",
      content: "I've been to hammams in Istanbul and Marrakech, and this one in Alanya was hands down the best. The building itself is stunning — a restored 16th-century hamam with gorgeous marble and a domed ceiling. The full package was about 2 hours: steam room, full body scrub (my skin has never felt so soft), foam massage that was pure bliss, and then an aromatherapy oil massage. The therapists are incredibly skilled. Left feeling like a new person.",
      visitType: "Solo",
    },
    {
      id: "rev-016",
      businessId: "biz-008",
      reviewerName: "Olga Kuznetsova",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-14",
      title: "A truly authentic Ottoman bath ritual",
      content: "This isn't a tourist trap spa — this is the real deal. The separate sections for men and women made us feel very comfortable. The ritual is exactly as it has been for centuries: warm room, hot room, scrub, foam, massage. The olive oil soap they use smells divine. My husband and I both went (separate sections) and we both came out glowing. Tip: don't wear makeup, and bring a hair tie. The warm marble slab you lie on is incredibly relaxing.",
      visitType: "Couples",
    },
  ],
  "biz-010": [
    {
      id: "rev-017",
      businessId: "biz-010",
      reviewerName: "Peter Larsson",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-10",
      title: "Made buying property in Turkey effortless",
      content: "As a foreigner, buying property in Turkey seemed daunting but Alanya Property Experts made the entire process smooth and transparent. Our agent, Deniz, showed us 12 properties over two days, patiently explaining the pros and cons of each area. They connected us with a great lawyer (Alanya Legal Consulting), handled the title deed transfer, and even helped set up utilities. Six months later, we're loving our sea-view apartment in Oba. Cannot recommend enough.",
      visitType: "Couples",
    },
    {
      id: "rev-018",
      businessId: "biz-010",
      reviewerName: "Hans Müller",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-06-28",
      title: "Professional, honest, and patient",
      content: "We spent months researching Alanya real estate online but nothing beats seeing properties in person. The team at Alanya Property Experts spent three full days with us, never pressured us once, and actually advised against one property that we were considering because of a planned construction nearby — that kind of honesty is rare. We ended up buying a villa in Konaklı and the after-sales support has been excellent. Special thanks to Deniz and the team.",
      visitType: "Family",
    },
  ],
  "biz-020": [
    {
      id: "rev-019",
      businessId: "biz-020",
      reviewerName: "Alex Kravchenko",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-22",
      title: "Incredible dive sites and top-notch instruction",
      content: "Did my PADI Open Water certification here over 3 days and it was one of the best experiences of my life. My instructor, Kemal, was patient, thorough, and made me feel completely safe throughout. The dive sites are stunning — we saw octopus, moray eels, and swam through a beautiful underwater cave system. Visibility was easily 25-30 meters. The equipment was all in excellent condition. The boat is comfortable and the lunch included was solid.",
      visitType: "Solo",
    },
    {
      id: "rev-020",
      businessId: "biz-020",
      reviewerName: "Maria Santos",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-15",
      title: "Best diving in the Mediterranean, small groups",
      content: "I've dived in Egypt, Greece, and Croatia — and the diving in Alanya with this center was my favorite Mediterranean experience. What sets them apart is the small group sizes (max 4 divers per guide) and the variety of sites. The shipwreck dive was incredible — you can see the entire boat sitting on the seafloor. The cave formations are dramatic and filled with marine life. I extended my stay just to dive two more days. Fantastic operation.",
      visitType: "Solo",
    },
  ],
  "biz-024": [
    {
      id: "rev-021",
      businessId: "biz-024",
      reviewerName: "Mehmet Yıldırım",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-24",
      title: "The Adana kebab here is legendary for a reason",
      content: "I'm Turkish and I've eaten kebab all over the country. Sultan's Adana kebab is genuinely in the top 5 I've ever had. The meat is perfectly spiced, the charcoal grill gives it that unmistakable smoky flavor, and the lavaş bread is baked fresh in a stone oven right in front of you. The İskender is also incredible — generous portions of döner on crispy pide bread, drenched in hot tomato sauce and butter. This is where locals eat, and for good reason.",
      visitType: "Friends",
    },
    {
      id: "rev-022",
      businessId: "biz-024",
      reviewerName: "Laura Schmidt",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 4,
      date: "2026-07-18",
      title: "No-frills, fantastic food at great prices",
      content: "Don't expect fancy — this is a proper local kebab house with plastic chairs and fluorescent lights, but the food is outstanding. Two people can eat like kings for under 400 TL including drinks. The chicken şiş was juicy and charred perfectly, the Adana had just the right kick of spice, and the fresh ayran was the perfect accompaniment. The lines at dinner are no joke — either come early (before 7pm) or be prepared to wait 15-20 minutes. Totally worth it.",
      visitType: "Couples",
    },
  ],
  "biz-007": [
    {
      id: "rev-023",
      businessId: "biz-007",
      reviewerName: "Tom Bradley",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-19",
      title: "Best day of our holiday — epic adventure",
      content: "The Taurus Mountain Safari was absolutely epic. Our guide Ali was fantastic — funny, knowledgeable, and genuinely passionate about the region. We went river crossing in the jeep, swam in the most beautiful natural pool under a waterfall, visited a Yörük village where we had tea with a lovely family, and the BBQ lunch in the pine forest was delicious. The views from the mountain roads are breathtaking. Bring a waterproof bag for your phone and be prepared to get wet and dusty!",
      visitType: "Friends",
    },
  ],
  "biz-017": [
    {
      id: "rev-024",
      businessId: "biz-017",
      reviewerName: "Yuki Tanaka",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-21",
      title: "The most beautiful view of Alanya at night",
      content: "Rooftop 42 has the single best view of Alanya Castle I've ever seen. At night when the castle is illuminated, it's absolutely magical. The cocktails are crafted with real care — I had the Alanya Sunset (passionfruit, pomegranate, and local gin) and it was divine. The live saxophone on Thursday evening created such a sophisticated atmosphere. The tapas menu is small but every dish was excellent. Dress nicely — this is an upscale spot and the crowd reflects that.",
      visitType: "Couples",
    },
  ],
  "biz-009": [
    {
      id: "rev-025",
      businessId: "biz-009",
      reviewerName: "Katherine Wright",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-16",
      title: "My new smile is perfect — worth the trip from the UK",
      content: "I traveled from Manchester specifically for dental work at Mediterranean Smile and it was the best decision ever. The clinic is immaculate and modern, the 3D scanning technology is impressive, and Dr. Yılmaz was incredibly thorough and caring. I had 8 zirconium crowns and the results are stunning — perfectly natural looking. The coordinator arranged my hotel and transfers, and the aftercare instructions were very detailed. Saved about 60% compared to UK prices for the same quality.",
      visitType: "Solo",
    },
  ],
  "biz-005": [
    {
      id: "rev-026",
      businessId: "biz-005",
      reviewerName: "Claudia Weber",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 4,
      date: "2026-07-12",
      title: "Great family resort, kids club is outstanding",
      content: "We spent 10 days at Villa Sevilla with our 4 and 6 year olds and had a wonderful family holiday. The kids club is genuinely excellent — our children begged to go every day and the activities were creative and well-supervised. The water slides, splash park, and family pool kept everyone entertained. The buffet had good variety though the à la carte restaurants are a big step up — book those in advance. The grounds are gorgeous and well-maintained. A solid 4-star experience.",
      visitType: "Family",
    },
  ],
  "biz-023": [
    {
      id: "rev-027",
      businessId: "biz-023",
      reviewerName: "Felix Andersson",
      reviewerAvatar: "/images/placeholder-business.svg",
      rating: 5,
      date: "2026-07-23",
      title: "Flying over Alanya was the most incredible feeling",
      content: "I was honestly terrified before the paragliding flight but my pilot Cem was so calm and reassuring that by the time we launched, I felt completely safe. The 25-minute flight over the Alanya coastline was the most incredible experience — you can see the entire peninsula, the castle, Cleopatra Beach stretching for miles, and the Taurus Mountains behind. The GoPro photos and video came out amazing. This is a must-do in Alanya, even if you're scared of heights like me!",
      visitType: "Solo",
    },
  ],
};

export function getReviewsForBusiness(businessId: string): BusinessReview[] {
  return businessReviews[businessId] || [];
}

export function getReviewStats(businessId: string) {
  const reviews = businessReviews[businessId] || [];
  if (reviews.length === 0) {
    return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
  }
  const total = reviews.length;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    distribution[r.rating - 1]++;
  });
  return { average, total, distribution };
}