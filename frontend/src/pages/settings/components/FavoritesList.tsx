import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Star, MapPin, Trash2, ChevronRight, ExternalLink } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { directoryService } from "@/api-services/directory.service";
import { businesses as mockBusinesses, type Business } from "@/mocks/businesses";

export function FavoritesList() {
  const { favorites, toggleFavorite, favoriteCount } = useFavorites();
  const [allListings, setAllListings] = useState<Business[]>(mockBusinesses);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchListings = async () => {
      setLoading(true);
      try {
        const res = await directoryService.getListings();
        if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
          setAllListings(res.data);
        }
      } catch (err) {
        console.warn("Failed to load listings for favorites, using local mock:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchListings();
    return () => {
      isMounted = false;
    };
  }, []);

  const favoriteItems = allListings.filter((b) => favorites.has(b.id));

  if (favoriteCount === 0 || (favoriteItems.length === 0 && !loading)) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No saved favorites yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Bookmark your preferred restaurants, luxury villas, and activities across Alanya to quickly access them here.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all shadow-xs"
        >
          Discover Alanya Places
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {favoriteItems.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-rose-300/80 transition-all flex flex-col justify-between"
        >
          <div className="p-5 flex gap-4">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 rounded-lg object-cover bg-slate-100 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  {item.subcategory || item.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                  <span className="text-slate-400 font-normal">({item.reviewCount})</span>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>

              {item.address && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate pt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {item.address}
                </p>
              )}
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 flex items-center justify-between text-xs">
            <Link
              to={`/business/${item.id}`}
              className="font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              View Listing
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              data-testid={`remove-fav-${item.id}`}
              onClick={() => toggleFavorite(item.id)}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
