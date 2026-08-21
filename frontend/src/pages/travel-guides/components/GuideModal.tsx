import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { guideContents, type ChecklistItem, type GuideContent } from "@/mocks/travelGuideContents";
import { blogService, type BlogPostItem } from "@/api-services/blog.service";
import { ArticleContentRenderer } from "@/components/article";

interface GuideModalProps {
  guide: BlogPostItem;
  onClose: () => void;
}

export default function GuideModal({ guide, onClose }: GuideModalProps) {
  const [content, setContent] = useState<GuideContent | null>(() => {
    return guideContents[guide.title] || null;
  });
  const [isLoadingContent, setIsLoadingContent] = useState(!guideContents[guide.title]);

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
    if (!guideContents[guide.title]) {
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
    } else {
      setContent(guideContents[guide.title]);
      setIsLoadingContent(false);
    }

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

  const heroImage = content?.heroImage || guide.cover_image_url || "https://readdy.ai/api/search-image?query=Alanya%20castle%20and%20Mediterranean%20coast%20sunny%20day&width=1200&height=512&seq=guide-modal-fallback&orientation=landscape";
  const tag = guide.tag || guide.category || "General";
  const readTime = guide.readTime || "8 min read";
  const description = guide.description || guide.excerpt || "";

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
          className="print-hide absolute top-4 right-16 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all cursor-pointer"
          aria-label="Print or save as PDF"
          title="Print or save as PDF"
        >
          <i className="ri-printer-line text-foreground-700 text-lg"></i>
        </button>

        <button
          onClick={onClose}
          className="print-hide absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all cursor-pointer"
          aria-label="Close guide"
        >
          <i className="ri-close-line text-foreground-700 text-xl"></i>
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          {isLoadingContent ? (
            <div className="p-16 text-center">
              <i className="ri-loader-4-line animate-spin text-4xl text-primary-500 mb-4 block mx-auto"></i>
              <p className="text-foreground-500 text-sm">Loading guide details...</p>
            </div>
          ) : content ? (
            <>
              <div className="w-full h-48 md:h-64 overflow-hidden">
                <img
                  src={heroImage}
                  alt={guide.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="p-6 md:p-10">
                <div className="print-hide flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
                    {tag}
                  </span>
                  <span className="text-xs text-foreground-400">{readTime}</span>
                </div>

                <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-2">
                  {guide.title}
                </h2>
                {description && (
                  <p className="text-foreground-500 text-sm md:text-base mb-8">
                    {description}
                  </p>
                )}

                <div className="space-y-8">
                  {content.sections.map((section) => (
                    <article key={section.heading}>
                      <h3 className="font-heading text-lg font-bold text-foreground-900 mb-3">
                        {section.heading}
                      </h3>
                      <ArticleContentRenderer content={section.body} />
                    </article>
                  ))}

                  {content.checklist && content.checklist.length > 0 && (
                    <ChecklistBlock
                      title={content.checklistTitle || "Checklist"}
                      items={content.checklist}
                      checkedItems={checkedItems}
                      onToggle={toggleItem}
                    />
                  )}

                  {content.relatedLinks && content.relatedLinks.length > 0 && (
                    <div className="print-hide border-t border-background-200 pt-8 mt-8">
                      <h4 className="font-heading text-sm text-foreground-500 uppercase tracking-wide mb-4">
                        Keep Exploring
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {content.relatedLinks.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            onClick={onClose}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-background-200 hover:border-primary-200 hover:bg-primary-50 text-sm text-foreground-700 transition-all cursor-pointer whitespace-nowrap"
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
    <section className="print-hide border-t border-background-200 pt-8">
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
          <h3 className="font-heading text-lg text-foreground-900">{title}</h3>
        </div>
        <span className="text-sm text-foreground-400 font-medium whitespace-nowrap">
          {checkedCount} of {totalCount}
        </span>
      </div>

      <div className="w-full h-2 bg-background-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: allDone
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, oklch(var(--accent-500)), oklch(var(--accent-400)))",
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
                className={`flex items-start gap-3 px-3 py-2.5 -mx-3 rounded-lg cursor-pointer transition-colors hover:bg-background-50 group ${
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
                        : "border-background-300 group-hover:border-accent-300 bg-white"
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
                      : "text-foreground-700"
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