export function buildEventShareUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export function buildShareMessage(title: string, month: string, day: string, time: string, location: string, host: string, description: string): string {
  const url = buildEventShareUrl();
  return `🌟 ${title}\n📅 ${month} ${day} — ${time}\n📍 ${location}\n👤 Hosted by ${host}\n\n${description}\n\n🔗 ${url}`;
}

export function copyEventLink(title: string, month: string, day: string, time: string, location: string, host: string, description: string): boolean {
  const message = buildShareMessage(title, month, day, time, location, host, description);
  try {
    navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}

export function shareViaWhatsapp(title: string, month: string, day: string, time: string, location: string, host: string, description: string): void {
  const message = buildShareMessage(title, month, day, time, location, host, description);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

export function shareViaTelegram(title: string, month: string, day: string, time: string, location: string, host: string, description: string): void {
  const url = buildEventShareUrl();
  const text = `🌟 ${title}\n📅 ${month} ${day} — ${time}\n📍 ${location}\n👤 Hosted by ${host}\n\n${description}`;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, "_blank");
}