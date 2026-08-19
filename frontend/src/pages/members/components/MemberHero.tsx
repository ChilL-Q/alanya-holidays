import { forumStats } from "@/mocks/stats";

export default function MemberHero() {
  return (
    <section className="relative w-full h-[280px] md:h-[340px] overflow-hidden">
      <img
        src="https://readdy.ai/api/search-image?query=Diverse%20group%20of%20travelers%20and%20expats%20sitting%20together%20at%20beachfront%20cafe%20in%20Alanya%20Mediterranean%20sea%20background%20warm%20golden%20sunset%20light%20community%20social%20gathering%20atmosphere%20editorial%20photography%20authentic%20candid%20moments&width=1800&height=680&seq=members-hero&orientation=landscape"
        alt="Alanya Holidays Community"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/60 via-foreground-950/35 to-foreground-950/75"></div>

      <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <a href="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
            Home
          </a>
          <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
          <span className="text-white/90 text-sm">Members</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">
              Our Community
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              Meet the travelers, expats, locals, and digital nomads who make Alanya Holidays the
              go-to place for everything Antalya.
            </p>
          </div>

          {/* Live stats bar */}
          <div className="flex items-center gap-5 md:gap-8 shrink-0">
            <div className="text-center">
              <p className="text-white text-xl md:text-2xl font-semibold">
                {forumStats.totalMembers.toLocaleString()}
              </p>
              <p className="text-white/50 text-xs">Members</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
                <p className="text-white text-xl md:text-2xl font-semibold">
                  {forumStats.onlineNow.toLocaleString()}
                </p>
              </div>
              <p className="text-white/50 text-xs">Online Now</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="text-white text-xl md:text-2xl font-semibold">
                {forumStats.activeThisWeek.toLocaleString()}
              </p>
              <p className="text-white/50 text-xs">Active This Week</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}