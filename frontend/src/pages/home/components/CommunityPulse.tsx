import { Link } from "react-router-dom";
import { events } from "@/mocks/events";
import { forumStats } from "@/mocks/stats";

export default function CommunityPulse() {
  return (
    <section id="events" className="py-16 md:py-24">
      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Image */}
        <div className="relative w-full lg:w-1/2 h-80 lg:h-auto lg:min-h-[600px]">
          <img
            src="https://readdy.ai/api/search-image?query=Alanya%20harbor%20at%20sunset%20with%20boats%20and%20medieval%20castle%20silhouette%20warm%20golden%20light%20reflections%20on%20water%20atmospheric%20landscape%20editorial%20photography%20stunning%20composition&width=900&height=700&seq=pulse-harbor-01&orientation=landscape"
            alt="Alanya Harbor"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
          {/* Label */}
          <span className="absolute top-6 left-6 text-white/80 text-xs font-medium tracking-wider uppercase">
            This Week
          </span>
          {/* Title */}
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              <span className="block font-light">UPCOMING</span>
              <span className="block font-bold">EVENTS</span>
            </h2>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-1/2 bg-white px-6 md:px-10 lg:px-12 py-10 md:py-14 lg:py-16">
          <h3 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-6">
            Community Pulse
          </h3>

          <p className="text-foreground-600 text-sm md:text-base leading-relaxed mb-8">
            {forumStats.activeThisWeek.toLocaleString()} members were active this
            week. Join the conversations, attend meetups, and be part of the
            growing Alanya community.
          </p>

          {/* Events List */}
          <div className="space-y-4">
            {events.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                to="/events"
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-50 transition-colors group cursor-pointer"
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-sm text-foreground-900 mb-1 group-hover:text-primary-500 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-foreground-500">
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-map-pin-line"></i>
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary-500 font-medium">
                  <i className="ri-user-line"></i>
                  {event.attendees}
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-700 text-white rounded-full text-sm font-medium hover:bg-secondary-800 transition-colors"
            >
              View All Events
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}