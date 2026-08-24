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
    image: "/images/placeholder-business.svg",
  },
  {
    key: "helicopter-tours",
    icon: "ri-flight-takeoff-line",
    title: "Helicopter Tours",
    tagline: "See Alanya Castle and the Taurus Mountains from above",
    link: "/helicopter-tours",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "wine-tastings",
    icon: "ri-cup-line",
    title: "Private Wine Tastings",
    tagline: "Sommelier-led tastings of Anatolian wines with local pairings",
    link: "/wine-tastings",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "villa-stays",
    icon: "ri-hotel-bed-line",
    title: "Boutique Villa Stays",
    tagline: "Handpicked luxury villas with private pools and sea views",
    link: "/villa-stays",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "hammam-spa",
    icon: "ri-heart-pulse-line",
    title: "Traditional Hammam & Spa",
    tagline: "Turkish bath experience with aromatherapy massage in 5-star setting",
    link: "/hammam-spa",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "photography-excursions",
    icon: "ri-camera-lens-line",
    title: "Photography Excursions",
    tagline: "Guided photo walks through Alanya's most photogenic spots",
    link: "/photography-excursions",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "golf-vacations",
    icon: "ri-golf-ball-line",
    title: "Luxury Golf Vacations",
    tagline: "Championship courses in Belek with five-star all-inclusive stays",
    link: "/golf-vacations",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "private-jets",
    icon: "ri-plane-line",
    title: "Private Jet Charters",
    tagline: "On-demand private jet charters across Turkey and the Mediterranean",
    link: "/private-jets",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "personal-chefs",
    icon: "ri-restaurant-2-line",
    title: "Personal Chefs",
    tagline: "Private chef in your villa crafting seasonal Anatolian menus",
    link: "/personal-chefs",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "personal-driver",
    icon: "ri-steering-2-line",
    title: "Personal Driver",
    tagline: "Chauffeured luxury vehicles for transfers and coastal excursions",
    link: "/personal-driver",
    image: "/images/placeholder-business.svg",
  },
  {
    key: "personal-shopper",
    icon: "ri-shopping-bag-3-line",
    title: "Personal Shopper",
    tagline: "Style consultant guiding you through Alanya's best boutiques",
    link: "/personal-shopper",
    image: "/images/placeholder-business.svg",
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