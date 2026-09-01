function parseEventDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) throw new Error("Invalid time format");
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const start = new Date(year, month - 1, day, hours, minutes, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start, end };
}

function toUTCString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(date.getUTCFullYear()) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    "00Z"
  );
}

export function generateGoogleCalendarUrl(
  title: string,
  dateStr: string,
  timeStr: string,
  location: string,
  description: string
): string {
  const { start, end } = parseEventDateTime(dateStr, timeStr);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toUTCString(start)}/${toUTCString(end)}`,
    details: description,
    location: location,
    trp: "false",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcalFile(
  title: string,
  dateStr: string,
  timeStr: string,
  location: string,
  description: string
): void {
  const { start, end } = parseEventDateTime(dateStr, timeStr);
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alanya Holidays//Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${toUTCString(start)}`,
    `DTEND:${toUTCString(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}