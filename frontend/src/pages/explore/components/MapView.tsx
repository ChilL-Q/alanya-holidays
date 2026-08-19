import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Business } from "@/mocks/businesses";
import { businessCategories } from "@/mocks/businesses";

interface MapViewProps {
  businesses: Business[];
  searchQuery: string;
  activeCategory: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
}

const priceRangeLabel: Record<string, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Premium",
};

function buildMapUrl(selected: Business | null): string {
  if (selected) {
    const query = encodeURIComponent(`${selected.name}, ${selected.address}`);
    return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
  }
  return "https://maps.google.com/maps?q=Alanya,+Antalya,+Turkey&z=13&output=embed";
}

export default function MapView({
  businesses,
  searchQuery,
  activeCategory,
  onSearchChange,
  onCategoryChange,
}: MapViewProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const mapUrl = useMemo(() => buildMapUrl(selectedBusiness), [selectedBusiness]);

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 bg-background-50">
      <div className="max-w-7xl mx-auto">
        {/* Search and filter bar */}
        <div className="mb-5 space-y-3">
          <div className="bg-white rounded-xl border border-background-200/70 p-2 flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 px-2">
              <i className="ri-search-line text-foreground-400 text-lg"></i>
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 text-sm text-foreground-900 placeholder:text-foreground-400 py-2.5 bg-transparent border-none outline-none"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background-100 text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer shrink-0"
              >
                <i className="ri-close-line text-base"></i>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
            {businessCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-primary-500 text-white"
                    : "bg-white border border-foreground-200 text-foreground-600 hover:border-primary-200 hover:text-foreground-900"
                }`}
              >
                <i className={`${cat.icon} text-xs`}></i>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Split layout: sidebar + map */}
        <div className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden border border-background-200/70 bg-white">
          {/* Sidebar */}
          <div className="w-full lg:w-[400px] shrink-0 flex flex-col max-h-[600px] lg:max-h-[650px]">
            <div className="px-5 py-4 border-b border-background-200/70 bg-background-50/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground-900">
                  {businesses.length} {businesses.length === 1 ? "place" : "places"} found
                </span>
                {selectedBusiness && (
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-xs text-accent-600 hover:text-accent-700 font-medium cursor-pointer whitespace-nowrap"
                  >
                    Show all
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {businesses.length > 0 ? (
                <div className="divide-y divide-background-200/50">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      onClick={() => setSelectedBusiness(business)}
                      className={`px-5 py-4 cursor-pointer transition-colors hover:bg-background-50 ${
                        selectedBusiness?.id === business.id
                          ? "bg-primary-50 border-l-2 border-l-primary-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Pin marker */}
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center mt-0.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            selectedBusiness?.id === business.id
                              ? "bg-primary-500"
                              : "bg-foreground-400"
                          }`}>
                            <i className={`${businessCategories.find(c => c.id === business.category)?.icon || "ri-store-2-line"} text-xs`}></i>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-foreground-900 truncate">
                              {business.name}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <i className="ri-star-fill text-yellow-400 text-[10px]"></i>
                              <span className="text-xs font-semibold text-foreground-900">{business.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-foreground-500 mb-1.5 line-clamp-2">
                            {business.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-foreground-400 flex items-center gap-1">
                              <i className="ri-map-pin-line text-[10px]"></i>
                              {business.subcategory}
                            </span>
                            <span className="text-[11px] text-secondary-700 bg-secondary-100 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                              {priceRangeLabel[business.priceRange] || business.priceRange}
                            </span>
                            {business.featured && (
                              <span className="text-[11px] text-accent-700 bg-accent-100 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                <i className="ri-star-fill text-[9px] mr-0.5"></i>
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details when selected */}
                      {selectedBusiness?.id === business.id && (
                        <div className="mt-3 pt-3 border-t border-background-200/50 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-foreground-500">
                            <i className="ri-map-pin-line text-xs shrink-0"></i>
                            <span>{business.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground-500">
                            <i className="ri-time-line text-xs shrink-0"></i>
                            <span>{business.openingHours}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <a
                              href={`tel:${business.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-phone-line text-xs"></i>
                              Call
                            </a>
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-foreground-200 text-foreground-600 text-xs font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-external-link-line text-xs"></i>
                              Website
                            </a>
                            <Link
                              to={`/business/${business.id}`}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-arrow-right-line text-xs"></i>
                              View Details
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-5">
                  <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-100">
                    <i className="ri-search-line text-accent-500 text-xl"></i>
                  </div>
                  <h3 className="font-heading text-base text-foreground-900 mb-1">No places found</h3>
                  <p className="text-xs text-foreground-500">
                    Try a different search or category filter.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative min-h-[400px] lg:min-h-[650px] bg-background-100">
            <iframe
              src={mapUrl}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Alanya Business Map"
            ></iframe>

            {/* Floating info bar */}
            {selectedBusiness && (
              <div className="absolute bottom-4 left-4 right-4 lg:left-6 lg:right-6 bg-white rounded-xl border border-background-200/80 px-4 py-3 flex items-center gap-3 z-10">
                <img
                  src={selectedBusiness.image}
                  alt={selectedBusiness.name}
                  className="w-12 h-12 rounded-lg object-cover object-top shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/business/${selectedBusiness.id}`}
                    className="text-sm font-semibold text-foreground-900 hover:text-primary-500 transition-colors truncate block cursor-pointer"
                  >
                    {selectedBusiness.name}
                  </Link>
                  <p className="text-xs text-foreground-500 truncate">{selectedBusiness.address}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/business/${selectedBusiness.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Details
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedBusiness.name + ", " + selectedBusiness.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-foreground-200 text-foreground-600 text-xs font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-navigation-line text-xs"></i>
                    Directions
                  </a>
                </div>
              </div>
            )}

            {/* Pin count badge */}
            <div className="absolute top-4 right-4 bg-white rounded-full border border-background-200/80 px-3 py-1.5 flex items-center gap-1.5 z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
              <span className="text-xs font-semibold text-foreground-900 whitespace-nowrap">
                {businesses.length} {businesses.length === 1 ? "place" : "places"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}