import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import PageHeroImage from "@/components/base/PageHeroImage";
import GuideModal from "@/pages/travel-guides/components/GuideModal";
import SubmitGuideModal from "@/pages/travel-guides/components/SubmitGuideModal";
import { useAuth } from "@/context/AuthContext";
import {
  blogService,
  mockTravelGuides,
  type BlogPostItem,
  type BlogTag,
} from "@/api-services/blog.service";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";

export default function TravelGuidesPage() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [guides, setGuides] = useState<BlogPostItem[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGuide, setSelectedGuide] = useState<BlogPostItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tags on mount
  useEffect(() => {
    let isMounted = true;
    blogService
      .getTags()
      .then((fetchedTags) => {
        if (isMounted && Array.isArray(fetchedTags) && fetchedTags.length > 0) {
          setTags(fetchedTags);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch blog tags:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch posts whenever selected tag or search changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const categoryParam = selectedTag === "All" ? undefined : selectedTag;
    const searchParam = searchQuery.trim() || undefined;

    blogService
      .getPosts({
        contentType: "guide",
        category: categoryParam,
        search: searchParam,
      })
      .then((res) => {
        if (isMounted) {
          if (res && Array.isArray(res.posts) && res.posts.length > 0) {
            setGuides(res.posts);
          } else if (selectedTag === "All" && !searchParam) {
            setGuides(mockTravelGuides);
          } else {
            setGuides(res.posts || []);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch guides:", err);
        if (isMounted) {
          setGuides(selectedTag === "All" && !searchParam ? mockTravelGuides : []);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTag, searchQuery]);

  const totalReadingTime = useMemo(() => {
    let total = 0;
    guides.forEach((g) => {
      const match = (g.readTime || "").match(/\d+/);
      if (match) total += parseInt(match[0], 10);
    });
    return total;
  }, [guides]);

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    setTimeout(() => {
      window.print();
      setIsPrintingAll(false);
    }, 200);
  };

  const handleSubmitGuide = () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: location },
      });
      return;
    }
    setIsSubmitModalOpen(true);
  };

  return (
    <>
      <div className="print-hide">
        <Navbar />
      </div>
      <main>
        {/* Hero Section */}
        <section className="print-hide relative w-full h-[320px] md:h-[420px] overflow-hidden">
          <PageHeroImage
            page="travelGuides"
            alt={t("public.guides.heroAlt")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/40 to-foreground-950/80"></div>

          <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-4">
              <Link
                to="/"
                className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2"
              >
                {t("nav.home")}
              </Link>
              <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
              <span className="text-white/90 text-sm">{t("public.travelGuides")}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">
                  {t("public.travelGuides")}
                </h1>
                <p className="text-white/75 text-sm md:text-base max-w-xl">
                  {t("public.guides.description")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSubmitGuide}
                  disabled={authLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap disabled:cursor-wait disabled:opacity-70"
                >
                  <i className="ri-quill-pen-line text-base"></i>
                  {t("public.guides.submit")}
                </button>
                <button
                  onClick={handlePrintAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-medium transition-all border border-white/20 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-file-pdf-2-line text-base"></i>
                  {t("public.guides.downloadPdf")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="print-hide w-full px-4 md:px-8 lg:px-12 py-12 md:py-20 bg-background-50">
          <div className="max-w-6xl mx-auto">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-foreground-100">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedTag("All")}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedTag === "All"
                      ? "bg-primary-500 text-white shadow-sm"
                      : "bg-white border border-foreground-200 text-foreground-700 hover:border-primary-300 hover:text-primary-600"
                  }`}
                >
                  {t("public.allCategories")}
                </button>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTag(t.name)}
                    className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedTag === t.name
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-white border border-foreground-200 text-foreground-700 hover:border-primary-300 hover:text-primary-600"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[240px]">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("public.guides.searchPlaceholder")}
                  className="w-full pl-9 pr-8 py-2 rounded-full border border-foreground-200 bg-white text-xs md:text-sm text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-foreground-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600"
                    aria-label="Clear search"
                  >
                    <i className="ri-close-circle-line text-sm"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Guides Grid */}
            {isLoading && guides.length === 0 ? (
              <div className="py-20 text-center">
                <i className="ri-loader-4-line animate-spin text-3xl text-primary-500 mb-3 block mx-auto"></i>
                <p className="text-foreground-500 text-sm">{t("public.guides.loading")}</p>
              </div>
            ) : guides.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-background-200 p-8">
                <i className="ri-compass-3-line text-5xl text-foreground-300 mb-4 block"></i>
                <h3 className="font-heading text-lg text-foreground-800 mb-2">{t("public.guides.noGuides")}</h3>
                <p className="text-sm text-foreground-500 max-w-md mx-auto mb-6">
                  {t("public.guides.noGuidesDescription")}
                </p>
                <button
                  onClick={() => {
                    setSelectedTag("All");
                    setSearchQuery("");
                  }}
                  className="px-5 py-2 rounded-full bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer"
                >
                  {t("public.resetFilters")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {guides.map((guide) => {
                  const icon = guide.icon || "ri-book-open-line";
                  const tag = guide.tag || guide.category || "General";
                  const readTime = guide.readTime || "8 min read";
                  const description = guide.description || guide.excerpt || "";

                  return (
                    <div
                      key={guide.id || guide.title}
                      onClick={() => setSelectedGuide(guide)}
                      className="bg-white rounded-2xl p-6 md:p-7 border border-background-200/70 hover:border-primary-200/60 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedGuide(guide);
                      }}
                    >
                      <div>
                        <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary-100 group-hover:bg-primary-200 transition-colors mb-4">
                          <i className={`${icon} text-primary-600 text-lg`}></i>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
                            {tag}
                          </span>
                          <span className="text-xs text-foreground-400">{readTime}</span>
                        </div>
                        <h3 className="font-heading text-base text-foreground-900 mb-2 group-hover:text-primary-600 transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-foreground-500 leading-relaxed line-clamp-3 mb-4">
                          {description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-background-100 flex items-center justify-between text-xs text-primary-600 font-medium">
                        <span>{t("public.guides.readFull")}</span>
                        <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <div className="print-hide">
        <Footer />
      </div>

      {/* Print View for All Guides */}
      {isPrintingAll && (
        <div className="all-guides-print print-only hidden w-full max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-10">
            <h1 className="font-heading text-2xl text-foreground-900 mb-2">
              {t("public.guides.printTitle")}
            </h1>
            <p className="text-sm text-foreground-500">
              {t("public.guides.printByline")}
            </p>
            <p className="text-sm text-foreground-400 mt-1">
              {t("public.guides.printStats", { count: guides.length, minutes: totalReadingTime })}
            </p>
          </div>

          {guides.map((guide, idx) => {
            const heroImage =
              guide.cover_image_url ||
              "/images/placeholder-business.svg";
            const readTime = guide.readTime || "8 min read";
            const description = guide.description || guide.excerpt || "";

            return (
              <div key={guide.id || guide.title} className="guide-print-entry mb-8">
                {idx > 0 && <hr className="border-t-2 border-foreground-200 mb-8" />}
                <div className="w-full h-40 overflow-hidden rounded-lg mb-4">
                  <img
                    src={heroImage}
                    alt={guide.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h2 className="font-heading text-xl text-foreground-900 mb-1">
                  {guide.title}{" "}
                  <span className="text-sm font-normal text-foreground-400">— {readTime}</span>
                </h2>
                <p className="text-sm text-foreground-500 mb-4 italic">{description}</p>
                {guide.content && (
                  <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">{guide.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <GuideModal
          guide={selectedGuide}
          onClose={() => setSelectedGuide(null)}
        />
      )}

      {/* Community Guide Submission Modal */}
      <SubmitGuideModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        tags={tags}
      />
    </>
  );
}
