import { useMemo, useState } from "react";
import { type ForumEvent } from "@/mocks/events";

interface MapViewProps {
  events: ForumEvent[];
  rsvpdEvents: Set<string>;
  onRsvp: (eventId: string) => void;
  onCancelRsvp: (eventId: string) => void;
}

const locationCoords: Record<string, { lat: number; lng: number; label: string }> = {
  "Cleopatra Beach, Alanya": { lat: 36.5483, lng: 31.9987, label: "Cleopatra Beach" },
  "Cleopatra Beach Courts": { lat: 36.5488, lng: 31.9992, label: "Cleopatra Beach Courts" },
  "Alanya Harbor": { lat: 36.5358, lng: 31.9986, label: "Alanya Harbor" },
  "The Local Pub, Alanya": { lat: 36.5442, lng: 32.0015, label: "The Local Pub" },
  "Taurus Mountains Trailhead": { lat: 36.5900, lng: 32.1200, label: "Taurus Trailhead" },
  "Coworking Alanya, Oba": { lat: 36.5240, lng: 32.0010, label: "Coworking Oba" },
  "Keykubat Beach, Alanya": { lat: 36.5400, lng: 31.9900, label: "Keykubat Beach" },
  "Zeynep's Kitchen, Alanya": { lat: 36.5470, lng: 32.0050, label: "Zeynep's Kitchen" },
  "Alanya Castle Entrance": { lat: 36.5337, lng: 31.9925, label: "Alanya Castle" },
  "Coffice Alanya, Mahmutlar": { lat: 36.4900, lng: 32.0900, label: "Coffice Mahmutlar" },
  "İncekum Beach, Alanya": { lat: 36.5600, lng: 31.9600, label: "İncekum Beach" },
  "Rooftop Restaurant, Alanya Center": { lat: 36.5450, lng: 32.0000, label: "Rooftop Restaurant" },
  "Alanya Dive Center, Harbor": { lat: 36.5360, lng: 31.9970, label: "Dive Center" },
  "Ahmet's Tea Garden, Alanya": { lat: 36.5460, lng: 32.0030, label: "Ahmet's Tea Garden" },
  "Innovation Hub, Alanya": { lat: 36.5480, lng: 32.0080, label: "Innovation Hub" },
  "Alanya Central Park": { lat: 36.5475, lng: 32.0020, label: "Central Park" },
  "Beachfront Plaza, Alanya": { lat: 36.5420, lng: 31.9950, label: "Beachfront Plaza" },
  "Departure from Alanya Center": { lat: 36.5450, lng: 31.9990, label: "Alanya Center" },
};

export default function MapView({ events, rsvpdEvents, onRsvp, onCancelRsvp }: MapViewProps) {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const locationGroups = useMemo(() => {
    const groups: Record<string, ForumEvent[]> = {};
    events.forEach((event) => {
      if (!groups[event.location]) {
        groups[event.location] = [];
      }
      groups[event.location].push(event);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [events]);

  const handleLocationClick = (location: string) => {
    setActiveLocation((prev) => (prev === location ? null : location));
  };

  return (
    <div>
      {/* Map Section */}
      <div className="rounded-2xl overflow-hidden border border-background-200 mb-6">
        <div className="relative w-full h-[400px] md:h-[500px]">
          <iframe
            src="https://maps.google.com/maps?q=Alanya+Antalya+Turkey&z=13&output=embed"
            width="100%"
            height="100%"
            className="absolute inset-0 border-0"
            title="Alanya Events Map"
            loading="lazy"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {locationGroups.map(([location, locationEvents]) => {
          const coord = locationCoords[location];
          const isActive = activeLocation === location;
          const totalAttendees = locationEvents.reduce((sum, e) => sum + e.attendees, 0);

          return (
            <div
              key={location}
              className="bg-white rounded-xl border border-background-200 overflow-hidden transition-all hover:border-background-300"
            >
              {/* Location Header */}
              <button
                onClick={() => handleLocationClick(location)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer hover:bg-background-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-map-pin-line text-accent-600 text-lg"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-sm text-foreground-900 truncate">
                    {coord?.label ?? location}
                  </h4>
                  <p className="text-xs text-foreground-500">
                    {locationEvents.length} {locationEvents.length === 1 ? "event" : "events"} &middot;{" "}
                    {totalAttendees} going
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-accent-100 text-accent-700 font-medium px-2 py-0.5 rounded-full">
                    {locationEvents.length}
                  </span>
                  <i
                    className={`ri-arrow-down-s-line text-foreground-400 transition-transform duration-200 ${
                      isActive ? "rotate-180" : ""
                    }`}
                  ></i>
                </div>
              </button>

              {/* Event List (expandable) */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isActive ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-4 pb-4 space-y-3">
                  {locationEvents.map((event) => {
                    const isRsvpd = rsvpdEvents.has(event.id);
                    const isFull = event.attendees >= event.maxAttendees && !isRsvpd;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background-50 border border-background-100"
                      >
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-heading text-sm text-foreground-900 mb-0.5 line-clamp-1">
                            {event.title}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-foreground-500 mb-1.5">
                            <span className="flex items-center gap-1">
                              <i className="ri-calendar-line text-xs"></i>
                              {event.month} {event.day}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-time-line text-xs"></i>
                              {event.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => (isRsvpd ? onCancelRsvp(event.id) : onRsvp(event.id))}
                              disabled={isFull}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                                isRsvpd
                                  ? "bg-accent-100 text-accent-700 hover:bg-accent-200"
                                  : isFull
                                    ? "bg-background-200 text-foreground-400 cursor-not-allowed"
                                    : "bg-primary-500 text-white hover:bg-primary-600"
                              }`}
                            >
                              {isRsvpd ? (
                                <>
                                  <i className="ri-check-line text-xs"></i>
                                  Going
                                </>
                              ) : isFull ? (
                                "Full"
                              ) : (
                                "RSVP"
                              )}
                            </button>
                            <span className="text-[11px] text-foreground-400 flex items-center gap-1">
                              <i className="ri-user-line text-xs"></i>
                              {event.attendees}/{event.maxAttendees}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}