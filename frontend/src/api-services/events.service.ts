import { apiClient } from "@/lib/api-client";
import { events as mockEvents, type ForumEvent } from "@/mocks/events";

export type { ForumEvent };

export interface GetEventsOptions {
  upcomingOnly?: boolean;
  limit?: number;
  includeUnpublished?: boolean;
}

export interface CreateEventPayload {
  title: string;
  category?: string;
  categoryId?: string;
  category_id?: string;
  eventDate?: string;
  event_date?: string;
  eventTime?: string;
  location?: string;
  description?: string;
  maxAttendees?: number | string;
  max_attendees?: number;
  hostName?: string;
  host_id?: string;
  image_url?: string;
  image?: string;
  is_published?: boolean;
}

export interface EventAttendee {
  id: string;
  full_name?: string;
  avatar_url?: string;
  rsvp_at?: string | null;
  contact_phone?: string | null;
}

export interface BackendForumEvent {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  location?: string | null;
  event_date: string;
  image_url?: string | null;
  host_id?: string | null;
  category_id?: string | null;
  is_published?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  attendees_count?: number;
  max_attendees?: number;
  going_by_me?: boolean;
  is_featured?: boolean;
  host?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

export function formatEventDateParts(dateStr?: string | null): {
  date: string;
  day: string;
  month: string;
  time: string;
} {
  if (!dateStr) {
    return {
      date: "",
      day: "01",
      month: "JAN",
      time: "12:00 PM",
    };
  }

  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      // If it's a simple YYYY-MM-DD or custom string
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const monthIndex = parseInt(match[2], 10) - 1;
        return {
          date: `${match[1]}-${match[2]}-${match[3]}`,
          day: match[3],
          month: MONTH_NAMES[monthIndex] || "JAN",
          time: "12:00 PM",
        };
      }
      return {
        date: dateStr,
        day: "01",
        month: "JAN",
        time: "12:00 PM",
      };
    }

    const year = parsed.getUTCFullYear();
    const monthIndex = parsed.getUTCMonth();
    const dayNum = parsed.getUTCDate();
    const formattedMonth = MONTH_NAMES[monthIndex] || "JAN";
    const formattedDay = dayNum < 10 ? `0${dayNum}` : String(dayNum);
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${formattedDay}`;

    // Extract time
    let hours = parsed.getUTCHours();
    const minutes = parsed.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : String(minutes);
    const timeFormatted = `${hours}:${minutesStr} ${ampm}`;

    return {
      date: dateFormatted,
      day: formattedDay,
      month: formattedMonth,
      time: timeFormatted,
    };
  } catch {
    return {
      date: dateStr,
      day: "01",
      month: "JAN",
      time: "12:00 PM",
    };
  }
}

export function mapBackendEventToForumEvent(event: BackendForumEvent): ForumEvent {
  const dateParts = formatEventDateParts(event.event_date);
  const defaultHostAvatar =
    "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20natural%20light&width=100&height=100&seq=event-host-default&orientation=squarish";
  const defaultEventImage =
    "https://readdy.ai/api/search-image?query=Group%20of%20people%20gathering%20at%20Mediterranean%20coast%20sunny%20day&width=800&height=500&seq=event-default&orientation=landscape";

  return {
    id: event.id,
    title: event.title,
    date: dateParts.date,
    day: dateParts.day,
    month: dateParts.month,
    time: dateParts.time,
    location: event.location || "Alanya, Türkiye",
    category: event.category?.name || "Digital Nomad Events",
    attendees: event.attendees_count ?? 0,
    maxAttendees: event.max_attendees ?? 50,
    host: event.host?.full_name || "Community Host",
    hostAvatar: event.host?.avatar_url || defaultHostAvatar,
    description: event.description || "",
    image: event.image_url || defaultEventImage,
    isFeatured: !!event.is_featured,
    slug: event.slug,
    going_by_me: !!event.going_by_me,
  };
}

export class EventsService {
  /**
   * Retrieves events from backend API with mock fallback.
   */
  async getEvents(options: GetEventsOptions = {}): Promise<ForumEvent[]> {
    const { upcomingOnly, limit, includeUnpublished } = options;

    try {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (upcomingOnly !== undefined) params.upcomingOnly = upcomingOnly;
      if (limit !== undefined) params.limit = limit;
      if (includeUnpublished !== undefined) params.includeUnpublished = includeUnpublished;

      const data = await apiClient.get<BackendForumEvent[]>("/forum/events", { params });

      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapBackendEventToForumEvent);
      }
    } catch (err) {
      console.warn("Failed to fetch events from API, using fallback mock:", err);
    }

    // Mock fallback handling
    let result = [...mockEvents];
    if (upcomingOnly) {
      const nowStr = new Date().toISOString().split("T")[0];
      result = result.filter((e) => e.date >= nowStr);
      if (result.length === 0) {
        result = [...mockEvents];
      }
    }

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }

  /**
   * Retrieves a single event by its slug or ID.
   */
  async getEventBySlug(slugOrId: string): Promise<ForumEvent | null> {
    try {
      const data = await apiClient.get<BackendForumEvent>(`/forum/events/slug/${slugOrId}`);
      if (data && data.id) {
        return mapBackendEventToForumEvent(data);
      }
    } catch (err) {
      console.warn(`Failed to fetch event '${slugOrId}' from API, searching fallback:`, err);
    }

    // Mock fallback search
    const found = mockEvents.find(
      (e) =>
        e.id === slugOrId ||
        e.slug === slugOrId ||
        e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slugOrId.toLowerCase()
    );

    return found || null;
  }

  /**
   * Creates a new event.
   */
  async createEvent(payload: CreateEventPayload): Promise<ForumEvent> {
    const combinedDate = payload.event_date
      ? payload.event_date
      : payload.eventDate && payload.eventTime
        ? `${payload.eventDate}T${payload.eventTime}:00Z`
        : payload.eventDate || new Date().toISOString();

    const maxAttendeesNum =
      typeof payload.maxAttendees === "number"
        ? payload.maxAttendees
        : payload.maxAttendees
          ? parseInt(payload.maxAttendees, 10)
          : payload.max_attendees || 50;

    try {
      const response = await apiClient.post<BackendForumEvent>("/forum/events", {
        title: payload.title,
        description: payload.description || null,
        location: payload.location || null,
        event_date: combinedDate,
        image_url: payload.image_url || payload.image || null,
        category_id: payload.category_id || payload.categoryId || null,
        is_published: payload.is_published ?? true,
      });

      if (response && response.id) {
        return mapBackendEventToForumEvent(response);
      }
    } catch (err) {
      console.warn("Failed to create event on API, generating fallback response:", err);
    }

    // Fallback response
    const dateParts = formatEventDateParts(combinedDate);
    const syntheticId = `ev-${Date.now()}`;
    const syntheticSlug = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      id: syntheticId,
      title: payload.title,
      date: dateParts.date || payload.eventDate || "2026-07-01",
      day: dateParts.day || "01",
      month: dateParts.month || "JUL",
      time: payload.eventTime || dateParts.time || "6:00 PM",
      location: payload.location || "Alanya, Türkiye",
      category: payload.category || "Expat Socials",
      attendees: 1,
      maxAttendees: isNaN(maxAttendeesNum) ? 50 : maxAttendeesNum,
      host: payload.hostName || "Community Host",
      hostAvatar:
        "https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20natural%20light&width=100&height=100&seq=event-host-fallback&orientation=squarish",
      description: payload.description || "",
      image:
        payload.image_url ||
        payload.image ||
        "https://readdy.ai/api/search-image?query=Group%20of%20people%20gathering%20at%20beach%20warm%20light&width=800&height=500&seq=event-fallback&orientation=landscape",
      isFeatured: false,
      slug: syntheticSlug,
      going_by_me: true,
    };
  }

  /**
   * Toggles user RSVP status for an event.
   */
  async toggleRsvp(eventId: string, contactPhone?: string): Promise<{ going: boolean }> {
    try {
      const response = await apiClient.post<{ going: boolean }>(
        `/forum/events/${eventId}/rsvp`,
        { contactPhone }
      );
      if (response && typeof response.going === "boolean") {
        return response;
      }
    } catch (err) {
      console.warn(`Failed to toggle RSVP for event '${eventId}', using fallback:`, err);
    }

    return { going: true };
  }

  /**
   * Retrieves the attendees list for an event.
   */
  async getAttendees(eventId: string): Promise<EventAttendee[]> {
    try {
      const data = await apiClient.get<EventAttendee[]>(`/forum/events/${eventId}/attendees`);
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn(`Failed to fetch attendees for event '${eventId}', using fallback:`, err);
    }

    return [];
  }
}

export const eventsService = new EventsService();

export const getEvents = (options?: GetEventsOptions) => eventsService.getEvents(options);
export const getEventBySlug = (slug: string) => eventsService.getEventBySlug(slug);
export const createEvent = (payload: CreateEventPayload) => eventsService.createEvent(payload);
export const toggleRsvp = (eventId: string, contactPhone?: string) => eventsService.toggleRsvp(eventId, contactPhone);
export const getAttendees = (eventId: string) => eventsService.getAttendees(eventId);
