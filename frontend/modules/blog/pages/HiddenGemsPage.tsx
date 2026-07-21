import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Utensils, Camera, Lightbulb, Star, ArrowRight } from 'lucide-react';
import { SEOHead } from '../../../components/seo/SEOHead';

const ARTICLE_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80';
const SAPADERE_IMAGE = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80';
const VILLAGE_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';
const ANCIENT_IMAGE = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80';
const FOOD_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hidden Gems in Alanya: Discover the Secret Side of Antalya',
  description: 'Discover hidden gems in Alanya and Antalya. Explore secret villages, ancient ruins, authentic Turkish food, and unique things to do beyond the tourist trail.',
  image: ARTICLE_IMAGE,
  author: {
    '@type': 'Organization',
    name: 'Alanya Holidays',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Alanya Holidays',
    logo: {
      '@type': 'ImageObject',
      url: 'https://alanya-holidays.com/og-image.jpg',
    },
  },
  datePublished: '2026-05-24',
  dateModified: '2026-05-24',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://alanya-holidays.com/hidden-gems-alanya',
  },
};

export const HiddenGemsPage: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Hidden Gems in Alanya: Secret Places in Antalya"
        description="Discover hidden gems in Alanya and Antalya. Explore secret villages, ancient ruins, authentic Turkish food, and unique things to do beyond the tourist trail."
        image={ARTICLE_IMAGE}
        type="article"
        keywords={[
          'hidden gems Alanya',
          'secret places Antalya',
          'Sapadere Canyon',
          'Syedra Ancient City',
          'authentic Turkish villages',
          'off the beaten path Turkey',
          'Alanya travel guide',
        ]}
        jsonLd={articleSchema}
      />

      <article className="min-h-screen bg-white dark:bg-slate-900">
        {/* Hero */}
        <div className="relative">
          <div className="aspect-[21/9] max-h-[500px] overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={ARTICLE_IMAGE}
              alt="Lush mountain valley landscape in Alanya, Turkey"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-20">
              <span className="inline-block px-3 py-1 bg-teal-500/90 text-white rounded-full font-medium text-xs uppercase tracking-wider mb-4">
                Travel Guide
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Hidden Gems in Alanya: Discover the Secret Side of Antalya
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Intro */}
          <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
            Alanya is famous for its golden beaches and bustling harbour, but venture beyond the resort strip and you will find a world of untouched villages, ancient ruins, and authentic local experiences. This guide reveals the secret side of Antalya that most travellers never see.
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              to="/attractions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
            >
              <MapPin size={16} />
              Explore Attractions
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/things-to-do-in-alanya"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg font-medium hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
            >
              <Camera size={16} />
              Browse Tours
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Section: Sapadere */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Sapadere Village & Canyon
          </h2>
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
            <img
              src={SAPADERE_IMAGE}
              alt="Wooden walkway through Sapadere Canyon with turquoise water and lush green cliffs"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            Tucked into the Taurus Mountains about 40 kilometres east of Alanya, Sapadere Canyon feels like a secret world. A wooden boardwalk winds along the canyon floor, guiding you past waterfalls, natural swimming pools, and vertical rock walls draped in ferns. The water is so clear and turquoise that it barely looks real.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            The nearby village of Sapadere itself is a charming mountain settlement where locals still farm walnuts and apples. Stop at a family-run cafe for fresh gözleme and mountain tea while taking in views that stretch all the way to the Mediterranean coast.
          </p>

          {/* Don't Miss callout */}
          <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-6 mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-amber-500" size={20} />
              <span className="font-bold text-slate-900 dark:text-white">Don&apos;t Miss</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The hidden waterfall at the end of the canyon boardwalk. Most visitors turn back after the main pools, but continuing another 200 metres rewards you with a smaller, more secluded cascade surrounded by wildflowers.
            </p>
          </div>

          {/* Section: Mahmutseydi */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Mahmutseydi Village
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            Mahmutseydi sits on the slopes above Alanya, offering a glimpse of rural Turkish life that has remained largely unchanged for generations. Stone houses with red-tiled roofs line narrow lanes, and the scent of wild thyme drifts from the hillsides. It is a working village, not a tourist display, which makes every encounter feel genuine.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Visit on a market day to see locals trading produce, honey, and handmade textiles. The village mosque, rebuilt in traditional style after a fire, is also worth a quiet look. The real highlight, though, is simply walking the old paths and exchanging smiles with residents tending their gardens.
          </p>

          {/* Travel tip callout */}
          <div className="rounded-xl border-l-4 border-teal-500 bg-teal-50 dark:bg-teal-900/10 p-6 mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="text-teal-500" size={20} />
              <span className="font-bold text-slate-900 dark:text-white">Travel Tip</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Hire a local driver or rent a car with good ground clearance. Mountain roads are paved but steep and winding. Morning visits offer the clearest views before afternoon haze rolls in from the coast.
            </p>
          </div>

          {/* Section: Dereköy */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Dereköy
          </h2>
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
            <img
              src={VILLAGE_IMAGE}
              alt="Traditional stone houses in a quiet Turkish mountain village surrounded by green hills"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            Dereköy is one of those places you discover by accident and never forget. This tiny settlement lies even deeper in the mountains than Mahmutseydi, surrounded by pine forest and terraced fields. The village population swells in summer as families return from the cities to tend their ancestral land, but outside July and August you might be the only visitor.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            A local family runs a small guesthouse where you can sleep in a restored stone room and wake up to the sound of roosters and woodsmoke. It is the closest you can get to experiencing old Anatolian hospitality without venturing far from the coast.
          </p>

          {/* Section: Akçatı Village */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Akçatı Village
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            Akçatı is known among locals for its orchards and cool mountain air. Located at a higher elevation than most coastal villages, it serves as a natural escape from the summer heat. The village produces excellent apples, pears, and cherries, and many families invite visitors to pick fruit straight from the tree during harvest season.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Walking trails from Akçatı connect to neighbouring ridges, offering panoramic views of the Alanya peninsula and the distant sea. Bring sturdy shoes and plenty of water; the terrain is rewarding but uneven.
          </p>

          {/* Section: Gökbel Village */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Gökbel Village
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            Perched on a ridge with commanding views of the Dim River valley, Gökbel is a photographer&apos;s dream. The village is small, perhaps fifty houses, but its position makes it one of the best sunset viewpoints in the entire Alanya region. As the light fades, the mountains turn gold and the valley below fills with shadow.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            Gökbel also has a strong tradition of carpet weaving. Several older women in the village still work on handlooms, and if you ask politely they may demonstrate the craft. Small rugs are sometimes available for purchase, priced fairly without the tourist markup you find in bazaars.
          </p>

          {/* Don't Miss callout */}
          <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-6 mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-amber-500" size={20} />
              <span className="font-bold text-slate-900 dark:text-white">Don&apos;t Miss</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The sunset viewpoint at the old cemetery on Gökbel&apos;s western edge. It sounds morbid, but the terrace offers an uninterrupted 180-degree panorama and is a favourite spot for locals to drink tea in the evening.
            </p>
          </div>

          {/* Section: Syedra */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Syedra Ancient City
          </h2>
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
            <img
              src={ANCIENT_IMAGE}
              alt="Ancient stone ruins surrounded by Mediterranean vegetation on a hillside"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            While crowds flock to Ephesus and Perge, Syedra sits quietly on a hillside near Seki village, almost entirely overlooked. This ancient city was inhabited from the Hellenistic period through Byzantine times, and its ruins include a well-preserved bath complex, cisterns, a colonnaded street, and a small theatre carved into the slope.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            The lack of fencing or entrance fees means you can wander freely among the stones, tracing the layout of a city that once thrived on trade passing between the coast and the Anatolian interior. Information panels are minimal, so reading up beforehand or hiring a local guide adds context.
          </p>

          {/* Travel tip callout */}
          <div className="rounded-xl border-l-4 border-teal-500 bg-teal-50 dark:bg-teal-900/10 p-6 mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="text-teal-500" size={20} />
              <span className="font-bold text-slate-900 dark:text-white">Travel Tip</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Combine Syedra with a visit to Seki village for lunch. The local restaurants serve grilled trout from mountain streams and flatbread baked in clay ovens. Arrive early in the morning for the best light and cooler temperatures.
            </p>
          </div>

          {/* Section: Authentic Food */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Authentic Food Experiences: Gözleme and Beyond
          </h2>
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
            <img
              src={FOOD_IMAGE}
              alt="Traditional Turkish gözleme being prepared on a griddle with fresh ingredients"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            No exploration of hidden Alanya is complete without tasting the food. In mountain villages, meals are prepared from ingredients grown within walking distance of the table. Gözleme, a thin savoury pastry filled with spinach, cheese, or potatoes, is cooked on a saj griddle right in front of you. The dough is rolled by hand, the filling is generous, and the result is infinitely better than anything sold at beachfront snack bars.
          </p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">
            What to Eat in the Villages
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            <li><strong>Gözleme</strong> — Try the village version with wild greens and local white cheese.</li>
            <li><strong>Mantı</strong> — Tiny handmade dumplings served with garlic yoghurt and tomato butter.</li>
            <li><strong>Köy Ekmeği</strong> — Dense, crusty village bread baked in a wood-fired oven.</li>
            <li><strong>Biber Dolması</strong> — Sun-dried peppers stuffed with rice, pine nuts, and herbs.</li>
            <li><strong>Oralama</strong> — A hearty mountain stew of lamb, vegetables, and bulgur wheat.</li>
          </ul>

          {/* Don't Miss callout */}
          <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-6 mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Utensils className="text-amber-500" size={20} />
              <span className="font-bold text-slate-900 dark:text-white">Don&apos;t Miss</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Ask your host if they make homemade pekmez, a thick grape or mulberry molasses used in desserts and breakfasts. Many families still produce it the traditional way in autumn, and a jar makes a unique, edible souvenir.
            </p>
          </div>

          {/* Practical info */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-6">
            Planning Your Visit
          </h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            The best time to explore Alanya&apos;s hidden gems is spring (April to June) or autumn (September to November). Summer heat makes mountain hiking uncomfortable, and some village roads can be muddy after winter rains. A rental car is strongly recommended, as public transport to these areas is infrequent.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
            Most villagers speak limited English, but hospitality transcends language barriers. A smile, a few words of Turkish, and genuine curiosity open more doors than any guidebook. Dress modestly when visiting mosques and always ask before photographing people.
          </p>

          {/* Final CTA */}
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-8 text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Ready to Explore Alanya?
            </h3>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Discover more unique experiences, from guided mountain treks to curated local food tours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/attractions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
              >
                <MapPin size={18} />
                View Attractions
              </Link>
              <Link
                to="/things-to-do-in-alanya"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                <Camera size={18} />
                Browse Tours
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

export default HiddenGemsPage;
