import React from 'react';
import { BookOpen, MessageCircle, Sparkles, MapPin, PenLine, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SEOHead } from '../components/seo/SEOHead';

interface CommunityCardProps {
  to?: string;
  comingSoon?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ to, comingSoon, icon, iconBg, iconColor, title, description }) => {
  return (
    <div className="bg-white dark:bg-slate-800/80 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 dark:border-slate-800/50 flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        {comingSoon && (
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
            Coming Soon
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base flex-grow mb-6">
        {description}
      </p>
      {to && !comingSoon ? (
        <Link
          to={to}
          className="inline-flex items-center text-teal-600 dark:text-cyan-400 font-semibold hover:text-teal-700 dark:hover:text-cyan-300 transition-colors group"
        >
          <span className="border-b border-transparent group-hover:border-teal-600 dark:group-hover:border-cyan-400 transition-all">
            Explore
          </span>
          <ArrowRight size={16} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <span className="inline-flex items-center text-slate-400 dark:text-slate-600 font-semibold text-sm cursor-default select-none">
          Launching soon
        </span>
      )}
    </div>
  );
};

export const CommunityPage: React.FC = () => {
  const { t } = useLanguage();

  const cards = [
    {
      to: '/blog',
      icon: <BookOpen size={28} strokeWidth={1.5} />,
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: t('community.card.blog.title') || 'Travel Blog',
      description: t('community.card.blog.desc') || 'Discover insider tips, hidden gems, and travel stories from Alanya.',
    },
    {
      comingSoon: true,
      icon: <MessageCircle size={28} strokeWidth={1.5} />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: t('community.card.forum.title') || 'Community Forum',
      description: t('community.card.forum.desc') || 'A dedicated Q&A space for Alanya travelers is on its way. Ask locals, share tips, get answers.',
    },
    {
      to: '/ai-planner',
      icon: <Sparkles size={28} strokeWidth={1.5} />,
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: t('community.card.ai.title') || 'AI Trip Planner',
      description: t('community.card.ai.desc') || 'Let our AI craft a personalized itinerary tailored to your preferences.',
    },
    {
      to: '/',
      icon: <MapPin size={28} strokeWidth={1.5} />,
      iconBg: 'bg-teal-50 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-cyan-400',
      title: t('community.card.directory.title') || 'Business Directory',
      description: t('community.card.directory.desc') || 'Explore verified local businesses, from restaurants to real estate.',
    },
    {
      to: '/blog/submit',
      icon: <PenLine size={28} strokeWidth={1.5} />,
      iconBg: 'bg-rose-50 dark:bg-rose-900/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      title: t('community.card.submit.title') || 'Share Your Story',
      description: t('community.card.submit.desc') || 'Have a travel story? Submit your blog post and inspire others.',
    },
  ];

  return (
    <>
      <SEOHead
        title="Community Hub"
        description="Connect with the Alanya Holidays community. Explore our travel blog, forum, AI trip planner, and business directory."
        type="website"
        keywords={['Alanya community', 'travel blog', 'trip planner', 'forum']}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-slate-800 dark:to-slate-900 py-20 md:py-28">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">
              {t('community.hero.title') || 'Community Hub'}
            </h1>
            <p className="text-lg md:text-xl text-teal-100 dark:text-slate-300 max-w-2xl mx-auto">
              {t('community.hero.subtitle') || 'Connect, share, and plan your perfect Alanya experience.'}
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <CommunityCard key={index} {...card} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
