import { useState } from "react";

interface SubcategorySidebarProps {
  subcategories: string[];
  categoryName: string;
  activeSubcategory: string | null;
  onSelect: (sub: string | null) => void;
}

export default function SubcategorySidebar({
  subcategories,
  categoryName,
  activeSubcategory,
  onSelect,
}: SubcategorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="lg:sticky lg:top-24">
        {/* Mobile toggle */}
        <button
          className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-background-100 rounded-lg mb-3"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span className="text-sm font-semibold text-foreground-900">
            {activeSubcategory || "All Topics"}
          </span>
          <i
            className={`ri-arrow-down-s-line text-foreground-500 transition-transform ${
              collapsed ? "" : "rotate-180"
            }`}
          ></i>
        </button>

        {/* Sidebar content */}
        <div className={`${collapsed ? "hidden" : "block"} lg:block`}>
          <div className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-background-200/50">
              <h3 className="font-heading text-base text-foreground-900">Topics</h3>
              <p className="text-foreground-500 text-xs mt-0.5">
                {subcategories.length} subcategories
              </p>
            </div>

            {/* Subcategory list */}
            <div className="p-2">
              {/* All Topics */}
              <button
                onClick={() => onSelect(null)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                  activeSubcategory === null
                    ? "bg-primary-500 text-background-50 font-medium"
                    : "text-foreground-700 hover:bg-background-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className="ri-apps-2-line text-base"></i>
                  All Topics
                </div>
              </button>

              {subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => onSelect(sub)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                    activeSubcategory === sub
                      ? "bg-primary-500 text-background-50 font-medium"
                      : "text-foreground-700 hover:bg-background-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0"></span>
                    <span className="truncate">{sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats card */}
          <div className="mt-4 bg-accent-100/80 rounded-xl p-5">
            <h4 className="font-heading text-sm text-accent-900 mb-3">
              Why Join {categoryName}?
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-foreground-700">
                <i className="ri-check-line text-accent-500 mt-0.5"></i>
                Connect with like-minded people
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground-700">
                <i className="ri-check-line text-accent-500 mt-0.5"></i>
                Get expert local advice
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground-700">
                <i className="ri-check-line text-accent-500 mt-0.5"></i>
                Share your experiences
              </li>
              <li className="flex items-start gap-2 text-xs text-foreground-700">
                <i className="ri-check-line text-accent-500 mt-0.5"></i>
                Stay updated on trends
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}