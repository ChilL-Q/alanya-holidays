import PageHeroImage from "@/components/base/PageHeroImage";

interface EventHeroProps {
  totalEvents: number;
  eventsThisMonth: number;
  onHostEvent: () => void;
  showHostButton?: boolean;
}

export default function EventHero({
  totalEvents,
  eventsThisMonth,
  onHostEvent,
  showHostButton = true,
}: EventHeroProps) {
  return (
    <section className="relative w-full h-[280px] md:h-[360px] overflow-hidden">
      <PageHeroImage
        page="events"
        alt="Alanya Holidays Events"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/55 via-foreground-950/30 to-foreground-950/75"></div>

      <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
        <div className="flex items-center gap-2 mb-4">
          <a href="/" className="text-white/60 hover:text-white/90 text-sm transition-colors underline underline-offset-2">
            Home
          </a>
          <i className="ri-arrow-right-s-line text-white/40 text-sm"></i>
          <span className="text-white/90 text-sm">Events</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-5xl text-white mb-2">
              Community Events
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-xl">
              From beach meetups to hiking adventures, find your next experience and connect with
              the Alanya community in real life.
            </p>
          </div>

          <div className="flex items-center gap-5 md:gap-8 shrink-0">
            <div className="text-center">
              <p className="text-white text-xl md:text-2xl font-semibold">{totalEvents}</p>
              <p className="text-white/50 text-xs">Upcoming</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center">
              <p className="text-white text-xl md:text-2xl font-semibold">{eventsThisMonth}</p>
              <p className="text-white/50 text-xs">This Month</p>
            </div>
            {showHostButton && (
              <>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <button
                    onClick={onHostEvent}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-add-line"></i>
                    Host an Event
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}