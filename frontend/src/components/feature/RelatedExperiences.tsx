import { Link } from "react-router-dom";

export interface RelatedExperience {
  key: string;
  icon: string;
  title: string;
  tagline: string;
  link: string;
  image: string;
}

const allExperiences: RelatedExperience[] = [
  {
    key: "yacht-charters",
    icon: "ri-sailboat-line",
    title: "Private Yacht Charters",
    tagline: "Cruise the Turquoise Coast on a private gulet or luxury yacht",
    link: "/yacht-charters",
    image: "https://readdy.ai/api/search-image?query=Luxury%20yacht%20cruising%20along%20dramatic%20Mediterranean%20coastline%20at%20golden%20hour%20Alanya%20castle%20on%20rocky%20peninsula%20silhouette%20warm%20amber%20sunlight%20reflecting%20on%20calm%20turquoise%20sea%20elegant%20wooden%20gulet%20with%20white%20sails%20unfurled%20breathtaking%20travel%20photography%20cinematic%20composition%20high%20detail&width=800&height=560&seq=related-yacht-01&orientation=landscape",
  },
  {
    key: "helicopter-tours",
    icon: "ri-flight-takeoff-line",
    title: "Helicopter Tours",
    tagline: "See Alanya Castle and the Taurus Mountains from above",
    link: "/helicopter-tours",
    image: "https://readdy.ai/api/search-image?query=Stunning%20aerial%20view%20from%20helicopter%20cockpit%20over%20Alanya%20coastline%20turquoise%20Mediterranean%20sea%20dramatic%20castle%20on%20rocky%20peninsula%20golden%20sunset%20sky%20clouds%20below%20breathtaking%20perspective%20adventure%20tourism%20editorial%20photography%20epic%20cinematic%20composition&width=800&height=560&seq=related-heli-01&orientation=landscape",
  },
  {
    key: "wine-tastings",
    icon: "ri-cup-line",
    title: "Private Wine Tastings",
    tagline: "Sommelier-led tastings of Anatolian wines with local pairings",
    link: "/wine-tastings",
    image: "https://readdy.ai/api/search-image?query=Elegant%20wine%20tasting%20scene%20in%20historic%20stone%20cellar%20warm%20candlelight%20rows%20of%20wine%20bottles%20in%20wooden%20racks%20six%20glasses%20of%20red%20and%20white%20wine%20on%20rustic%20oak%20table%20cheese%20board%20with%20grapes%20soft%20atmospheric%20lighting%20Anatolian%20vineyard%20setting%20editorial%20food%20photography%20rich%20warm%20tones&width=800&height=560&seq=related-wine-01&orientation=landscape",
  },
  {
    key: "villa-stays",
    icon: "ri-hotel-bed-line",
    title: "Boutique Villa Stays",
    tagline: "Handpicked luxury villas with private pools and sea views",
    link: "/villa-stays",
    image: "https://readdy.ai/api/search-image?query=Luxury%20Mediterranean%20villa%20with%20infinity%20pool%20overlooking%20turquoise%20sea%20at%20golden%20hour%20white%20modern%20architecture%20surrounded%20by%20palm%20trees%20and%20bougainvillea%20panoramic%20coastal%20view%20Alanya%20Turkey%20dream%20vacation%20setting%20warm%20light%20elegant%20atmosphere%20editorial%20real%20estate%20photography&width=800&height=560&seq=related-villa-01&orientation=landscape",
  },
  {
    key: "hammam-spa",
    icon: "ri-heart-pulse-line",
    title: "Traditional Hammam & Spa",
    tagline: "Turkish bath experience with aromatherapy massage in 5-star setting",
    link: "/hammam-spa",
    image: "https://readdy.ai/api/search-image?query=Luxurious%20traditional%20Turkish%20hammam%20interior%20with%20white%20marble%20heated%20gobek%20tasi%20platform%20steam%20rising%20softly%20through%20beams%20of%20light%20from%20star%20shaped%20dome%20windows%20brass%20bowls%20with%20olive%20oil%20soaps%20warm%20serene%20atmosphere%20authentic%20spa%20editorial%20photography%20misty%20ethereal%20mood&width=800&height=560&seq=related-spa-01&orientation=landscape",
  },
  {
    key: "photography-excursions",
    icon: "ri-camera-lens-line",
    title: "Photography Excursions",
    tagline: "Guided photo walks through Alanya's most photogenic spots",
    link: "/photography-excursions",
    image: "https://readdy.ai/api/search-image?query=Professional%20photographer%20capturing%20golden%20hour%20scene%20in%20Alanya%20old%20town%20narrow%20cobblestone%20alley%20with%20colorful%20Ottoman%20houses%20bougainvillea%20flowers%20warm%20sunset%20light%20streaming%20through%20creative%20composition%20behind%20the%20scenes%20travel%20editorial%20photography%20artistic%20atmosphere&width=800&height=560&seq=related-photo-01&orientation=landscape",
  },
  {
    key: "golf-vacations",
    icon: "ri-golf-ball-line",
    title: "Luxury Golf Vacations",
    tagline: "Championship courses in Belek with five-star all-inclusive stays",
    link: "/golf-vacations",
    image: "https://readdy.ai/api/search-image?query=Championship%20golf%20course%20at%20golden%20hour%20with%20perfectly%20manicured%20fairways%20winding%20through%20Mediterranean%20pine%20forests%20dramatic%20white%20sand%20bunkers%20pristine%20greens%20Taurus%20Mountains%20on%20horizon%20luxury%20resort%20clubhouse%20Belek%20Antalya%20Turkey%20editorial%20golf%20photography%20epic%20landscape%20composition%20high%20detail&width=800&height=560&seq=related-golf-01&orientation=landscape",
  },
  {
    key: "private-jets",
    icon: "ri-plane-line",
    title: "Private Jet Charters",
    tagline: "On-demand private jet charters across Turkey and the Mediterranean",
    link: "/private-jets",
    image: "https://readdy.ai/api/search-image?query=Luxurious%20private%20jet%20interior%20with%20cream%20leather%20seats%20and%20polished%20wood%20accents%20warm%20ambient%20lighting%20champagne%20flutes%20on%20side%20table%20window%20view%20of%20Mediterranean%20coastline%20at%20golden%20hour%20sophisticated%20aviation%20lifestyle%20editorial%20photography%20elegant%20refined%20atmosphere%20high%20detail&width=800&height=560&seq=related-jet-01&orientation=landscape",
  },
  {
    key: "personal-chefs",
    icon: "ri-restaurant-2-line",
    title: "Personal Chefs",
    tagline: "Private chef in your villa crafting seasonal Anatolian menus",
    link: "/personal-chefs",
    image: "https://readdy.ai/api/search-image?query=Professional%20chef%20in%20bright%20modern%20Mediterranean%20villa%20kitchen%20preparing%20gourmet%20dish%20with%20fresh%20local%20vegetables%20and%20seafood%20on%20marble%20countertop%20warm%20natural%20light%20streaming%20through%20large%20windows%20elegant%20plating%20food%20photography%20lifestyle%20editorial%20soft%20warm%20tones%20high%20detail&width=800&height=560&seq=related-chef-01&orientation=landscape",
  },
  {
    key: "personal-driver",
    icon: "ri-steering-2-line",
    title: "Personal Driver",
    tagline: "Chauffeured luxury vehicles for transfers and coastal excursions",
    link: "/personal-driver",
    image: "https://readdy.ai/api/search-image?query=Sleek%20black%20luxury%20sedan%20with%20professional%20chauffeur%20opening%20door%20on%20scenic%20Mediterranean%20coastal%20road%20turquoise%20sea%20in%20background%20golden%20hour%20sunlight%20palm%20trees%20elegant%20travel%20lifestyle%20photography%20sophisticated%20atmosphere%20Alanya%20Turkey%20high%20detail&width=800&height=560&seq=related-driver-01&orientation=landscape",
  },
  {
    key: "personal-shopper",
    icon: "ri-shopping-bag-3-line",
    title: "Personal Shopper",
    tagline: "Style consultant guiding you through Alanya's best boutiques",
    link: "/personal-shopper",
    image: "https://readdy.ai/api/search-image?query=Elegant%20boutique%20shopping%20scene%20in%20Alanya%20old%20town%20stylish%20woman%20browsing%20handcrafted%20Turkish%20textiles%20and%20ceramics%20warm%20ambient%20lighting%20colorful%20displays%20of%20artisan%20goods%20personal%20shopping%20experience%20editorial%20lifestyle%20photography%20sophisticated%20Mediterranean%20aesthetic%20high%20detail&width=800&height=560&seq=related-shop-01&orientation=landscape",
  },
];

interface RelatedExperiencesProps {
  currentPage: string;
}

export default function RelatedExperiences({ currentPage }: RelatedExperiencesProps) {
  const filtered = allExperiences.filter((exp) => exp.key !== currentPage);

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 py-16 md:py-20 bg-background-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 bg-white mb-5">
            <i className="ri-compass-3-line text-accent-500 text-sm"></i>
            <span className="text-sm font-medium text-foreground-700">You Might Also Like</span>
          </div>
          <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-3">Explore More Experiences</h2>
          <p className="text-foreground-500 text-sm md:text-base max-w-lg mx-auto">
            Discover other curated experiences along the Turkish Riviera — each one handpicked by our community.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {filtered.map((exp) => (
            <Link
              key={exp.key}
              to={exp.link}
              className="group bg-white rounded-2xl border border-background-200/70 hover:border-primary-200/60 overflow-hidden transition-all hover:-translate-y-1"
            >
              <div className="relative w-full h-40 md:h-44 overflow-hidden">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/60 via-foreground-950/10 to-transparent"></div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                    <i className={`${exp.icon} text-foreground-700 text-sm`}></i>
                  </div>
                  <span className="text-white text-sm font-semibold drop-shadow-sm">{exp.title}</span>
                </div>
              </div>
              <div className="p-4 md:p-5">
                <p className="text-sm text-foreground-500 leading-relaxed mb-3">{exp.tagline}</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary-600 group-hover:text-primary-700 transition-colors">
                  <span>Explore</span>
                  <i className="ri-arrow-right-line text-sm group-hover:translate-x-0.5 transition-transform"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}