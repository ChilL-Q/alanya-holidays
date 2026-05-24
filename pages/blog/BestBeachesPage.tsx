import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sun, Umbrella, Waves, Clock, Star, ChevronRight, Info } from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';

interface Beach {
  name: string;
  slug: string;
  description: string;
  highlights: string[];
  whyVisit: string;
  bestTime: string;
  imageUrl: string;
  imageAlt: string;
}

const beaches: Beach[] = [
  {
    name: 'Cleopatra Beach',
    slug: 'cleopatra-beach',
    description:
      'Cleopatra Beach is Alanya\'s most famous stretch of coastline, named after the legendary Egyptian queen who is said to have swum here. Located on the western side of the Alanya peninsula, this 2.5-kilometer beach boasts fine golden sand and crystal-clear turquoise waters that meet the Blue Flag standard for cleanliness and environmental management.',
    highlights: [
      'Fine golden sand and shallow entry, perfect for families with children',
      'Stunning view of Alanya Castle from the shoreline',
      'Wide range of water sports including parasailing, jet skis, and banana boats',
      'Beachfront restaurants, cafes, and ice cream parlors along the promenade',
      'Lifeguard stations and first-aid facilities for safe swimming',
    ],
    whyVisit:
      'Cleopatra Beach is the heart of Alanya\'s summer scene. Whether you want to relax under a parasol, take a sunset stroll, or enjoy adrenaline-pumping water activities, this beach delivers. The dramatic backdrop of the Taurus Mountains and the medieval fortress creates a postcard-perfect setting that few Mediterranean destinations can match.',
    bestTime:
      'Late May through early October offers the warmest water temperatures and the most reliable sunshine. July and August are peak season with the liveliest atmosphere, while June and September provide a more relaxed experience with fewer crowds and slightly cooler temperatures.',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    imageAlt:
      'Aerial view of Cleopatra Beach in Alanya with golden sand, turquoise water, and the historic castle in the background',
  },
  {
    name: 'Damlataş Beach',
    slug: 'damlatas-beach',
    description:
      'Damlataş Beach sits at the eastern foot of Cleopatra Beach, right beneath the iconic Damlataş Cave. Named after the cave itself — "Damlataş" translates to "dripping stone" — this compact beach is known for its coarse sand, remarkably clear water, and the reputed health benefits of the cave\'s humid microclimate.',
    highlights: [
      'Proximity to the famous Damlataş Cave, a natural asthma therapy site',
      'Rocky outcrops ideal for snorkeling and observing small marine life',
      'Quieter atmosphere compared to the main Cleopatra stretch',
      'Shaded seating areas near the cave entrance',
      'Easy access to Alanya city center and harbor walks',
    ],
    whyVisit:
      'Damlataş Beach is perfect for travelers seeking a blend of relaxation and natural wellness. The cave\'s high humidity and mineral-rich air have drawn visitors for decades. After a therapeutic cave visit, the beach offers a peaceful spot to swim and watch boats glide across the horizon.',
    bestTime:
      'April to November is suitable, but the cave is most pleasant during the hotter months when the cool interior offers a natural respite. Morning visits are recommended for the calmest water and the best light for photography.',
    imageUrl:
      'https://images.unsplash.com/photo-1520942702018-0865209d747f?auto=format&fit=crop&w=1200&q=80',
    imageAlt:
      'Damlataş Beach shoreline with clear blue water and the rocky cave entrance visible in the background',
  },
  {
    name: 'Keykubat Beach',
    slug: 'keykubat-beach',
    description:
      'Keykubat Beach extends eastward from Damlataş toward Alanya\'s modern districts. Named after the Seljuk Sultan Kayqubad I, who once ruled this coast, the beach combines history with contemporary leisure. The shoreline is broader here, with mixed sand and pebble sections that give way to deeper water more quickly.',
    highlights: [
      'Long promenade with jogging and cycling paths',
      'Family-friendly parks and playgrounds just behind the beach',
      'Plenty of affordable sunbed and umbrella rentals',
      'Local fish restaurants serving the day\'s catch',
      'Less crowded than Cleopatra, offering more space to spread out',
    ],
    whyVisit:
      'Keykubat Beach is the choice for active travelers and families who want space, convenience, and local flavor. The promenade is ideal for morning runs or evening walks, and the dining scene here is more authentic and budget-friendly than the tourist-heavy western beaches.',
    bestTime:
      'June to September is prime time. The beach faces south, so it catches sunlight from early morning until late afternoon. Wind conditions in July and August make it excellent for light windsurfing and paddleboarding.',
    imageUrl:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    imageAlt:
      'Keykubat Beach promenade in Alanya with people walking, palm trees, and the Mediterranean Sea',
  },
  {
    name: 'Portakal Beach',
    slug: 'portakal-beach',
    description:
      'Portakal Beach — "Orange Beach" — is a tranquil escape located roughly 4 kilometers east of Alanya\'s city center. It takes its name from the orange groves that once dominated the surrounding hillside. Today, it offers a more natural, less commercialized beach experience while still providing basic amenities for visitors.',
    highlights: [
      'Uncrowded shoreline with a wilder, more natural feel',
      'Crystal-clear water ideal for snorkeling and freediving',
      'Small coves and inlets to explore along the coast',
      'Local tea gardens and casual eateries with sea views',
      'Beautiful sunset views over the Taurus Mountains',
    ],
    whyVisit:
      'If you want to escape the bustle of central Alanya without traveling far, Portakal Beach is the answer. The water here is often calmer and clearer than the main beaches, making it a favorite among local snorkelers and those who prefer a quieter day by the sea.',
    bestTime:
      'May, June, September, and October are ideal for a peaceful visit. The beach receives little shade, so arriving early or late in the day is recommended during midsummer.',
    imageUrl:
      'https://images.unsplash.com/photo-1537519646099-335112f03225?auto=format&fit=crop&w=1200&q=80',
    imageAlt:
      'Calm turquoise waters at Portakal Beach with natural coastline and distant mountain scenery',
  },
  {
    name: 'İncekum Beach',
    slug: 'incekum-beach',
    description:
      'İncekum Beach lies about 25 kilometers west of Alanya, near the town of Avsallar. Its name means "fine sand," and the beach lives up to it with some of the softest, most powdery sand on the entire Turkish Riviera. The gradual slope into the water creates a vast shallow area that is exceptionally safe for young children.',
    highlights: [
      'Exceptionally fine, powdery sand that feels like silk underfoot',
      'Very shallow and gentle shoreline, perfect for toddlers and non-swimmers',
      'Dense pine forests backing the beach, providing natural shade',
      'Several beach clubs with pools, slides, and all-inclusive day passes',
      'Sea turtle nesting sites protected during summer nights',
    ],
    whyVisit:
      'İncekum is the ultimate family beach. The combination of soft sand, shallow water, and natural shade makes it unbeatable for parents with small children. Nature lovers will also appreciate the protected dunes and the chance to spot Caretta caretta sea turtles after dark.',
    bestTime:
      'The shallow water warms up quickly, so even late spring and early autumn are comfortable. Peak season runs from mid-June to early September, but the beach is spacious enough to never feel overcrowded.',
    imageUrl:
      'https://images.unsplash.com/photo-1506377295352-e3154d43ea9e?auto=format&fit=crop&w=1200&q=80',
    imageAlt:
      'İncekum Beach with powdery white sand, shallow turquoise water, and pine forest backdrop near Alanya',
  },
];

const travelTips = [
  'Arrive before 10:00 AM to secure a good sunbed spot during July and August.',
  'Bring reef-safe sunscreen to protect marine ecosystems and your skin.',
  'Pack water shoes if you plan to explore rocky areas like Damlataş.',
  'Public buses (dolmuş) connect all central beaches for a few Turkish lira.',
  'Beach clubs typically charge for sunbeds, but many offer free entry if you purchase food or drinks.',
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the best beaches in Alanya?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The best beaches in Alanya are Cleopatra Beach for its iconic golden sand and water sports, Damlataş Beach for its proximity to the famous cave and snorkeling, Keykubat Beach for its long promenade and family-friendly parks, Portakal Beach for a quieter, more natural escape, and İncekum Beach for its exceptionally fine sand and shallow, child-safe waters.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which Alanya beach is best for families with children?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'İncekum Beach is the top choice for families with young children due to its extremely fine sand, very shallow water, and natural shade from pine forests. Cleopatra Beach is also excellent for families thanks to its lifeguards, gentle slope, and abundance of nearby amenities.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are Alanya beaches free to enter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all public beaches in Alanya are free to enter. However, sunbeds, umbrellas, and beach club amenities usually carry a rental fee. Many establishments offer free sunbeds if you purchase food or beverages.',
      },
    },
    {
      '@type': 'Question',
      name: 'When is the best time to visit Alanya beaches?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The best time to visit Alanya beaches is from late May to early October. July and August offer the warmest water but the most crowds. June and September provide a great balance of pleasant weather, warm seas, and fewer tourists.',
      },
    },
  ],
};

export const BestBeachesPage: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Best Beaches in Alanya (2026 Guide)"
        description="Discover the best beaches in Alanya, Turkey. From Cleopatra Beach to peaceful hidden gems, this 2026 guide covers the top coastal destinations."
        type="article"
        keywords={[
          'Alanya beaches',
          'Cleopatra Beach',
          'Damlataş Beach',
          'Keykubat Beach',
          'Portakal Beach',
          'İncekum Beach',
          'Alanya travel guide',
          'Turkish Riviera beaches',
          'best beaches Turkey 2026',
        ]}
        jsonLd={faqSchema}
      />

      <article className="min-h-screen bg-white dark:bg-slate-900">
        {/* Hero */}
        <section className="relative">
          <div className="aspect-[21/9] md:aspect-[3/1] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80"
              alt="Panoramic view of Alanya coastline with sandy beaches, turquoise water, and the historic castle on the rocky peninsula"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-600/90 text-white rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
                <Waves size={14} />
                2026 Travel Guide
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
                Best Beaches in Alanya
              </h1>
              <p className="mt-3 text-base md:text-lg text-slate-200 max-w-2xl leading-relaxed drop-shadow">
                A complete guide to the finest stretches of sand and sea along the Turkish Riviera.
                From world-famous shores to hidden local favorites.
              </p>
            </div>
          </div>
        </section>

        {/* Intro */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
            Alanya sits on a sun-drenched corner of Turkey&apos;s Mediterranean coast where the Taurus Mountains
            plunge into the sea. The result is a spectacular collection of beaches, each with its own character.
            Whether you are after lively water sports, family-friendly shallows, or quiet coves surrounded by pine
            forests, Alanya has a shoreline for every kind of traveler. This guide covers the five best beaches
            you should not miss in 2026.
          </p>

          {/* Table of Contents */}
          <nav className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-teal-600 dark:text-cyan-400" />
              Beaches in This Guide
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {beaches.map((beach, index) => (
                <li key={beach.slug}>
                  <a
                    href={`#${beach.slug}`}
                    className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-cyan-400 transition-colors"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-cyan-400 text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium">{beach.name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Beach Sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-16 md:space-y-24">
          {beaches.map((beach) => (
            <section key={beach.slug} id={beach.slug} className="scroll-mt-24">
              {/* Beach Image */}
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-8">
                <img
                  src={beach.imageUrl}
                  alt={beach.imageAlt}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>

              {/* Beach Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-cyan-400">
                  <Sun size={20} />
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {beach.name}
                </h2>
              </div>

              {/* Description */}
              <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
                {beach.description}
              </p>

              {/* Highlights */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Star size={18} className="text-amber-500" />
                  Highlights
                </h3>
                <ul className="space-y-2">
                  {beach.highlights.map((highlight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                    >
                      <ChevronRight
                        size={16}
                        className="mt-1 text-teal-600 dark:text-cyan-400 shrink-0"
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why Visit + Best Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-teal-50/50 dark:bg-teal-900/10 rounded-2xl border border-teal-100 dark:border-teal-900/20">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Umbrella size={18} className="text-teal-600 dark:text-cyan-400" />
                    Why Visit
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                    {beach.whyVisit}
                  </p>
                </div>

                <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                    Best Time to Visit
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                    {beach.bestTime}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Don't Miss Callout */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative p-8 md:p-10 bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl text-white overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Info size={20} className="text-teal-100" />
                <h2 className="text-xl md:text-2xl font-extrabold">Do Not Miss</h2>
              </div>
              <p className="text-teal-50 leading-relaxed mb-6 max-w-2xl">
                While the beaches are the main attraction, pairing your visit with Alanya&apos;s
                cultural landmarks will make your trip unforgettable. Walk the walls of
                Alanya Castle at sunset, explore the Red Tower, and take a boat trip along
                the peninsula to see the coastline from the water. The contrast of ancient
                history and natural beauty is what makes Alanya unique on the Mediterranean.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/things-to-do-in-alanya"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors shadow-sm"
                >
                  <MapPin size={16} />
                  Explore Things to Do
                </Link>
                <Link
                  to="/alanya-hotels"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500/30 text-white font-semibold rounded-xl hover:bg-teal-500/40 transition-colors border border-white/20"
                >
                  Find Beachfront Hotels
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Travel Tips */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
            Essential Beach Travel Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {travelTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-cyan-400 text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>

          {/* Internal Links */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              More Alanya Guides
            </h3>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/alanya-nature-attractions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <MapPin size={14} />
                Nature Attractions
              </Link>
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Star size={14} />
                Restaurants
              </Link>
              <Link
                to="/alanya-spa-hamam"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Umbrella size={14} />
                Spa & Hamam
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Waves size={14} />
                All Travel Guides
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  );
};

export default BestBeachesPage;
