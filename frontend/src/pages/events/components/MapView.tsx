import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import type { ForumEvent } from "@/api-services/events.service";
import { ALANYA_CENTER, resolveEventLocationMeta, type EventLocationMeta } from "../locationCoords";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface MapViewProps {
  events: ForumEvent[];
  rsvpdEvents: Set<string>;
  onRsvp: (eventId: string) => void;
  onCancelRsvp: (eventId: string) => void;
}

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const GOOGLE_MAP_LIBRARIES: ["places"] = ["places"];

function getMapFallbackKey(missingKey: boolean, loadError: unknown, markerCount: number) {
  if (missingKey) {
    return "events.mapMissingKey";
  }

  if (loadError) {
    return "events.mapLoadError";
  }

  if (markerCount === 0) {
    return "events.mapNoCoordinates";
  }

  return null;
}

export default function MapView({ events, rsvpdEvents, onRsvp, onCancelRsvp }: MapViewProps) {
  const { t } = useTranslation();
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const hasGoogleMapsApiKey = googleMapsApiKey.trim().length > 0;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "events-google-map",
    googleMapsApiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

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

  const mappedLocations = useMemo(() => {
    return locationGroups
      .map(([location, locationEvents]) => {
        const coord = resolveEventLocationMeta(location);
        if (!coord) return null;

        return {
          location,
          label: coord.label,
          coord,
          events: locationEvents,
          totalAttendees: locationEvents.reduce((sum, event) => sum + event.attendees, 0),
        };
      })
      .filter((item): item is {
        location: string;
        label: string;
        coord: EventLocationMeta;
        events: ForumEvent[];
        totalAttendees: number;
      } => item !== null);
  }, [locationGroups]);

  const unmappedLocationCount = locationGroups.length - mappedLocations.length;
  const activeMapLocation = mappedLocations.find((location) => location.location === activeLocation) ?? null;
  const fallbackKey = getMapFallbackKey(!hasGoogleMapsApiKey, loadError, mappedLocations.length);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const googleMaps = (window as Window & { google?: any }).google;
    if (!googleMaps?.maps) return;

    if (activeMapLocation) {
      mapRef.current.panTo({
        lat: activeMapLocation.coord.lat,
        lng: activeMapLocation.coord.lng,
      });
      mapRef.current.setZoom(14);
      return;
    }

    if (mappedLocations.length === 0) {
      mapRef.current.panTo({ lat: ALANYA_CENTER.lat, lng: ALANYA_CENTER.lng });
      mapRef.current.setZoom(12);
      return;
    }

    if (mappedLocations.length === 1) {
      mapRef.current.panTo({
        lat: mappedLocations[0].coord.lat,
        lng: mappedLocations[0].coord.lng,
      });
      mapRef.current.setZoom(14);
      return;
    }

    const bounds = new googleMaps.maps.LatLngBounds();
    mappedLocations.forEach((location) => {
      bounds.extend({ lat: location.coord.lat, lng: location.coord.lng });
    });
    mapRef.current.fitBounds(bounds, 56);
  }, [activeMapLocation, isLoaded, mappedLocations]);

  const handleLocationClick = (location: string) => {
    setActiveLocation((prev) => (prev === location ? null : location));
  };

  const renderEventRow = (event: ForumEvent) => {
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
              type="button"
              onClick={() => (isRsvpd ? onCancelRsvp(event.id) : onRsvp(event.id))}
              disabled={isFull}
              aria-pressed={isRsvpd}
              aria-label={t(isRsvpd ? "events.cancelRsvpFor" : "events.rsvpFor", { title: event.title })}
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
                  {t("events.going")}
                </>
              ) : isFull ? (
                t("events.full")
              ) : (
                t("events.rsvp")
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
  };

  return (
    <div>
      <div className="rounded-2xl overflow-hidden border border-background-200 mb-6 bg-background-50">
        <div className="relative w-full h-[400px] md:h-[500px]">
          {hasGoogleMapsApiKey && isLoaded && mappedLocations.length > 0 ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={{ lat: ALANYA_CENTER.lat, lng: ALANYA_CENTER.lng }}
              zoom={12}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              onUnmount={() => {
                mapRef.current = null;
              }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
                clickableIcons: false,
              }}
            >
              {mappedLocations.map((location) => (
                <MarkerF
                  key={location.location}
                  position={{ lat: location.coord.lat, lng: location.coord.lng }}
                  title={`${location.label} · ${t("events.eventCount", { count: location.events.length })}`}
                  label={{
                    text: String(location.events.length),
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                  onClick={() => setActiveLocation(location.location)}
                />
              ))}

              {activeMapLocation && (
                <InfoWindowF
                  position={{ lat: activeMapLocation.coord.lat, lng: activeMapLocation.coord.lng }}
                  onCloseClick={() => setActiveLocation(null)}
                >
                  <div className="min-w-[220px] max-w-[280px] pr-2">
                    <h4 className="font-heading text-sm text-foreground-900 mb-1">
                      {activeMapLocation.label}
                    </h4>
                    <p className="text-xs text-foreground-500 mb-3">
                      {t("events.eventCount", { count: activeMapLocation.events.length })} · {t("events.goingCount", { count: activeMapLocation.totalAttendees })}
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {activeMapLocation.events.map((event) => {
                        const isRsvpd = rsvpdEvents.has(event.id);
                        return (
                          <div key={event.id} className="rounded-lg border border-background-200 px-3 py-2 bg-white">
                            <p className="text-sm font-medium text-foreground-900 line-clamp-1">{event.title}</p>
                            <p className="text-xs text-foreground-500 mb-2">{event.month} {event.day} · {event.time}</p>
                            <button
                              type="button"
                              onClick={() => (isRsvpd ? onCancelRsvp(event.id) : onRsvp(event.id))}
                              aria-pressed={isRsvpd}
                              aria-label={t(isRsvpd ? "events.cancelRsvpFor" : "events.rsvpFor", { title: event.title })}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                isRsvpd
                                  ? "bg-accent-100 text-accent-700"
                                  : "bg-primary-500 text-white"
                              }`}
                            >
                              {isRsvpd ? t("events.going") : t("events.rsvp")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-gradient-to-br from-background-100 via-background-50 to-background-100">
              <div className="w-14 h-14 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center">
                <i className="ri-map-pin-2-fill text-2xl"></i>
              </div>
              <div>
                <h3 className="font-heading text-lg text-foreground-900 mb-1">{t("events.interactiveMap")}</h3>
                <p className="text-sm text-foreground-500 max-w-xl">
                  {fallbackKey ? t(fallbackKey) : null}
                </p>
                {unmappedLocationCount > 0 && (
                  <p className="text-xs text-foreground-400 mt-2">
                    {t("events.mapUnmappedSummary", { count: unmappedLocationCount })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {unmappedLocationCount > 0 && (
        <div className="mb-6 rounded-xl border border-background-200 bg-background-50 px-4 py-3 text-sm text-foreground-600">
          <span className="font-medium text-foreground-900">{t("events.mapCoverageNote")}:</span>{" "}
          {t(
            unmappedLocationCount === 1
              ? "events.mapCoverageDescriptionSingle"
              : "events.mapCoverageDescription",
            { count: unmappedLocationCount },
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {locationGroups.map(([location, locationEvents]) => {
          const coord = resolveEventLocationMeta(location);
          const isActive = activeLocation === location;
          const totalAttendees = locationEvents.reduce((sum, event) => sum + event.attendees, 0);

          return (
            <div
              key={location}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                isActive ? "border-accent-300 shadow-sm" : "border-background-200 hover:border-background-300"
              }`}
            >
              <button
                type="button"
                onClick={() => handleLocationClick(location)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left cursor-pointer hover:bg-background-50 transition-colors"
                aria-expanded={isActive}
                aria-controls={`location-events-${location}`}
                aria-label={t(isActive ? "events.collapseLocation" : "events.expandLocation", {
                  location: coord?.label ?? location,
                })}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${coord ? "bg-accent-100" : "bg-background-100"}`}>
                  <i className={`${coord ? "ri-map-pin-line text-accent-600" : "ri-route-line text-foreground-400"} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-sm text-foreground-900 truncate">
                    {coord?.label ?? location}
                  </h4>
                  <p className="text-xs text-foreground-500">
                    {t("events.eventCount", { count: locationEvents.length })} &middot; {t("events.goingCount", { count: totalAttendees })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!coord && (
                    <span className="text-[10px] bg-background-100 text-foreground-500 font-medium px-2 py-0.5 rounded-full">
                      {t("events.noPin")}
                    </span>
                  )}
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

              <div
                id={`location-events-${location}`}
                className={`overflow-hidden transition-all duration-300 ${
                  isActive ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-4 pb-4 space-y-3">
                  {locationEvents.map(renderEventRow)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
