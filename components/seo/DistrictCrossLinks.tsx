import React from 'react';
import { Link } from 'react-router-dom';
import {
  getDistrictBySlug,
  getDistrictPagesForDistrict,
  getDistrictPagesForType,
  getCategoryPathForType,
  PAGE_TYPE_LABELS,
  type DistrictPageType,
} from '../../data/districtPages';

interface DistrictCrossLinksProps {
  currentDistrictSlug: string;
  currentPageType: DistrictPageType;
}

export const DistrictCrossLinks: React.FC<DistrictCrossLinksProps> = ({
  currentDistrictSlug,
  currentPageType,
}) => {
  const currentDistrict = getDistrictBySlug(currentDistrictSlug);
  if (!currentDistrict) return null;

  const sameDistrictPages = getDistrictPagesForDistrict(currentDistrictSlug)
    .filter(p => p.pageType !== currentPageType);

  const otherDistrictSameType = getDistrictPagesForType(currentPageType)
    .filter(p => p.districtSlug !== currentDistrictSlug)
    .map(p => ({
      ...p,
      districtName: getDistrictBySlug(p.districtSlug)?.name ?? p.districtSlug,
    }));

  const categoryPath = getCategoryPathForType(currentPageType);

  return (
    <>
      {/* Same district — other page types */}
      {sameDistrictPages.length > 0 && (
        <div className="mt-16 mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Explore {currentDistrict.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sameDistrictPages.map(page => (
              <Link
                key={page.url}
                to={`/${page.url}`}
                className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:border-teal-500 dark:hover:border-cyan-400 hover:shadow-md transition-all text-center"
              >
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors text-sm">
                  {PAGE_TYPE_LABELS[page.pageType]}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  in {currentDistrict.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Same type — other districts */}
      {otherDistrictSameType.length > 0 && (
        <div className="mb-12 border-t border-slate-200 dark:border-slate-800/50 pt-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            {PAGE_TYPE_LABELS[currentPageType]} in Other Areas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherDistrictSameType.map(page => (
              <Link
                key={page.url}
                to={`/${page.url}`}
                className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 hover:border-teal-500 dark:hover:border-cyan-400 hover:shadow-md transition-all text-center"
              >
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors text-sm">
                  {page.districtName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {page.metaDescription.length > 80 ? `${page.metaDescription.slice(0, 80)}...` : page.metaDescription}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Link back to main category page */}
      <div className="mb-12 text-center">
        <Link
          to={categoryPath}
          className="inline-flex items-center gap-2 text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-400 font-semibold text-base"
        >
          View all {PAGE_TYPE_LABELS[currentPageType].toLowerCase()} in Alanya →
        </Link>
      </div>
    </>
  );
};