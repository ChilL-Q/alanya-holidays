import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { blogService, type BlogPostItem, type GuideContent, type ChecklistItem } from "@/api-services/blog.service";
import { guideContents } from "@/domain/guide-contents";
import { ArticleContentRenderer } from "@/components/article";
import { sanitizeForumHtml } from "@/utils/sanitizeHtml";

interface GuideModalProps {
  guide: BlogPostItem;
  onClose: () => void;
}

export function getGuideCoverImage(guide: {
  cover_image_url?: string | null;
  tag?: string;
  category?: string;
  title?: string;
}): string {
  if (guide.cover_image_url && !guide.cover_image_url.includes("placeholder-business")) {
    return guide.cover_image_url;
  }
  const text = `${guide.title || ""} ${guide.tag || ""} ${guide.category || ""}`.toLowerCase();
  if (
    text.includes("transfer") ||
    text.includes("airport") ||
    text.includes("taxi") ||
    text.includes("transport") ||
    text.includes("driver") ||
    text.includes("car") ||
    text.includes("bus")
  ) {
    return "/images/categories/transport.webp";
  }
  if (
    text.includes("food") ||
    text.includes("restaurant") ||
    text.includes("dining") ||
    text.includes("eat") ||
    text.includes("breakfast") ||
    text.includes("kahvaltı") ||
    text.includes("cafe")
  ) {
    return "/images/home/turkish_cuisine.webp";
  }
  if (
    text.includes("beach") ||
    text.includes("cleopatra") ||
    text.includes("sea") ||
    text.includes("swim") ||
    text.includes("cove") ||
    text.includes("plaj")
  ) {
    return "/images/home/cleopatra_beach.webp";
  }
  if (
    text.includes("day trip") ||
    text.includes("canyon") ||
    text.includes("dim") ||
    text.includes("mountain") ||
    text.includes("waterfall") ||
    text.includes("nature") ||
    text.includes("safari")
  ) {
    return "/images/home/dim_river.webp";
  }
  if (
    text.includes("night") ||
    text.includes("bar") ||
    text.includes("club") ||
    text.includes("party") ||
    text.includes("music")
  ) {
    return "/images/alanya-bazaar-hero.webp";
  }
  if (
    text.includes("expat") ||
    text.includes("living") ||
    text.includes("apartment") ||
    text.includes("move") ||
    text.includes("real estate") ||
    text.includes("ikamet")
  ) {
    return "/images/categories/accommodations.webp";
  }
  return "/images/home/alanya_castle.webp";
}

export default function GuideModal({ guide, onClose }: GuideModalProps) {
  const initialContent = guideContents[guide.title] || (guide.slug ? guideContents[guide.slug] : null) || null;
  const [content, setContent] = useState<GuideContent | null>(initialContent);
  const [isLoadingContent, setIsLoadingContent] = useState(!initialContent);

  const storageKey = `guide-checklist-${guide.title}`;

  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return new Set(JSON.parse(stored));
    } catch {
      /* corrupted data, start fresh */
    }
    return new Set();
  });

  useEffect(() => {
    let isMounted = true;
    const staticRes = guideContents[guide.title] || (guide.slug ? guideContents[guide.slug] : null);
    if (staticRes) {
      setContent(staticRes);
      setIsLoadingContent(false);
      return;
    }
    setIsLoadingContent(true);
    blogService
      .getGuideContent(guide.slug || guide.title)
      .then((res) => {
        if (isMounted) {
          setContent(res);
          setIsLoadingContent(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingContent(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [guide.title, guide.slug]);

  const toggleItem = useCallback(
    (id: string) => {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        localStorage.setItem(storageKey, JSON.stringify([...next]));
        return next;
      });
    },
    [storageKey]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const heroImage =
    content?.heroImage && !content.heroImage.includes("placeholder-business")
      ? content.heroImage
      : getGuideCoverImage(guide);

  const tag = guide.tag || guide.category || "General";
  const readTime = guide.readTime || "8 min read";
  const description = guide.description || guide.excerpt || "";

  // Check if description is a non-truncated, standalone intro (avoiding cutoff excerpt ending in "...")
  const isTruncatedDesc = description.endsWith("...") || description.endsWith("…");
  const firstSectionBody = content?.sections[0]?.body || "";
  const isDuplicateOfFirstParagraph = firstSectionBody.trim().startsWith(description.trim().slice(0, 40));
  const showStandaloneIntro = description && !isTruncatedDesc && !isDuplicateOfFirstParagraph && description.length > 25;

  return (
    <div
      className="guide-modal-wrapper fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={guide.title}
    >
      <div
        className="print-hide fixed inset-0 bg-foreground-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="guide-modal-card relative z-10 w-full max-w-3xl mx-4 my-8 md:my-12">
        <button
          onClick={() => window.print()}
          className="print-hide absolute top-4 right-16 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md backdrop-blur-md transition-all cursor-pointer text-foreground-700 border border-slate-200/80"
          aria-label="Print or save as PDF"
          title="Print or save as PDF"
        >
          <i className="ri-printer-line text-lg"></i>
        </button>

        <button
          onClick={onClose}
          className="print-hide absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md backdrop-blur-md transition-all cursor-pointer text-foreground-700 border border-slate-200/80"
          aria-label="Close guide"
        >
          <i className="ri-close-line text-xl"></i>
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
          {isLoadingContent ? (
            <div className="p-16 text-center">
              <i className="ri-loader-4-line animate-spin text-4xl text-primary-500 mb-4 block mx-auto"></i>
              <p className="text-foreground-500 text-sm">Loading guide details...</p>
            </div>
          ) : content ? (
            <>
              <div className="w-full h-56 md:h-72 overflow-hidden relative bg-slate-900">
                <img
                  src={heroImage}
                  alt={guide.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6 md:p-8 pointer-events-none">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-foreground-900 text-xs font-semibold tracking-wide shadow-xs">
                    <i className="ri-compass-3-line text-primary-600"></i>
                    {tag} • Alanya Travel Guide
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-10">
                <div className="print-hide flex flex-wrap items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
                  <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-900 text-xs font-bold tracking-wide uppercase whitespace-nowrap shadow-xs">
                    {tag}
                  </span>
                  <span className="text-xs font-semibold text-foreground-700 bg-background-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <i className="ri-time-line text-primary-600"></i>
                    {readTime}
                  </span>
                  {guide.author_name && (
                    <span className="text-xs text-foreground-500 flex items-center gap-1.5">
                      <i className="ri-user-3-line text-foreground-400"></i>
                      {guide.author_name}
                    </span>
                  )}
                </div>

                <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl text-foreground-950 font-bold mb-6 tracking-tight leading-snug">
                  {guide.title}
                </h2>

                {showStandaloneIntro && (
                  <div className="bg-primary-50/70 border-l-4 border-primary-500 rounded-r-2xl p-5 mb-8 shadow-xs">
                    <p className="text-foreground-900 font-medium text-base md:text-[17px] leading-relaxed">
                      {description}
                    </p>
                  </div>
                )}

                <div className="space-y-8">
                  {content.sections.map((section, idx) => {
                    const isDuplicateHeading =
                      !section.heading ||
                      section.heading.trim().toLowerCase() === guide.title.trim().toLowerCase();

                    const bodyText = section.body;
                    const isHtml = /<[a-z][\s\S]*>/i.test(bodyText);

                    return (
                      <article key={section.heading || `section-${idx}`} className="space-y-4">
                        {!isDuplicateHeading && (
                          <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground-950 pt-2 mb-3 tracking-tight">
                            {section.heading}
                          </h3>
                        )}
                        {isHtml ? (
                          <div
                            className="prose prose-slate max-w-none text-foreground-900 leading-relaxed space-y-4"
                            dangerouslySetInnerHTML={{ __html: sanitizeForumHtml(bodyText) }}
                          />
                        ) : (
                          <ArticleContentRenderer content={bodyText} />
                        )}
                      </article>
                    );
                  })}

                  {content.checklist && content.checklist.length > 0 && (
                    <ChecklistBlock
                      title={content.checklistTitle || "Checklist"}
                      items={content.checklist}
                      checkedItems={checkedItems}
                      onToggle={toggleItem}
                    />
                  )}

                  {content.relatedLinks && content.relatedLinks.length > 0 && (
                    <div className="print-hide border-t border-slate-200 pt-8 mt-8">
                      <h4 className="font-heading text-sm text-foreground-500 uppercase tracking-wide mb-4">
                        Keep Exploring
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {content.relatedLinks.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            onClick={onClose}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-sm text-foreground-800 transition-all cursor-pointer whitespace-nowrap bg-slate-50"
                          >
                            <i className={`${link.icon} text-primary-500 text-sm`}></i>
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <i className="ri-article-line text-4xl text-foreground-300 mb-4 block"></i>
              <p className="text-foreground-500">Full guide content coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChecklistBlock({
  title,
  items,
  checkedItems,
  onToggle,
}: {
  title: string;
  items: ChecklistItem[];
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
}) {
  const checkedCount = items.filter((i) => checkedItems.has(i.id)).length;
  const totalCount = items.length;
  const progressPercent =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const allDone = checkedCount === totalCount;

  return (
    <section className="print-hide border-t border-slate-200 pt-8 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent-100">
            <i
              className={`text-lg ${
                allDone
                  ? "ri-check-double-line text-emerald-600"
                  : "ri-list-check-3 text-accent-600"
              }`}
            ></i>
          </div>
          <h3 className="font-heading text-lg text-foreground-900 font-bold">{title}</h3>
        </div>
        <span className="text-sm text-foreground-500 font-medium whitespace-nowrap">
          {checkedCount} of {totalCount}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: allDone
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, #f97316, #fb923c)",
          }}
        />
      </div>

      {allDone && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <i className="ri-emotion-happy-line text-emerald-600 text-xl"></i>
          <p className="text-sm text-emerald-800 font-medium">
            Everything is checked off &mdash; you are ready for Alanya!
          </p>
        </div>
      )}

      <ul className="space-y-1">
        {items.map((item) => {
          const checked = checkedItems.has(item.id);
          return (
            <li key={item.id}>
              <label
                className={`flex items-start gap-3 px-3 py-2.5 -mx-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 group ${
                  checked ? "opacity-70" : ""
                }`}
              >
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(item.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      checked
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 group-hover:border-accent-400 bg-white"
                    }`}
                  >
                    {checked && (
                      <i className="ri-check-line text-white text-xs font-bold"></i>
                    )}
                  </div>
                </div>
                <span
                  className={`text-sm leading-snug transition-all duration-200 select-none ${
                    checked
                      ? "text-foreground-400 line-through decoration-emerald-400/60"
                      : "text-foreground-800"
                  }`}
                >
                  {item.text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}