import type { ThreadDetail } from "@/api-services/forum.service";

interface AuthorSidebarProps {
  thread: ThreadDetail;
}

export default function AuthorSidebar({ thread }: AuthorSidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden sticky top-24">
        {/* Author card */}
        <div className="p-5 text-center">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-background-200 mb-3">
            <img
              src={thread.authorAvatar}
              alt={thread.author}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="font-heading text-sm text-foreground-900 font-semibold block">
            {thread.author}
          </p>
          <p className="text-xs text-foreground-500 mt-0.5">{thread.authorRole}</p>
        </div>

        {/* Bio */}
        <div className="px-5 pb-4">
          <p className="text-xs text-foreground-600 leading-relaxed text-center">
            {thread.authorBio}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-t border-background-200/70">
          <div className="py-3 text-center">
            <p className="text-sm font-bold text-foreground-900">
              {thread.authorPosts.toLocaleString()}
            </p>
            <p className="text-[10px] text-foreground-400">Posts</p>
          </div>
          <div className="py-3 text-center border-x border-background-200/70">
            <p className="text-sm font-bold text-foreground-900">
              {thread.authorReputation.toLocaleString()}
            </p>
            <p className="text-[10px] text-foreground-400">Rep</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-xs font-bold text-foreground-900">
              {thread.authorJoinDate}
            </p>
            <p className="text-[10px] text-foreground-400">Joined</p>
          </div>
        </div>

        {/* Location & joined */}
        <div className="px-5 py-3 border-t border-background-200/70 space-y-2">
          <div className="flex items-center gap-2 text-xs text-foreground-500">
            <i className="ri-map-pin-line text-foreground-400"></i>
            {thread.authorLocation}
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-500">
            <i className="ri-calendar-line text-foreground-400"></i>
            Joined {thread.authorJoinDate}
          </div>
        </div>

        {/* Badges */}
        <div className="px-5 py-3 border-t border-background-200/70">
          <p className="text-[10px] uppercase tracking-wider text-foreground-300 font-semibold mb-2">
            Badges
          </p>
          <div className="flex flex-wrap gap-1.5">
            {thread.authorBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-[10px] rounded-full font-medium"
              >
                <i className="ri-award-line text-xs"></i>
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-background-200/70 space-y-2">
          <button className="w-full px-3 py-2 rounded-lg bg-background-100 text-foreground-600 text-xs font-medium hover:bg-background-200/70 transition-colors flex items-center justify-center gap-1.5">
            <i className="ri-user-follow-line"></i>
            Follow Author
          </button>
          <button className="w-full px-3 py-2 rounded-lg bg-background-100 text-foreground-600 text-xs font-medium hover:bg-background-200/70 transition-colors flex items-center justify-center gap-1.5">
            <i className="ri-message-2-line"></i>
            Message
          </button>
        </div>
      </div>
    </aside>
  );
}