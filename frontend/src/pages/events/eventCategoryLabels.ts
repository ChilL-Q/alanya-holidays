import type { TFunction } from "i18next";

const EVENT_CATEGORY_KEYS: Record<string, string> = {
  "Digital Nomad Events": "events.category.digitalNomad",
  "Beach Gatherings": "events.category.beachGatherings",
  "Language Exchange Events": "events.category.languageExchange",
  "Hiking Groups": "events.category.hikingGroups",
  "Business Networking": "events.category.businessNetworking",
  "Expat Socials": "events.category.expatSocials",
  "Sports Activities": "events.category.sportsActivities",
  "Traveler Meetups": "events.category.travelerMeetups",
};

export function eventCategoryLabel(t: TFunction, category: string): string {
  const key = EVENT_CATEGORY_KEYS[category];
  return key ? t(key) : category;
}
