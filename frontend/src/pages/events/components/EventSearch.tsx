import { useRef, useEffect } from "react";

interface EventSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function EventSearch({ query, onQueryChange }: EventSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        onQueryChange("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onQueryChange]);

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i className="ri-search-line text-foreground-400 text-sm"></i>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by title, location, or host..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-background-200 rounded-full text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
        />
        {query ? (
          <button
            onClick={() => onQueryChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-foreground-400 hover:text-foreground-600 transition-colors"
            aria-label="Clear search"
          >
            <i className="ri-close-circle-fill text-sm"></i>
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground-400 bg-background-100 border border-background-200">
              <span>⌘</span><span>K</span>
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}