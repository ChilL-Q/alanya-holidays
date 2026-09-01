import { useState, useRef, useEffect } from "react";
import { memberRoles } from "@/api-services/forum.service";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface MemberFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  roleFilter: string | null;
  onRoleChange: (val: string | null) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
}

export default function MemberFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleChange,
  sortBy,
  onSortChange,
}: MemberFiltersProps) {
  const { t } = useTranslation();
  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
          <input
            type="text"
            placeholder={t("public.memberSearch")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-50 border border-background-200/70 rounded-xl text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 transition-colors"
          />
        </div>
        {/* Sort */}
        <div className="flex items-center bg-background-100 rounded-full p-1 gap-0.5 shrink-0 overflow-x-auto scrollbar-hide">
          {[
            { value: "posts", label: t("public.mostPosts"), icon: "ri-chat-3-line" },
            { value: "newest", label: t("public.newest"), icon: "ri-calendar-line" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                sortBy === opt.value
                  ? "bg-background-50 text-foreground-900 shadow-sm"
                  : "text-foreground-500 hover:text-foreground-700"
              }`}
            >
              <i className={`${opt.icon} text-sm`}></i>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Role dropdown */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
              roleFilter
                ? "bg-primary-100 text-primary-700 border-primary-200"
                : "bg-background-50 text-foreground-600 border-background-200/70 hover:border-primary-200/60"
            }`}
          >
            <i className="ri-user-star-line"></i>
            {roleFilter || "All Roles"}
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${roleOpen ? "rotate-180" : ""}`}></i>
          </button>
          {roleOpen && (
            <div className="absolute top-full mt-2 left-0 bg-background-50 border border-background-200/70 rounded-xl shadow-lg p-2 z-20 min-w-[200px] max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  onRoleChange(null);
                  setRoleOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  !roleFilter ? "bg-primary-100 text-primary-700" : "text-foreground-700 hover:bg-background-100"
                }`}
              >
                All Roles
              </button>
              {memberRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onRoleChange(role);
                    setRoleOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    roleFilter === role ? "bg-primary-100 text-primary-700" : "text-foreground-700 hover:bg-background-100"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear filters */}
        {(roleFilter || searchTerm) && (
          <button
            onClick={() => {
              onRoleChange(null);
              onSearchChange("");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-foreground-500 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-circle-line"></i>
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
