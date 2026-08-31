import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import QRCode from "qrcode";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { directoryService, businessCategories, type Business } from "@/api-services/directory.service";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import "@/i18n";

const priceRangeLabel: Record<string, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Premium",
};

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) return <i key={i} className="ri-star-fill text-yellow-400 text-xs"></i>;
        if (i === fullStars && hasHalf) return <i key={i} className="ri-star-half-line text-yellow-400 text-xs"></i>;
        return <i key={i} className="ri-star-fill text-foreground-200 text-xs"></i>;
      })}
    </span>
  );
}

function getCategoryInfo(categoryId: string) {
  return businessCategories.find((c) => c.id === categoryId);
}

const NOTES_STORAGE_KEY = "compare-business-notes";

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function allSame(values: string[]): boolean {
  if (values.length <= 1) return true;
  const first = values[0];
  return values.every((v) => v === first);
}

export default function ComparePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes());
  const [loadedBusinesses, setLoadedBusinesses] = useState<Record<string, Business>>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const idsParam = searchParams.get("ids") || "";
  const ids = useMemo(() => idsParam.split(",").filter(Boolean), [idsParam]);

  useEffect(() => {
    if (!ids.length) return;
    let isMounted = true;

    const loadData = async () => {
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const biz = await directoryService.getListingById(id);
            return { id, biz };
          })
        );

        if (isMounted) {
          setLoadedBusinesses((prev) => {
            const next = { ...prev };
            results.forEach(({ id, biz }) => {
              if (biz) next[id] = biz;
            });
            return next;
          });
        }
      } catch (err) {
        logger.warn("Failed to load compare listings via directoryService:", err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ids]);

  const selectedBusinesses = useMemo(() => {
    return ids
      .map((id) => loadedBusinesses[id])
      .filter((b): b is Business => !!b);
  }, [ids, loadedBusinesses]);

  const hasData = selectedBusinesses.length >= 2;

  /* Calculate which rows are "all same" for highlight-diffs mode */
  const diffState = useMemo(() => {
    if (!hasData) return {} as Record<string, boolean>;
    return {
      subcategory: !allSame(selectedBusinesses.map((b) => b.subcategory)),
      priceRange: !allSame(selectedBusinesses.map((b) => b.priceRange)),
      rating: !allSame(selectedBusinesses.map((b) => String(b.rating))),
      description: true, // descriptions are always different
      address: true, // addresses are always different
      openingHours: !allSame(selectedBusinesses.map((b) => b.openingHours)),
      phone: true, // phones are always different
      email: true, // emails are always different
      website: true, // websites are always different
      tags: !allSame(selectedBusinesses.map((b) => [...b.tags].sort().join(","))),
    };
  }, [selectedBusinesses, hasData]);

  /* Generate QR code for the report when modal opens */
  useEffect(() => {
    if (showReport && hasData) {
      const comparisonUrl = window.location.href;
      QRCode.toDataURL(comparisonUrl, { width: 180, margin: 2, color: { dark: "#1a1a2e", light: "#ffffff" } })
        .then((url: string) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(""));
    }
  }, [showReport, hasData]);

  /* Persist notes to localStorage whenever they change */
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  function setNote(businessId: string, text: string) {
    setNotes((prev) => ({ ...prev, [businessId]: text }));
  }

  function clearAllNotes() {
    setNotes({});
    localStorage.removeItem(NOTES_STORAGE_KEY);
  }

  const hasNotes = hasData && Object.values(notes).some((n: string) => n.trim());

  /** Returns row classes — dims the row when highlight mode is on and all values match */
  function rowCls(key: string): string {
    if (!highlightDiffs) return "";
    const differs = diffState[key];
    return differs ? "" : "opacity-25 grayscale";
  }

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("compare.shareTitle", { names: selectedBusinesses.map(b => b.name).join(", ") }),
          text: t("compare.shareText", { count: selectedBusinesses.length }),
          url,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      // use a simple alert for now since we don't have a toast system imported here
      alert(t("compare.linkCopied"));
    }
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Header */}
        <section className="w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-6 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-foreground-400 hover:text-foreground-600 text-xs transition-colors underline underline-offset-2">{t("nav.home")}</Link>
              <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
              <Link to="/explore" className="text-foreground-400 hover:text-foreground-600 text-xs transition-colors underline underline-offset-2">{t("public.businessDirectory")}</Link>
              <i className="ri-arrow-right-s-line text-foreground-300 text-xs"></i>
              <span className="text-foreground-600 text-xs">{t("public.compare")}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-1">{t("compare.title")}</h1>
                <p className="text-sm text-foreground-500">
                  {hasData
                    ? `Comparing ${selectedBusinesses.length} businesses side by side`
                    : "Select businesses from the directory to compare them"}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {hasData && (
                  <button
                    onClick={() => setHighlightDiffs(!highlightDiffs)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      highlightDiffs
                        ? "bg-accent-500 text-white border border-accent-500"
                        : "bg-white border border-foreground-200 text-foreground-700 hover:border-accent-300"
                    }`}
                  >
                    <i className={`${highlightDiffs ? "ri-contrast-drop-2-fill" : "ri-contrast-drop-2-line"} text-sm`}></i>
                    {t("compare.highlightDifferences")}
                  </button>
                )}
                {hasData && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-file-list-3-line text-sm"></i>
                  {t("compare.printReport")}
                  </button>
                )}
                {hasNotes && (
                  <button
                    onClick={clearAllNotes}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-delete-bin-6-line text-sm"></i>
                  {t("compare.clearNotes")}
                  </button>
                )}
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap self-start cursor-pointer"
                >
                  <i className="ri-arrow-left-line text-sm"></i>
                  {t("compare.backToDirectory")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {hasData ? (
          <section className="w-full px-4 md:px-8 lg:px-12 pb-16 bg-background-50">
            <div className="max-w-7xl mx-auto">
              {/* Desktop comparison table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-background-200/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <colgroup>
                      <col style={{ width: "180px" }} />
                      {selectedBusinesses.map((b) => (
                        <col key={`col-${b.id}`} style={{ width: `${Math.floor(100 / selectedBusinesses.length)}%` }} />
                      ))}
                    </colgroup>

                    {/* Image row */}
                    <thead>
                      <tr>
                        <th className="bg-background-100/60 px-4 py-3 text-left"></th>
                        {selectedBusinesses.map((b) => (
                          <th key={b.id} className="bg-white px-3 py-3">
                            <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3">
                              <img
                                src={b.image}
                                alt={b.name}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                            <Link
                              to={`/business/${b.id}`}
                              className="text-sm font-heading font-semibold text-foreground-900 hover:text-primary-500 transition-colors line-clamp-2 cursor-pointer"
                            >
                              {b.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[11px] text-foreground-500 px-2 py-0.5 rounded-full bg-secondary-100 font-medium whitespace-nowrap">
                                {getCategoryInfo(b.category)?.name || b.subcategory}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {/* Category */}
                      <tr className={`transition-opacity duration-300 ${rowCls("subcategory")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-price-tag-3-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.category")}</span>
                            {highlightDiffs && diffState.subcategory && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30 text-sm text-foreground-800">
                            {b.subcategory}
                          </td>
                        ))}
                      </tr>

                      {/* Price Range */}
                      <tr className={`transition-opacity duration-300 ${rowCls("priceRange")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-money-dollar-circle-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.price")}</span>
                            {highlightDiffs && diffState.priceRange && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30">
                            <span className="inline-block px-2.5 py-1 rounded-full bg-background-100 text-sm font-semibold text-foreground-800 whitespace-nowrap">
                              {priceRangeLabel[b.priceRange] || b.priceRange}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Rating */}
                      <tr className={`transition-opacity duration-300 ${rowCls("rating")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-star-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.rating")}</span>
                            {highlightDiffs && diffState.rating && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-foreground-900">{b.rating}</span>
                              <StarRating rating={b.rating} />
                              <span className="text-xs text-foreground-500">({b.reviewCount})</span>
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Description */}
                      <tr className={`transition-opacity duration-300 ${rowCls("description")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-file-text-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.about")}</span>
                            {highlightDiffs && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30 text-sm text-foreground-600 leading-relaxed align-top">
                            {b.description}
                          </td>
                        ))}
                      </tr>

                      {/* Address */}
                      <tr className={`transition-opacity duration-300 ${rowCls("address")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-map-pin-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.address")}</span>
                            {highlightDiffs && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30 text-sm text-foreground-600 leading-relaxed">
                            {b.address}
                          </td>
                        ))}
                      </tr>

                      {/* Opening Hours */}
                      <tr className={`transition-opacity duration-300 ${rowCls("openingHours")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-time-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.hours")}</span>
                            {highlightDiffs && diffState.openingHours && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30 text-sm text-foreground-600 whitespace-nowrap">
                            {b.openingHours}
                          </td>
                        ))}
                      </tr>

                      {/* Phone */}
                      <tr className={`transition-opacity duration-300 ${rowCls("phone")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-phone-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.phone")}</span>
                            {highlightDiffs && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30">
                            <a href={`tel:${b.phone}`} className="text-sm text-foreground-800 hover:text-primary-500 transition-colors cursor-pointer whitespace-nowrap">
                              {b.phone}
                            </a>
                          </td>
                        ))}
                      </tr>

                      {/* Email */}
                      <tr className={`transition-opacity duration-300 ${rowCls("email")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-mail-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.email")}</span>
                            {highlightDiffs && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30">
                            <a href={`mailto:${b.email}`} className="text-sm text-foreground-800 hover:text-primary-500 transition-colors cursor-pointer break-all">
                              {b.email}
                            </a>
                          </td>
                        ))}
                      </tr>

                      {/* Website */}
                      <tr className={`transition-opacity duration-300 ${rowCls("website")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-global-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.website")}</span>
                            {highlightDiffs && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30">
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-foreground-800 hover:text-primary-500 transition-colors cursor-pointer break-all"
                            >
                              {b.website.replace("https://", "").replace("http://", "").replace(/\/$/, "")}
                            </a>
                          </td>
                        ))}
                      </tr>

                      {/* Tags */}
                      <tr className={`transition-opacity duration-300 ${rowCls("tags")}`}>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-hashtag text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.tags")}</span>
                            {highlightDiffs && diffState.tags && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Businesses differ in this field"></span>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {b.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Notes */}
                      <tr>
                        <td className="bg-background-100/60 px-4 py-3 border-b border-background-200/40">
                          <div className="flex items-center gap-2">
                            <i className="ri-sticky-note-line text-foreground-400 text-sm"></i>
                            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("compare.myNotes")}</span>
                            {hasNotes && (
                              <button
                                onClick={clearAllNotes}
                                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
                                title="Clear all notes"
                              >
                                <i className="ri-delete-bin-6-line text-[10px]"></i>
                                {t("compare.clearAll")}
                              </button>
                            )}
                          </div>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3 border-b border-background-200/30">
                            <textarea
                              value={notes[b.id] || ""}
                              onChange={(e) => setNote(b.id, e.target.value)}
                              placeholder={t("compare.notePlaceholder")}
                              rows={3}
                              className="w-full px-3 py-2 text-sm text-foreground-700 bg-background-50 border border-background-200 rounded-lg resize-y focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-200 placeholder:text-foreground-300 transition-colors"
                            ></textarea>
                          </td>
                        ))}
                      </tr>

                      {/* Action */}
                      <tr>
                        <td className="bg-background-100/60 px-4 py-3">
                          <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("compare.details")}</span>
                        </td>
                        {selectedBusinesses.map((b) => (
                          <td key={b.id} className="px-4 py-3">
                            <Link
                              to={`/business/${b.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-arrow-right-line text-sm"></i>
                              {t("compare.viewFullDetails")}
                            </Link>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile stacked cards */}
              <div className="lg:hidden space-y-6">
                {highlightDiffs && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-accent-50 border border-accent-200/50 rounded-xl">
                    <i className="ri-contrast-drop-2-fill text-accent-500 text-sm"></i>
                    <span className="text-sm text-accent-800 font-medium">
                      {Object.values(diffState).filter(Boolean).length} fields have differences — dimmed fields are identical
                    </span>
                  </div>
                )}
                {selectedBusinesses.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-background-200/70 overflow-hidden">
                    <div className="relative w-full h-48 overflow-hidden">
                      <img src={b.image} alt={b.name} className="w-full h-full object-cover object-top" />
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-foreground-900/70 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap">
                          {b.subcategory}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <Link to={`/business/${b.id}`} className="block font-heading text-lg font-semibold text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer">
                        {b.name}
                      </Link>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full bg-background-100 text-xs font-semibold text-foreground-700 whitespace-nowrap">
                          {priceRangeLabel[b.priceRange] || b.priceRange}
                        </span>
                        {highlightDiffs && diffState.priceRange && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Differs from others"></span>
                        )}
                        <div className="flex items-center gap-1">
                          <i className="ri-star-fill text-yellow-400 text-xs"></i>
                          <span className="text-sm font-bold text-foreground-900">{b.rating}</span>
                          <span className="text-xs text-foreground-500">({b.reviewCount})</span>
                          {highlightDiffs && diffState.rating && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Differs from others"></span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-foreground-600 leading-relaxed">
                        {highlightDiffs && (
                          <span className="inline-flex items-center gap-1 mr-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 inline-block shrink-0 align-middle"></span>
                          </span>
                        )}
                        {b.description}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-background-200/50">
                        <div className="flex items-start gap-2">
                          <i className="ri-map-pin-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
                          <span className="text-xs text-foreground-600">{b.address}</span>
                          {highlightDiffs && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-0.5 shrink-0" title="Differs from others"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="ri-time-line text-foreground-400 text-sm shrink-0"></i>
                          <span className="text-xs text-foreground-600">{b.openingHours}</span>
                          {highlightDiffs && diffState.openingHours && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Differs from others"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="ri-phone-line text-foreground-400 text-sm shrink-0"></i>
                          <a href={`tel:${b.phone}`} className="text-xs text-foreground-800 hover:text-primary-500 cursor-pointer">{b.phone}</a>
                          {highlightDiffs && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Differs from others"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="ri-mail-line text-foreground-400 text-sm shrink-0"></i>
                          <a href={`mailto:${b.email}`} className="text-xs text-foreground-800 hover:text-primary-500 cursor-pointer break-all">{b.email}</a>
                          {highlightDiffs && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 shrink-0" title="Differs from others"></span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {b.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-background-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="ri-sticky-note-line text-foreground-400 text-sm shrink-0"></i>
                          <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("compare.myNotes")}</span>
                        </div>
                        <textarea
                          value={notes[b.id] || ""}
                          onChange={(e) => setNote(b.id, e.target.value)}
                          placeholder={t("compare.notePlaceholder")}
                          rows={3}
                          className="w-full px-3 py-2 text-sm text-foreground-700 bg-background-50 border border-background-200 rounded-lg resize-y focus:outline-none focus:border-primary-300 focus:ring-1 focus:ring-primary-200 placeholder:text-foreground-300 transition-colors"
                        ></textarea>
                      </div>

                      <Link
                        to={`/business/${b.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer mt-2"
                      >
                        <i className="ri-arrow-right-line text-sm"></i>
                        {t("compare.viewFullDetails")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="w-full px-4 md:px-8 lg:px-12 pb-20 bg-background-50">
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-accent-100">
                <i className="ri-scales-line text-accent-500 text-2xl"></i>
              </div>
              <h2 className="font-heading text-xl text-foreground-900 mb-2">{t("compare.empty")}</h2>
              <p className="text-sm text-foreground-500 max-w-sm mx-auto mb-6">
                {t("compare.emptyDescription")}
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-compass-3-line"></i>
                {t("compare.browseDirectory")}
              </Link>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-background-50">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 md:p-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 mb-6">
                <i className="ri-store-2-line text-white/80 text-sm"></i>
                <span className="text-sm font-medium text-white/80">{t("business.discoverMore")}</span>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
                {t("compare.readyToExplore")}
              </h2>
              <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto mb-8">
                {t("compare.exploreDescription")}
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary-600 text-sm font-medium hover:bg-white/90 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-compass-3-line"></i>
                {t("compare.exploreDirectory")}
              </Link>
            </div>
          </div>
        </section>

        {/* Printable Report Modal */}
        {showReport && hasData && (
          <>
            {/* Print-only styles */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #comparison-report,
                #comparison-report * {
                  visibility: visible;
                }
                #comparison-report {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 0;
                }
                #comparison-report .no-print {
                  display: none !important;
                }
                @page {
                  size: A4 landscape;
                  margin: 12mm;
                }
              }
            `}</style>

            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 pb-8 overflow-y-auto no-print" onClick={() => setShowReport(false)}>
              <div
                className="bg-white rounded-2xl max-w-6xl w-full mx-4 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-background-200 no-print">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                      <i className="ri-file-list-3-line text-primary-500"></i>
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground-900">{t("compare.report")}</h3>
                      <p className="text-xs text-foreground-500">{t("compare.reportReady")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground-200 text-sm text-foreground-700 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-share-forward-line text-sm"></i>
                      {t("compare.share")}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-printer-line text-sm"></i>
                      {t("compare.print")}
                    </button>
                    <button
                      onClick={() => setShowReport(false)}
                      className="w-9 h-9 rounded-full flex items-center justify-center border border-foreground-200 text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                </div>

                {/* Report content */}
                <div id="comparison-report" ref={reportRef} className="bg-white">
                  {/* Report header */}
                  <div className="px-8 pt-8 pb-6 border-b-2 border-foreground-900">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="font-heading text-2xl font-bold text-foreground-900 mb-1">{t("compare.reportTitle")}</h1>
                        <p className="text-sm text-foreground-500">{t("compare.localDirectory")}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-foreground-400 mb-1">{t("compare.generatedOn")}</div>
                        <div className="text-sm font-medium text-foreground-700">
                          {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {selectedBusinesses.map((b, i) => (
                        <span key={b.id} className="inline-flex items-center gap-1.5 text-sm text-foreground-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0"></span>
                          {b.name}
                          {i < selectedBusinesses.length - 1 && <span className="text-foreground-300 mx-1">vs</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Report table */}
                  <div className="px-8 py-6">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] border-collapse">
                        <colgroup>
                          <col style={{ width: "150px" }} />
                          {selectedBusinesses.map((b) => (
                            <col key={`report-col-${b.id}`} />
                          ))}
                        </colgroup>

                        <thead>
                          <tr className="border-b border-foreground-200">
                            <th className="py-3 pr-4 text-left"></th>
                            {selectedBusinesses.map((b) => (
                              <th key={b.id} className="py-3 px-4 text-left">
                                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3">
                                  <img
                                    src={b.image}
                                    alt={b.name}
                                    className="w-full h-full object-cover object-top"
                                  />
                                </div>
                                <p className="font-heading font-semibold text-sm text-foreground-900 leading-tight">{b.name}</p>
                                <p className="text-xs text-foreground-500 mt-0.5">{b.subcategory}</p>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {/* Category */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.category")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4 text-sm text-foreground-800">
                                {getCategoryInfo(b.category)?.name || b.category}
                              </td>
                            ))}
                          </tr>

                          {/* Price Range */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.price")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-foreground-100 text-sm font-semibold text-foreground-800 whitespace-nowrap">
                                  {priceRangeLabel[b.priceRange] || b.priceRange}
                                </span>
                              </td>
                            ))}
                          </tr>

                          {/* Rating */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.rating")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold text-foreground-900">{b.rating}</span>
                                  <StarRating rating={b.rating} />
                                  <span className="text-xs text-foreground-500">({b.reviewCount} reviews)</span>
                                </div>
                              </td>
                            ))}
                          </tr>

                          {/* Description */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4 align-top">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.about")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4 text-sm text-foreground-700 leading-relaxed align-top">
                                {b.description}
                              </td>
                            ))}
                          </tr>

                          {/* Address */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.address")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4 text-sm text-foreground-700 leading-relaxed">
                                {b.address}
                              </td>
                            ))}
                          </tr>

                          {/* Opening Hours */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.hours")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4 text-sm text-foreground-700 whitespace-nowrap">
                                {b.openingHours}
                              </td>
                            ))}
                          </tr>

                          {/* Contact info */}
                          <tr className="border-b border-background-200">
                            <td className="py-2.5 pr-4">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("compare.contact")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4 text-sm text-foreground-700">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <i className="ri-phone-line text-foreground-400 text-xs shrink-0"></i>
                                    <span>{b.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <i className="ri-mail-line text-foreground-400 text-xs shrink-0"></i>
                                    <span className="break-all">{b.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <i className="ri-global-line text-foreground-400 text-xs shrink-0"></i>
                                    <span className="break-all">{b.website.replace("https://", "").replace("http://", "").replace(/\/$/, "")}</span>
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>

                          {/* Tags */}
                          <tr>
                            <td className="py-2.5 pr-4 align-top">
                              <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.tags")}</span>
                            </td>
                            {selectedBusinesses.map((b) => (
                              <td key={b.id} className="py-2.5 px-4 align-top">
                                <div className="flex flex-wrap gap-1.5">
                                  {b.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 rounded-full bg-foreground-100 text-foreground-700 text-xs font-medium whitespace-nowrap">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            ))}
                          </tr>

                          {/* Notes */}
                          {Object.values(notes).some((n: string) => n.trim()) && (
                            <tr>
                              <td className="py-2.5 pr-4 align-top">
                                <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t("public.notes")}</span>
                              </td>
                              {selectedBusinesses.map((b) => (
                                <td key={b.id} className="py-2.5 px-4 text-sm text-foreground-700 leading-relaxed align-top whitespace-pre-wrap">
                                  {notes[b.id] || <span className="text-foreground-300 italic">{t("compare.noNotes")}</span>}
                                </td>
                              ))}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Report footer */}
                  <div className="px-8 py-5 border-t border-background-200">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground-500 mb-1">
                          {t("compare.businessDirectory")}
                        </p>
                        <p className="text-[11px] text-foreground-400">
                          {t("compare.generated", { date: new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }) })}
                        </p>
                      </div>
                      {qrDataUrl && (
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[11px] font-semibold text-foreground-600 mb-0.5 whitespace-nowrap">{t("compare.viewOnline")}</p>
                            <p className="text-[10px] text-foreground-400 whitespace-nowrap">{t("compare.scanToCompare")}</p>
                          </div>
                          <div className="w-[72px] h-[72px] rounded-lg overflow-hidden border border-foreground-200 shrink-0">
                            <img
                              src={qrDataUrl}
                              alt="QR code linking to this comparison"
                              className="w-full h-full object-contain"
                              width="72"
                              height="72"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
