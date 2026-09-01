import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { CalendarDays, Loader2, Pencil, Plus } from "lucide-react";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { ApiError } from "@/lib/api-client";
import { logger } from "@/lib/logger";

const eventError = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    return i18n.t("merchant.sessionExpired");
  }
  if (error instanceof ApiError && error.status === 403) {
    return i18n.t("merchant.noPermission");
  }
  return i18n.t("merchant.contentLoadFailed");
};

export function MyEventsTab() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<ForumEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ForumEvent | null>(null);
  const [form, setForm] = useState({ title: "", description: "", location: "", eventDate: "" });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await eventsService.getMyEvents());
    } catch (err) {
      logger.error("Failed to load merchant events:", err);
      setError(eventError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const beginEdit = (event: ForumEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.eventDate || event.date,
    });
  };

  const saveEvent = async () => {
    if (!editing || !form.title.trim() || !form.eventDate) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await eventsService.updateEvent(editing.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        event_date: form.eventDate,
      });
      setEvents((current) =>
        current.map((event) => (event.id === updated.id ? updated : event))
      );
      setEditing(null);
    } catch (err) {
      logger.error("Failed to update merchant event:", err);
      setError(eventError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center"><Loader2 aria-label={t("common.loading")} className="h-7 w-7 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t("merchant.eventsActivities")}</h2>
          <p className="text-sm text-secondary-500 dark:text-slate-400">{t("merchant.eventsDescription")}</p>
        </div>
        <a href="/events" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"><Plus className="h-4 w-4" /> {t("merchant.hostEvent")}</a>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}

      {events.length === 0 && !error && (
        <div className="rounded-2xl border border-secondary-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 font-semibold text-secondary-900 dark:text-white">{t("merchant.noEvents")}</p>
        </div>
      )}

      {events.map((event) => (
        <article key={event.id} className="rounded-2xl border border-secondary-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-secondary-900 dark:text-white">{event.title}</h3>
                <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-slate-800 dark:text-slate-300">{event.isPublished ? t("merchant.published") : t("merchant.draft")}</span>
              </div>
              <p className="mt-1 text-sm text-secondary-500 dark:text-slate-400">{event.date} · {event.time} · {event.location}</p>
            </div>
            <button type="button" onClick={() => beginEdit(event)} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary-100 px-3 py-2 text-xs font-semibold text-secondary-800 hover:bg-secondary-200 dark:bg-slate-800 dark:text-slate-200"><Pencil className="h-3.5 w-3.5" /> {t("merchant.edit")}</button>
          </div>
        </article>
      ))}

      {editing && (
        <div role="dialog" aria-modal="true" aria-labelledby="event-editor-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 id="event-editor-title" className="text-lg font-bold text-secondary-900 dark:text-white">{t("merchant.editEvent")}</h2>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.title")}<input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.dateTime")}<input type="datetime-local" value={form.eventDate.slice(0, 16)} onChange={(e) => setForm((current) => ({ ...current, eventDate: e.target.value }))} className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.location")}<input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-sm font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.description")}<textarea rows={5} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="mt-1 w-full rounded-xl border border-secondary-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-secondary-100 px-4 py-2 text-sm font-semibold text-secondary-800 dark:bg-slate-800 dark:text-slate-200">{t("common.cancel")}</button>
              <button type="button" disabled={saving || !form.title.trim() || !form.eventDate} onClick={() => void saveEvent()} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {t("merchant.saveEvent")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
