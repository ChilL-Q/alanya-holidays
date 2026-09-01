interface ThreadFiltersProps {
  totalThreads: number;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { value: "latest", label: "Latest", icon: "ri-time-line" },
  { value: "hot", label: "Most Active", icon: "ri-fire-line" },
  { value: "popular", label: "Most Viewed", icon: "ri-eye-line" },
  { value: "unreplied", label: "Unanswered", icon: "ri-chat-1-line" },
];

export default function ThreadFilters({
  totalThreads,
  sortBy,
  onSortChange,
}: ThreadFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
      {/* Thread count */}
      <p className="text-sm text-foreground-600">
        <span className="font-semibold text-foreground-900">
          {totalThreads}
        </span>{" "}
        discussions
      </p>

      {/* Sort tabs */}
      <div className="flex items-center bg-background-100 rounded-full p-1 gap-0.5 overflow-x-auto scrollbar-hide">
        {sortOptions.map((opt) => (
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
  );
}