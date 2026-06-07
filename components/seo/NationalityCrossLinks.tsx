import React from 'react';
import { Link } from 'react-router-dom';
import { NATIONALITY_PAGES, MARKET_FLAGS, MARKET_LABELS, UI_STRINGS, type LanguageCode, type NationalityMarket } from '../../data/nationalityPages';

interface NationalityCrossLinksProps {
  currentSlug: string;
  language: LanguageCode;
}

const MARKET_ORDER: NationalityMarket[] = ['UK', 'DE', 'NL', 'NO', 'SE'];

export const NationalityCrossLinks = React.memo<NationalityCrossLinksProps>(({ currentSlug, language }) => {
  const otherPages = NATIONALITY_PAGES.filter(p => p.slug !== currentSlug);

  if (otherPages.length === 0) return null;

  const sorted = [...otherPages].sort(
    (a, b) => MARKET_ORDER.indexOf(a.market) - MARKET_ORDER.indexOf(b.market),
  );

  return (
    <div className="mt-16 mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
        {UI_STRINGS[language].otherMarkets}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map(page => (
          <Link
            key={page.slug}
            to={`/${page.slug}`}
            className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:border-teal-500 dark:hover:border-cyan-400 hover:shadow-md transition-all text-center"
          >
            <span className="text-2xl block mb-2">{MARKET_FLAGS[page.market]}</span>
            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors text-sm">
              {page.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {MARKET_LABELS[page.market]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
});