// eslint-disable-next-line no-control-regex
const STRIP_CONTROL = /[\r\n\x00-\x1f\x7f]/g;

export const sanitizeString = (value: string): string =>
    value.replace(STRIP_CONTROL, '').trim();