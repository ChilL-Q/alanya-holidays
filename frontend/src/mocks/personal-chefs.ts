export interface PersonalChef {
  id: string;
  name: string;
  specialty: string;
  location: string;
  description: string;
  pricePerPerson: number;
  currency: string;
  priceIncludes: string[];
  cuisines: string[];
  menuStyle: string;
  duration: string;
  experience: string;
  language: string[];
  rating: number;
  reviewCount: number;
  image: string;
  featured: boolean;
  groupSize: string;
}

export const chefStyles = [
  { id: "all", name: "All Chefs", icon: "ri-restaurant-2-line" },
  { id: "turkish", name: "Turkish & Anatolian", icon: "ri-bowl-line" },
  { id: "mediterranean", name: "Mediterranean", icon: "ri-water-flash-line" },
  { id: "fusion", name: "Fusion & Fine Dining", icon: "ri-star-line" },
  { id: "private-dinner", name: "Private Dinners", icon: "ri-moon-clear-line" },
];

export const personalChefs: PersonalChef[] = [
  {
    id: "chef-001",
    name: "Chef Deniz Yılmaz",
    specialty: "Turkish & Anatolian",
    location: "Alanya City Center",
    description: "Chef Deniz grew up in her grandmother's kitchen in Gaziantep — the culinary capital of Turkey — and brings generations of Anatolian cooking wisdom to your villa or yacht. Her multi-course feasts are a journey through Turkey's regions: Gaziantep kebabs, Aegean olive oil dishes, Black Sea cornbread, and İskenderun seafood. Every herb, spice, and technique tells a story. She arrives with her own copper pots, handwoven linens, and a smile that makes you feel like family.",
    pricePerPerson: 85,
    currency: "EUR",
    priceIncludes: ["Multi-course menu", "All ingredients", "Kitchen equipment", "Table setting & linens", "Kitchen clean-up", "Wine pairing suggestions"],
    cuisines: ["Turkish", "Anatolian", "Ottoman", "Aegean"],
    menuStyle: "Multi-Course Feast",
    duration: "4–6 hours",
    experience: "18+ years",
    language: ["Turkish", "English", "German"],
    rating: 4.9,
    reviewCount: 67,
    image: "https://readdy.ai/api/search-image?query=Turkish%20female%20chef%20in%20her%20late%20forties%20with%20warm%20smile%20and%20dark%20hair%20in%20loose%20bun%20wearing%20traditional%20embroidered%20apron%20standing%20in%20bright%20villa%20kitchen%20surrounded%20by%20copper%20pots%20and%20fresh%20Mediterranean%20vegetables%20herbs%20hanging%20from%20rack%20soft%20natural%20daylight%20culinary%20lifestyle%20portrait%20photography%20genuine%20expression%20high%20detail&width=600&height=600&seq=chef-deniz-001&orientation=squarish",
    featured: true,
    groupSize: "2–12 guests",
  },
  {
    id: "chef-002",
    name: "Chef Marco Santini",
    specialty: "Italian Mediterranean",
    location: "Mahmutlar, Alanya",
    description: "Chef Marco left a bustling trattoria in Bologna to bring authentic Italian cooking to the Turkish Riviera — and his regulars followed him here. His handmade pasta (rolled fresh on your countertop), wood-fired focaccia, and slow-simmered ragù have become legendary among Alanya's villa-dwelling visitors. Marco sings while he cooks, pours generous glasses of wine from his personal cellar, and treats every dinner like a gathering of old friends. His tiramisu has been known to reduce guests to tears of joy.",
    pricePerPerson: 95,
    currency: "EUR",
    priceIncludes: ["4-course Italian menu", "Handmade pasta", "All ingredients", "Kitchen clean-up", "Wine from personal cellar", "Table setting"],
    cuisines: ["Italian", "Mediterranean", "European"],
    menuStyle: "Four-Course Dinner",
    duration: "4–5 hours",
    experience: "22+ years",
    language: ["Italian", "English", "Turkish (basic)"],
    rating: 5.0,
    reviewCount: 43,
    image: "https://readdy.ai/api/search-image?query=Italian%20male%20chef%20in%20his%20fifties%20with%20salt%20and%20pepper%20hair%20and%20warm%20expressive%20face%20wearing%20casual%20white%20chef%20coat%20with%20rolled-up%20sleeves%20holding%20a%20wooden%20board%20with%20fresh%20handmade%20pasta%20rustic%20kitchen%20background%20natural%20daylight%20genuine%20joyful%20expression%20culinary%20portrait%20photography%20high%20detail&width=600&height=600&seq=chef-marco-002&orientation=squarish",
    featured: true,
    groupSize: "2–8 guests",
  },
  {
    id: "chef-003",
    name: "Chef Aylin Koç",
    specialty: "Modern Aegean Fusion",
    location: "Alanya Marina Area",
    description: "Trained at Le Cordon Bleu in Paris before returning to her Turkish roots, Chef Aylin creates dishes that exist at the intersection of French technique and Aegean ingredients. Think sea bass en papillote with sumac and wild oregano, or lavender-infused crème brûlée with Antep pistachios. She sources seafood directly from Alanya's morning fish market and grows her own edible flowers for plating. Aylin is also a brilliant host — her pre-dinner mezze masterclass has guests rolling vine leaves within the first hour.",
    pricePerPerson: 110,
    currency: "EUR",
    priceIncludes: ["5-course tasting menu", "Pre-dinner mezze class", "All ingredients", "Kitchen equipment", "Kitchen clean-up", "Wine pairing", "Edible flower garnishes"],
    cuisines: ["Aegean", "French-Mediterranean", "Fusion"],
    menuStyle: "Tasting Menu",
    duration: "5–6 hours",
    experience: "14+ years",
    language: ["Turkish", "English", "French"],
    rating: 4.9,
    reviewCount: 31,
    image: "https://readdy.ai/api/search-image?query=Elegant%20Turkish%20female%20chef%20in%20her%20late%20thirties%20with%20stylish%20dark%20hair%20in%20a%20neat%20bun%20wearing%20a%20fitted%20white%20chef%20coat%20with%20subtle%20grey%20piping%20standing%20in%20modern%20kitchen%20plating%20a%20beautiful%20dish%20with%20tweezers%20and%20edible%20flowers%20soft%20natural%20light%20refined%20artistic%20expression%20culinary%20portrait%20photography%20high%20detail&width=600&height=600&seq=chef-aylin-003&orientation=squarish",
    featured: true,
    groupSize: "2–6 guests",
  },
  {
    id: "chef-004",
    name: "Chef Yusuf Demir",
    specialty: "Wood-Fire & Grill",
    location: "Tosmur, Alanya",
    description: "Chef Yusuf is the man you call when you want the smell of charcoal-grilled lamb, the sight of flames licking a cast-iron pan, and the taste of food cooked with primal mastery. A former competitive barbecue pitmaster who found his way back to Anatolian grilling traditions, Yusuf brings a custom portable wood-fire setup to your villa. His signature dishes include whole grilled sea bass stuffed with wild herbs, 24-hour marinated lamb şiş, and wood-fired pide with spicy sucuk and kaşar cheese. He'll even give the kids a flatbread-making lesson while the coals heat up.",
    pricePerPerson: 75,
    currency: "EUR",
    priceIncludes: ["Wood-fire grill setup", "Full grill menu", "All ingredients", "Charcoal & wood", "Table setting", "Kitchen clean-up", "Flatbread-making activity"],
    cuisines: ["Turkish", "Anatolian Grill", "BBQ"],
    menuStyle: "Grill Feast",
    duration: "4–5 hours",
    experience: "12+ years",
    language: ["Turkish", "English"],
    rating: 4.8,
    reviewCount: 52,
    image: "https://readdy.ai/api/search-image?query=Turkish%20male%20chef%20in%20his%20early%20forties%20with%20tanned%20skin%20and%20short%20dark%20beard%20wearing%20a%20canvas%20apron%20over%20a%20casual%20linen%20shirt%20standing%20beside%20a%20smoking%20wood-fire%20grill%20outdoors%20with%20flames%20and%20grilled%20meats%20visible%20golden%20evening%20light%20terrace%20setting%20with%20Mediterranean%20background%20authentic%20outdoor%20cooking%20lifestyle%20portrait%20photography&width=600&height=600&seq=chef-yusuf-004&orientation=squarish",
    featured: false,
    groupSize: "4–16 guests",
  },
  {
    id: "chef-005",
    name: "Chef Sofia Papadakis",
    specialty: "Greek & Eastern Mediterranean",
    location: "Avsallar, Alanya",
    description: "Chef Sofia's cooking tastes like a summer evening on a Greek island — bright, herbaceous, lemon-drenched, and deeply satisfying. Born on Crete and now based in Alanya for the past eight years, she brings the best of both shores to your table. Her mezze spreads are legendary: taramasalata whipped to cloud-like lightness, fava with caramelized onions, grilled halloumi with fig jam, and slow-cooked lamb kleftiko that falls off the bone. Sofia is also a wonderful storyteller — every dish comes with a tale of its island of origin.",
    pricePerPerson: 80,
    currency: "EUR",
    priceIncludes: ["Mezze spread + main", "All ingredients", "Kitchen equipment", "Table setting", "Kitchen clean-up", "Recipe cards to take home"],
    cuisines: ["Greek", "Cretan", "Eastern Mediterranean"],
    menuStyle: "Mezze & Main",
    duration: "4–5 hours",
    experience: "16+ years",
    language: ["Greek", "English", "Turkish"],
    rating: 4.8,
    reviewCount: 38,
    image: "https://readdy.ai/api/search-image?query=Greek%20female%20chef%20in%20her%20mid%20forties%20with%20sun-kissed%20olive%20skin%20and%20curly%20brown%20hair%20tied%20in%20a%20loose%20bun%20wearing%20a%20light%20blue%20linen%20apron%20over%20a%20white%20blouse%20standing%20at%20a%20rustic%20table%20covered%20with%20colorful%20mezze%20dishes%20olives%20fresh%20bread%20and%20herbs%20Mediterranean%20terrace%20background%20warm%20natural%20light%20joyful%20expression%20culinary%20lifestyle%20portrait%20photography&width=600&height=600&seq=chef-sofia-005&orientation=squarish",
    featured: false,
    groupSize: "2–10 guests",
  },
  {
    id: "chef-006",
    name: "Chef Levent Arslan",
    specialty: "Plant-Forward & Dietary Specialist",
    location: "Oba, Alanya",
    description: "Chef Levent is the answer to every dietary restriction that would normally make group dining a logistical nightmare. Vegan, gluten-free, halal, keto, nut-free, FODMAP — he treats them not as limitations but as creative briefs. A former nutritionist who retrained as a chef, Levent creates vibrant, flavour-packed plant-forward menus that omnivores genuinely prefer over the meat option. His roasted beetroot carpaccio, cashew labneh with za'atar, and aquafaba chocolate mousse have converted more skeptics than he can count. All produce sourced from organic farms in the Taurus foothills.",
    pricePerPerson: 90,
    currency: "EUR",
    priceIncludes: ["Personalised menu consultation", "Multi-course menu", "All organic ingredients", "Kitchen equipment", "Kitchen clean-up", "Dietary accommodation for all guests"],
    cuisines: ["Plant-Forward", "Mediterranean", "Middle Eastern", "Health-Focused"],
    menuStyle: "Tailored Multi-Course",
    duration: "4–5 hours",
    experience: "10+ years",
    language: ["Turkish", "English", "Dutch"],
    rating: 4.7,
    reviewCount: 25,
    image: "https://readdy.ai/api/search-image?query=Turkish%20male%20chef%20in%20his%20late%20thirties%20with%20a%20neatly%20trimmed%20beard%20and%20thoughtful%20expression%20wearing%20a%20green%20apron%20over%20a%20white%20shirt%20standing%20in%20a%20bright%20kitchen%20surrounded%20by%20colorful%20fresh%20vegetables%20herbs%20and%20plant-based%20ingredients%20on%20wooden%20boards%20soft%20natural%20daylight%20health-conscious%20modern%20culinary%20portrait%20photography&width=600&height=600&seq=chef-levent-006&orientation=squarish",
    featured: false,
    groupSize: "2–8 guests",
  },
];