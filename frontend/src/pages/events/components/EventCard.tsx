import { useState, useRef, useEffect } from "react";
import type { ForumEvent } from "@/api-services/events.service";
import { generateGoogleCalendarUrl, downloadIcalFile } from "../calendarExport";
import { copyEventLink, shareViaWhatsapp, shareViaTelegram } from "../shareUtils";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { eventCategoryLabel } from "../eventCategoryLabels";

interface EventCardProps {
  event: ForumEvent;
  isRsvpd: boolean;
  isSaved: boolean;
  onRsvp: (eventId: string) => void;
  onCancelRsvp: (eventId: string) => void;
  onSave: (eventId: string) => void;
  onUnsave: (eventId: string) => void;
}

export default function EventCard({ event, isRsvpd, isSaved, onRsvp, onCancelRsvp, onSave, onUnsave }: EventCardProps) {
  const { t } = useTranslation();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveAttendees = event.attendees;
  const safeMaxAttendees = Math.max(1, event.maxAttendees);
  const spotsLeft = Math.max(0, safeMaxAttendees - effectiveAttendees);
  const fillPercent = (effectiveAttendees / safeMaxAttendees) * 100;
  const isAlmostFull = fillPercent >= 80;
  const isFull = effectiveAttendees >= safeMaxAttendees && !isRsvpd;

  // Click-outside close
  useEffect(() => {
    if (!showShareMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowShareMenu(false);
        shareBtnRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target as Node) &&
        shareBtnRef.current &&
        !shareBtnRef.current.contains(e.target as Node)
      ) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showShareMenu]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleRsvpClick = () => {
    if (isRsvpd) {
      onCancelRsvp(event.id);
    } else {
      onRsvp(event.id);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      onUnsave(event.id);
    } else {
      onSave(event.id);
    }
  };

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateGoogleCalendarUrl(
      event.title,
      event.date,
      event.time,
      event.location,
      event.description
    );
    window.open(url, "_blank");
  };

  const handleIcalDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcalFile(
      event.title,
      event.date,
      event.time,
      event.location,
      event.description
    );
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu((prev) => !prev);
    setCopied(false);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = copyEventLink(event.title, event.month, event.day, event.time, event.location, event.host, event.description);
    if (ok) {
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
    setShowShareMenu(false);
  };

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareViaWhatsapp(event.title, event.month, event.day, event.time, event.location, event.host, event.description);
    setShowShareMenu(false);
  };

  const handleTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareViaTelegram(event.title, event.month, event.day, event.time, event.location, event.host, event.description);
    setShowShareMenu(false);
  };

  return (
    <article className="group bg-background-50 rounded-xl border border-background-200/70 overflow-hidden hover:border-primary-200/60 transition-all duration-200">
      {/* Image with date badge */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/40 to-transparent"></div>

        {/* Date badge */}
        <div className="absolute top-3 left-3 flex items-center gap-3">
          <div className="bg-background-50 rounded-lg px-3 py-2 text-center shadow-sm">
            <p className="text-xs font-bold text-primary-500 uppercase leading-none">{event.month}</p>
            <p className="text-lg font-bold text-foreground-900 leading-none">{event.day}</p>
          </div>
          {event.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-500 text-background-50 text-xs rounded-full font-medium">
              <i className="ri-star-fill text-xs"></i>
              {t("events.featured")}
            </span>
          )}
        </div>

        {/* Category tag + Bookmark */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-foreground-950/60 backdrop-blur-sm text-white text-xs rounded-full">
            {eventCategoryLabel(t, event.category)}
          </span>
          <button
            type="button"
            onClick={handleBookmarkClick}
            className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-all cursor-pointer ${
              isSaved
                ? "bg-primary-500 text-white"
                : "bg-foreground-950/40 text-white/70 hover:bg-foreground-950/60 hover:text-white"
            }`}
            aria-pressed={isSaved}
            aria-label={isSaved ? t("events.removeTitleSaved", { title: event.title }) : t("events.saveTitle", { title: event.title })}
          >
            <i className={`${isSaved ? "ri-bookmark-fill" : "ri-bookmark-line"} text-sm`}></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        <h3 className="font-heading text-base md:text-lg text-foreground-900 group-hover:text-primary-500 transition-colors leading-snug mb-2">
          {event.title}
        </h3>

        <p className="text-foreground-500 text-xs md:text-sm leading-relaxed line-clamp-2 mb-4">
          {event.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-foreground-500">
            <i className="ri-time-line text-foreground-400"></i>
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-500">
            <i className="ri-map-pin-line text-foreground-400"></i>
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Host */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-background-200 shrink-0">
            <img
              src={event.hostAvatar}
              alt={event.host}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="text-xs text-foreground-500">
            {t("events.hostedBy", "Hosted by")} <span className="text-foreground-700 font-medium">{event.host}</span>
          </span>
        </div>

        {/* Attendees bar */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-500">
              <span className="font-semibold text-foreground-900">{effectiveAttendees}</span> / {safeMaxAttendees} {t("events.attending", "attending")}
            </span>
            {isFull ? (
              <span className="text-accent-600 font-medium">{t("events.full", "Full")}</span>
            ) : isRsvpd ? (
              <span className="text-accent-500 font-medium">{t("events.going", "You going!")}</span>
            ) : isAlmostFull ? (
              <span className="text-primary-500 font-medium">{spotsLeft} {t("events.spotsLeft", "spots left")}</span>
            ) : (
              <span className="text-foreground-400">{spotsLeft} {t("events.spotsAvailable", "spots available")}</span>
            )}
          </div>
          <div className="h-1.5 bg-background-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? "bg-accent-500" : isAlmostFull ? "bg-primary-500" : "bg-accent-400"
              }`}
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="relative flex items-center gap-1 mb-3 pb-3 border-b border-background-200">
          <button
            type="button"
            onClick={handleBookmarkClick}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              isSaved
                ? "bg-primary-100 text-primary-600"
                : "text-foreground-400 hover:bg-background-100 hover:text-foreground-600"
            }`}
            aria-pressed={isSaved}
            aria-label={isSaved ? t("events.removeTitleSaved", { title: event.title }) : t("events.saveTitle", { title: event.title })}
            title={isSaved ? t("events.saved", "Saved") : t("events.save", "Save event")}
          >
            <i className={`${isSaved ? "ri-bookmark-fill" : "ri-bookmark-line"} text-sm`}></i>
          </button>
          <button
            type="button"
            onClick={handleGoogleCalendar}
            className="w-8 h-8 flex items-center justify-center rounded-full text-foreground-400 hover:bg-background-100 hover:text-foreground-600 transition-all cursor-pointer"
            aria-label={t("events.addTitleToCalendar", { title: event.title })}
            title={t("events.addToCalendar", "Add to Google Calendar")}
          >
            <i className="ri-google-line text-sm"></i>
          </button>
          <button
            type="button"
            onClick={handleIcalDownload}
            className="w-8 h-8 flex items-center justify-center rounded-full text-foreground-400 hover:bg-background-100 hover:text-foreground-600 transition-all cursor-pointer"
            aria-label={t("events.downloadTitleIcal", { title: event.title })}
            title={t("events.downloadIcalTitle")}
          >
            <i className="ri-calendar-2-line text-sm"></i>
          </button>
          <button
            type="button"
            ref={shareBtnRef}
            onClick={handleShareClick}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              showShareMenu
                ? "bg-accent-100 text-accent-600"
                : "text-foreground-400 hover:bg-background-100 hover:text-foreground-600"
            }`}
            aria-haspopup="menu"
            aria-expanded={showShareMenu}
            aria-controls={`share-menu-${event.id}`}
            aria-label={t("events.shareTitle", { title: event.title })}
            title={t("events.share", "Share event")}
          >
            <i className="ri-share-forward-line text-sm"></i>
          </button>

          {/* Share dropdown */}
          {showShareMenu && (
            <div
              id={`share-menu-${event.id}`}
              ref={shareMenuRef}
              className="absolute left-0 bottom-full mb-2 w-56 bg-background-50 border border-background-200 rounded-xl shadow-lg z-20 overflow-hidden"
              role="menu"
              aria-label={t("events.shareOptions", { title: event.title })}
            >
              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                role="menuitem"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-background-100 shrink-0">
                  <i className={`${copied ? "ri-check-line text-accent-500" : "ri-link text-foreground-500"} text-sm`}></i>
                </span>
                <span className="flex-1 text-left">{copied ? t("events.copied", "Copied!") : t("events.copyLink", "Copy event link")}</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsapp}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                role="menuitem"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-100 shrink-0">
                  <i className="ri-whatsapp-line text-accent-600 text-sm"></i>
                </span>
                <span className="flex-1 text-left">{t("events.shareWhatsApp", "Share via WhatsApp")}</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                role="menuitem"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-accent-100 shrink-0">
                  <i className="ri-telegram-line text-accent-600 text-sm"></i>
                </span>
                <span className="flex-1 text-left">{t("events.shareTelegram", "Share via Telegram")}</span>
              </button>
            </div>
          )}
        </div>

        {/* RSVP button */}
        <button
          type="button"
          onClick={handleRsvpClick}
          disabled={isFull && !isRsvpd}
          aria-pressed={isRsvpd}
          aria-label={isRsvpd ? t("events.cancelRsvpFor", { title: event.title }) : t("events.rsvpFor", { title: event.title })}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
            isRsvpd
              ? "bg-accent-100 text-accent-700 hover:bg-accent-200 border border-accent-200"
              : isFull
                ? "bg-background-100 text-foreground-400 cursor-not-allowed"
                : "bg-primary-500 text-background-50 hover:bg-primary-600"
          }`}
        >
          {isRsvpd ? (
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-check-line"></i>
              {t("events.youAreGoing", "You're Going")}
            </span>
          ) : isFull ? (
            t("events.eventFull", "Event Full")
          ) : (
            t("events.rsvpNow", "RSVP Now")
          )}
        </button>
      </div>
    </article>
  );
}
