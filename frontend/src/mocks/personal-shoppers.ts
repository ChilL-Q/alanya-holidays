export interface PersonalShopper {
  id: string;
  name: string;
  specialty: string;
  description: string;
  pricePerHour: number;
  currency: string;
  minHours: number;
  includes: string[];
  areas: string[];
  style: string;
  rating: number;
  reviewCount: number;
  image: string;
  featured: boolean;
  languages: string[];
}

export const shopperStyles = [
  { id: "all", name: "All Shoppers", icon: "ri-shopping-bag-3-line" },
  { id: "fashion", name: "Fashion & Design", icon: "ri-t-shirt-line" },
  { id: "artisan", name: "Artisan & Handicrafts", icon: "ri-paint-brush-line" },
  { id: "luxury", name: "Luxury & Designer", icon: "ri-vip-diamond-line" },
  { id: "home", name: "Home & Interiors", icon: "ri-home-smile-line" },
];

export const personalShoppers: PersonalShopper[] = [
  {
    id: "shopper-001",
    name: "Leyla",
    specialty: "Turkish Fashion & Design",
    description: "Leyla is an Istanbul-trained stylist who moved to Alanya to escape the city but kept her finger on the pulse of Turkish fashion. She knows every atelier, boutique, and emerging designer worth visiting along the coast. Her specialty is helping visitors build a capsule wardrobe of unique Turkish pieces — hand-loomed silk scarves from Hatay, leather sandals from Gaziantep workshops, linen resort wear from Bodrum designers, and jewellery from Istanbul's Grand Bazaar artisans. Leyla also offers a pre-arrival consultation so she can map out a route perfectly tailored to your taste before you even land.",
    pricePerHour: 80,
    currency: "EUR",
    minHours: 3,
    includes: ["Pre-arrival style consultation", "Boutique route planning", "Language interpretation", "Insider pricing at partner shops", "Refreshment breaks", "Post-tour digital lookbook"],
    areas: ["Designer boutiques", "Turkish fashion ateliers", "Handcrafted accessories", "Resort wear", "Jewellery"],
    style: "Curated Turkish Elegance",
    rating: 4.9,
    reviewCount: 41,
    image: "https://readdy.ai/api/search-image?query=Elegant%20Turkish%20woman%20in%20her%20late%20thirties%20with%20chic%20dark%20bob%20hairstyle%20wearing%20a%20stylish%20cream%20linen%20blazer%20and%20tailored%20trousers%20standing%20in%20a%20beautiful%20boutique%20filled%20with%20colorful%20textiles%20and%20fashion%20pieces%20warm%20natural%20lighting%20sophisticated%20personal%20shopper%20lifestyle%20portrait%20photography%20high%20detail&width=600&height=600&seq=shopper-leyla-001&orientation=squarish",
    featured: true,
    languages: ["Turkish", "English", "French"],
  },
  {
    id: "shopper-002",
    name: "Mustafa",
    specialty: "Turkish Carpets & Artisan Crafts",
    description: "Mustafa comes from a family that has been weaving carpets in central Anatolia for five generations. He doesn't just take you shopping — he educates you. By the end of a morning with Mustafa, you'll understand the difference between a Hereke silk and a Kayseri wool, know how to spot natural versus synthetic dyes, and have learned the meaning behind the motifs woven into every piece. His relationships with Alanya's most reputable dealers mean you see the finest pieces at fair prices — and his gentle, pressure-free approach means you'll never feel rushed into a purchase.",
    pricePerHour: 65,
    currency: "EUR",
    minHours: 2,
    includes: ["Carpet & kilim education session", "Dealer introductions", "Price negotiation assistance", "Shipping & export guidance", "Language interpretation", "Certificate of authenticity verification"],
    areas: ["Handwoven Turkish carpets", "Vintage kilims", "Ceramics & pottery", "Copper & brass work", "Calligraphy & miniature art"],
    style: "Cultural Heritage Expert",
    rating: 5.0,
    reviewCount: 53,
    image: "https://readdy.ai/api/search-image?query=Turkish%20man%20in%20his%20late%20forties%20with%20kind%20wise%20eyes%20and%20salt-and-pepper%20beard%20wearing%20a%20smart%20casual%20linen%20jacket%20standing%20in%20a%20traditional%20carpet%20shop%20surrounded%20by%20hanging%20handwoven%20Turkish%20kilims%20and%20carpets%20in%20rich%20reds%20and%20blues%20warm%20ambient%20lighting%20authentic%20artisan%20setting%20cultural%20heritage%20portrait%20photography&width=600&height=600&seq=shopper-mustafa-002&orientation=squarish",
    featured: true,
    languages: ["Turkish", "English", "German", "Arabic"],
  },
  {
    id: "shopper-003",
    name: "Aslı",
    specialty: "Luxury & Designer Labels",
    description: "Aslı is the former personal shopper for a VIP concierge service in Dubai who brought her black book of luxury contacts back to the Turkish Riviera. She has direct relationships with boutiques in Antalya's luxury malls, can arrange private after-hours shopping at designer stores, and knows exactly which pieces from the new season collections have just arrived. For clients seeking truly rare items — limited edition watches, heritage jewellery, or bespoke leather goods — Aslı can source pieces from Istanbul and have them delivered within 48 hours. Her eye is sharp, her taste is impeccable, and her honesty (she will absolutely tell you if something doesn't suit you) is genuinely refreshing.",
    pricePerHour: 120,
    currency: "EUR",
    minHours: 3,
    includes: ["Pre-trip wishlist consultation", "VIP boutique access", "After-hours shopping (on request)", "Style advisory & honest feedback", "Refreshment & champagne service", "Post-tour digital lookbook"],
    areas: ["International designer labels", "Fine jewellery & watches", "Luxury leather goods", "Couture & bespoke", "Exclusive Turkish designers"],
    style: "International Luxury Curator",
    rating: 4.8,
    reviewCount: 27,
    image: "https://readdy.ai/api/search-image?query=Sophisticated%20Turkish%20woman%20in%20her%20early%20forties%20with%20sleek%20pulled-back%20dark%20hair%20wearing%20an%20impeccably%20tailored%20black%20jumpsuit%20and%20gold%20accessories%20standing%20in%20a%20high-end%20luxury%20boutique%20with%20designer%20handbags%20and%20clothing%20displays%20behind%20her%20cool%20confident%20expression%20luxury%20lifestyle%20portrait%20photography%20high%20detail&width=600&height=600&seq=shopper-asli-003&orientation=squarish",
    featured: true,
    languages: ["Turkish", "English", "Arabic"],
  },
  {
    id: "shopper-004",
    name: "Zeynep",
    specialty: "Home & Interior Design",
    description: "Zeynep is an interior designer by trade who discovered that visitors to Alanya often fall in love with Turkish home decor and want to bring a piece of it back. She curates shopping routes through the best homeware stores, ceramic workshops, and antique dealers in the region — from hand-painted İznik tiles and mosaic lanterns to reclaimed Ottoman furniture and artisan textiles. Zeynep also handles shipping logistics, so that six-piece ceramic set you fell in love with arrives safely at your home, not in a thousand pieces. Several villa owners in Alanya have furnished their entire properties through her.",
    pricePerHour: 75,
    currency: "EUR",
    minHours: 3,
    includes: ["Home style consultation", "Route planning by decor theme", "Shipping & logistics coordination", "Price negotiation assistance", "Language interpretation", "Photography of pieces for reference"],
    areas: ["Ceramics & tiles", "Textiles & soft furnishings", "Antique furniture", "Lighting & lanterns", "Art & wall decor"],
    style: "Mediterranean Interior Curation",
    rating: 4.7,
    reviewCount: 19,
    image: "https://readdy.ai/api/search-image?query=Stylish%20Turkish%20woman%20in%20her%20mid%20thirties%20with%20wavy%20brown%20hair%20and%20a%20warm%20smile%20wearing%20a%20cream%20blouse%20standing%20in%20a%20beautifully%20decorated%20interior%20design%20showroom%20filled%20with%20Turkish%20ceramics%20mosaic%20lamps%20and%20artisan%20furniture%20soft%20natural%20light%20elegant%20home%20decor%20setting%20lifestyle%20portrait%20photography%20high%20detail&width=600&height=600&seq=shopper-zeynep-004&orientation=squarish",
    featured: false,
    languages: ["Turkish", "English"],
  },
  {
    id: "shopper-005",
    name: "Barış",
    specialty: "Food & Gourmet Market Tours",
    description: "Barış runs the most entertaining shopping experience on the coast — a guided tour through Alanya's markets, spice bazaars, and gourmet food shops that is equal parts culinary education, cultural immersion, and comedy show. He'll teach you how to judge olive oil by its colour and aroma, how to pick the sweetest Turkish delight (hint: it's all about the rosewater ratio), which spice blends to bring home for your own kitchen, and which cheese vendor has been using the same family recipe since 1923. All tastings are included, and Barış sends you home with a personalised recipe book of the dishes you sampled.",
    pricePerHour: 55,
    currency: "EUR",
    minHours: 2,
    includes: ["All food & drink tastings", "Market navigation guide", "Spice & ingredient education", "Personalised recipe book", "Cooler bag for purchases", "Language interpretation"],
    areas: ["Spice bazaars", "Fresh produce markets", "Cheese & dairy shops", "Olive oil producers", "Turkish delight & sweets", "Tea & coffee merchants"],
    style: "Gourmet Market Explorer",
    rating: 4.9,
    reviewCount: 36,
    image: "https://readdy.ai/api/search-image?query=Charismatic%20Turkish%20man%20in%20his%20early%20forties%20with%20a%20warm%20laugh%20and%20salt-and-pepper%20stubble%20wearing%20a%20casual%20chambray%20shirt%20standing%20in%20a%20vibrant%20Turkish%20spice%20market%20stall%20surrounded%20by%20colorful%20mounds%20of%20spices%20dried%20herbs%20and%20Turkish%20delight%20bright%20natural%20light%20bustling%20market%20atmosphere%20food%20culture%20portrait%20photography%20high%20detail&width=600&height=600&seq=shopper-baris-005&orientation=squarish",
    featured: false,
    languages: ["Turkish", "English", "Dutch"],
  },
  {
    id: "shopper-006",
    name: "Sibel",
    specialty: "Jewellery & Accessories",
    description: "Sibel spent a decade as a jewellery buyer for a major Istanbul department store before moving to Alanya, and her eye for craftsmanship is extraordinary. She focuses exclusively on independent Turkish jewellery designers — goldsmiths in the Grand Bazaar, silver artisans in Kapalıçarşı, and contemporary designers blending Ottoman motifs with modern minimalism. Whether you're looking for an engagement ring, a statement necklace, or simply a beautiful pair of earrings to remember your trip by, Sibel's curated selection will be unlike anything you'd find on your own. She also offers virtual consultations for custom pieces made to order.",
    pricePerHour: 90,
    currency: "EUR",
    minHours: 2,
    includes: ["Jewellery style consultation", "Designer introductions", "Custom order facilitation", "Authenticity & hallmark verification", "Language interpretation", "Post-purchase care guide"],
    areas: ["Fine gold jewellery", "Artisan silver", "Semi-precious stones", "Contemporary Turkish design", "Ottoman-inspired pieces", "Custom commissions"],
    style: "Jewellery Connoisseur",
    rating: 4.8,
    reviewCount: 23,
    image: "https://readdy.ai/api/search-image?query=Elegant%20Turkish%20woman%20in%20her%20late%20thirties%20with%20sophisticated%20style%20wearing%20a%20simple%20black%20dress%20and%20a%20striking%20statement%20necklace%20standing%20in%20an%20intimate%20jewellery%20atelier%20with%20display%20cases%20of%20gold%20and%20silver%20pieces%20soft%20warm%20boutique%20lighting%20refined%20aesthetic%20luxury%20shopping%20portrait%20photography%20high%20detail&width=600&height=600&seq=shopper-sibel-006&orientation=squarish",
    featured: false,
    languages: ["Turkish", "English"],
  },
];