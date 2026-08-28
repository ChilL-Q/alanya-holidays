import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";
import { events as domainEvents } from "@/domain/events";

export interface ForumEvent {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  time: string;
  location: string;
  category: string;
  attendees: number;
  maxAttendees: number;
  host: string;
  hostAvatar: string;
  description: string;
  image: string;
  isFeatured: boolean;
  slug?: string;
  going_by_me?: boolean;
}

export const eventCategories = [
  "Digital Nomad Events",
  "Beach Gatherings",
  "Language Exchange Events",
  "Hiking Groups",
  "Business Networking",
  "Expat Socials",
  "Sports Activities",
  "Traveler Meetups",
];

export interface GetEventsOptions extends RequestOptions {
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

function toCategoryIdentifier(category?: string | null): string | null {
  if (!category) return null;
  const trimmed = category.trim();
  if (!trimmed) return null;

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || null;
}

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

    const year = parsed.getFullYear();
    const monthNum = String(parsed.getMonth() + 1).padStart(2, "0");
    const dayNum = String(parsed.getDate()).padStart(2, "0");
    const month = MONTH_NAMES[parsed.getMonth()] || "JAN";

    let hours = parsed.getHours();
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const time = `${hours}:${minutes} ${ampm}`;

    return {
      date: `${year}-${monthNum}-${dayNum}`,
      day: dayNum,
      month,
      time,
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
    "/images/placeholder-business.svg";
  const defaultEventImage =
    "/images/placeholder-business.svg";

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
   * Synchronous lookup for curated domain events.
   */
  getEventsSync(): ForumEvent[] {
    return domainEvents;
  }

  /**
   * Retrieves events from live backend API.
   */
  async getEvents(options: GetEventsOptions = {}): Promise<ForumEvent[]> {
    const { upcomingOnly, limit, includeUnpublished, params: extraParams, ...reqConfig } = options;

    const params: Record<string, string | number | boolean | undefined> = {};
    if (upcomingOnly !== undefined) params.upcomingOnly = upcomingOnly;
    if (limit !== undefined) params.limit = limit;
    if (includeUnpublished !== undefined) params.includeUnpublished = includeUnpublished;

    const data = await apiClient.get<BackendForumEvent[]>("/forum/events", {
      ...reqConfig,
      params: { ...extraParams, ...params },
    });

    if (Array.isArray(data)) {
      return data.map(mapBackendEventToForumEvent);
    }

    return [];
  }

  /**
   * Retrieves a single event by its slug or ID.
   */
  async getEventBySlug(slugOrId: string, options?: RequestOptions): Promise<ForumEvent | null> {
    try {
      const data = options
        ? await apiClient.get<BackendForumEvent>(`/forum/events/slug/${slugOrId}`, options)
        : await apiClient.get<BackendForumEvent>(`/forum/events/slug/${slugOrId}`);
      if (data && data.id) {
        return mapBackendEventToForumEvent(data);
      }
      const match = domainEvents.find((e) => e.slug === slugOrId || e.id === slugOrId);
      return match || null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        const match = domainEvents.find((e) => e.slug === slugOrId || e.id === slugOrId);
        return match || null;
      }
      const match = domainEvents.find((e) => e.slug === slugOrId || e.id === slugOrId);
      if (match) return match;
      throw err;
    }
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

    const response = await apiClient.post<BackendForumEvent>("/forum/events", {
      title: payload.title,
      description: payload.description || null,
      location: payload.location || null,
      event_date: combinedDate,
      image_url: payload.image_url || payload.image || null,
      category_id:
        payload.category_id ||
        payload.categoryId ||
        toCategoryIdentifier(payload.category) ||
        null,
      is_published: payload.is_published ?? true,
    });

    return mapBackendEventToForumEvent(response);
  }

  /**
   * Toggles user RSVP status for an event.
   */
  async toggleRsvp(eventId: string, contactPhone?: string): Promise<{ going: boolean }> {
    return apiClient.post<{ going: boolean }>(
      `/forum/events/${eventId}/rsvp`,
      { contactPhone }
    );
  }

  /**
   * Retrieves the attendees list for an event.
   */
  async getAttendees(eventId: string, options?: RequestOptions): Promise<EventAttendee[]> {
    try {
      const data = options
        ? await apiClient.get<EventAttendee[]>(`/forum/events/${eventId}/attendees`, options)
        : await apiClient.get<EventAttendee[]>(`/forum/events/${eventId}/attendees`);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  }
}

export const eventsService = new EventsService();

export const getEvents = (options?: GetEventsOptions) => eventsService.getEvents(options);
export const getEventBySlug = (slug: string, options?: RequestOptions) =>
  eventsService.getEventBySlug(slug, options);
export const createEvent = (payload: CreateEventPayload) => eventsService.createEvent(payload);
export const toggleRsvp = (eventId: string, contactPhone?: string) => eventsService.toggleRsvp(eventId, contactPhone);
export const getAttendees = (eventId: string, options?: RequestOptions) =>
  eventsService.getAttendees(eventId, options);
