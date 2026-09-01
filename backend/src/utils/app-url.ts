/**
 * Канонический origin приложения для ссылок в письмах и deep-link'ах.
 * Единственный владелец инварианта «куда указывают ссылки»:
 * APP_URL, иначе прод-домен (никогда не localhost в письмах).
 */
export function appOrigin(): string {
  return process.env.APP_URL || 'https://alanyaholidays.com';
}

export function appUrl(path: string): string {
  return `${appOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}
