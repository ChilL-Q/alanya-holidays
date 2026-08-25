import DOMPurify from 'dompurify';

const FORUM_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 's', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'a', 'img', 'iframe',
  'h2', 'h3', 'h4',
];

const FORUM_ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'scrolling'];

export const sanitizeForumHtml = (dirty: string): string =>
  DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: FORUM_ALLOWED_TAGS,
    ALLOWED_ATTR: FORUM_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
