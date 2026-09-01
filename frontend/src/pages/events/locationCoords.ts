export interface EventLocationMeta {
  lat: number;
  lng: number;
  label: string;
}

export const ALANYA_CENTER: EventLocationMeta = {
  lat: 36.5446,
  lng: 31.9998,
  label: "Alanya Center",
};

export const eventLocationCoords: Record<string, EventLocationMeta> = {
  "Cleopatra Beach, Alanya": { lat: 36.5483, lng: 31.9987, label: "Cleopatra Beach" },
  "Cleopatra Beach Courts": { lat: 36.5488, lng: 31.9992, label: "Cleopatra Beach Courts" },
  "Alanya Harbor": { lat: 36.5358, lng: 31.9986, label: "Alanya Harbor" },
  "The Local Pub, Alanya": { lat: 36.5442, lng: 32.0015, label: "The Local Pub" },
  "Taurus Mountains Trailhead": { lat: 36.59, lng: 32.12, label: "Taurus Trailhead" },
  "Coworking Alanya, Oba": { lat: 36.524, lng: 32.001, label: "Coworking Oba" },
  "Keykubat Beach, Alanya": { lat: 36.54, lng: 31.99, label: "Keykubat Beach" },
  "Zeynep's Kitchen, Alanya": { lat: 36.547, lng: 32.005, label: "Zeynep's Kitchen" },
  "Alanya Castle Entrance": { lat: 36.5337, lng: 31.9925, label: "Alanya Castle" },
  "Coffice Alanya, Mahmutlar": { lat: 36.49, lng: 32.09, label: "Coffice Mahmutlar" },
  "İncekum Beach, Alanya": { lat: 36.56, lng: 31.96, label: "İncekum Beach" },
  "Rooftop Restaurant, Alanya Center": { lat: 36.545, lng: 32, label: "Rooftop Restaurant" },
  "Alanya Dive Center, Harbor": { lat: 36.536, lng: 31.997, label: "Dive Center" },
  "Ahmet's Tea Garden, Alanya": { lat: 36.546, lng: 32.003, label: "Ahmet's Tea Garden" },
  "Innovation Hub, Alanya": { lat: 36.548, lng: 32.008, label: "Innovation Hub" },
  "Alanya Central Park": { lat: 36.5475, lng: 32.002, label: "Central Park" },
  "Beachfront Plaza, Alanya": { lat: 36.542, lng: 31.995, label: "Beachfront Plaza" },
  "Departure from Alanya Center": { lat: 36.545, lng: 31.999, label: "Alanya Center" },
};

const locationAliases: Record<string, string> = {
  "cleopatra beach": "Cleopatra Beach, Alanya",
  "cleopatra beach alanya": "Cleopatra Beach, Alanya",
  "keykubat beach": "Keykubat Beach, Alanya",
  "incekum beach": "İncekum Beach, Alanya",
  "incekum beach alanya": "İncekum Beach, Alanya",
  "alanya harbour": "Alanya Harbor",
  "harbour": "Alanya Harbor",
  "alanya center": "Departure from Alanya Center",
  "alanya centre": "Departure from Alanya Center",
  "alanya city center": "Departure from Alanya Center",
  "alanya city centre": "Departure from Alanya Center",
  "oba coworking": "Coworking Alanya, Oba",
  "coffice alanya": "Coffice Alanya, Mahmutlar",
  "dive center": "Alanya Dive Center, Harbor",
};

function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeEventLocation(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcentre\b/g, "center")
    .replace(/\bharbour\b/g, "harbor")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveEventLocationMeta(location: string): EventLocationMeta | null {
  const direct = eventLocationCoords[location];
  if (direct) return direct;

  const normalizedLocation = normalizeEventLocation(location);
  if (!normalizedLocation) return null;

  const aliasTarget = locationAliases[normalizedLocation];
  if (aliasTarget && eventLocationCoords[aliasTarget]) {
    return eventLocationCoords[aliasTarget];
  }

  const exactNormalizedEntry = Object.entries(eventLocationCoords).find(([key]) => {
    return normalizeEventLocation(key) === normalizedLocation;
  });
  if (exactNormalizedEntry) {
    return exactNormalizedEntry[1];
  }

  const tokenMatchEntry = Object.entries(eventLocationCoords).find(([key]) => {
    const normalizedKey = normalizeEventLocation(key);
    return (
      normalizedKey.includes(normalizedLocation) ||
      normalizedLocation.includes(normalizedKey)
    );
  });

  return tokenMatchEntry?.[1] || null;
}
