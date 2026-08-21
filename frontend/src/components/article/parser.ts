import type { ArticleBlockNode } from "./types";

const KNOWN_SHORTCODES = new Set([
  "venue",
  "cta",
  "video",
  "figure",
  "callout",
  "pullquote",
  "lead",
]);

/**
 * Parses key="value", key='value', or key=value attribute pairs from a shortcode string.
 */
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`]+))/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attrs[key] = value;
  }

  return attrs;
}

/**
 * Converts a known shortcode tag and its attributes into a strongly-typed AST node.
 */
function createShortcodeNode(
  tag: string,
  attrs: Record<string, string>
): ArticleBlockNode | null {
  switch (tag.toLowerCase()) {
    case "venue": {
      const venueId = attrs.id || attrs.venueId || attrs.venue_id || "";
      const layout = attrs.layout === "compact" ? "compact" : "card";
      return {
        type: "venue",
        venueId,
        layout,
      };
    }
    case "cta": {
      const category = attrs.category || "";
      const label = attrs.label || "";
      const subtext = attrs.subtext || undefined;
      return {
        type: "cta",
        category,
        label,
        subtext,
      };
    }
    case "video": {
      return {
        type: "video",
        src: attrs.src || attrs.url || "",
        provider: (attrs.provider as "youtube" | "vimeo" | "html5") || "youtube",
        caption: attrs.caption || undefined,
        trackSrc: attrs.trackSrc || attrs.tracks || undefined,
        poster: attrs.poster || undefined,
      };
    }
    case "figure": {
      return {
        type: "figure",
        src: attrs.src || attrs.image || "",
        caption: attrs.caption || undefined,
        credit: attrs.credit || undefined,
        alt: attrs.alt || undefined,
      };
    }
    case "callout": {
      return {
        type: "callout",
        variant: (attrs.variant as "tip" | "info" | "warning" | "insider" | "quote") || "info",
        title: attrs.title || undefined,
        content: attrs.content || "",
      };
    }
    case "pullquote": {
      return {
        type: "pullquote",
        quote: attrs.quote || attrs.content || "",
        author: attrs.author || undefined,
        role: attrs.role || undefined,
      };
    }
    case "lead": {
      return {
        type: "lead",
        content: attrs.content || "",
        dropCap: attrs.dropCap === "true" || attrs.dropcap === "true",
      };
    }
    default:
      return null;
  }
}

/**
 * Parses raw article markdown & shortcode content into an AST of ArticleBlockNode items.
 *
 * Supported constructs:
 * - Markdown headings: ## (h2), ### (h3), #### (h4)
 * - Shortcodes: [venue id="..." layout="card"|"compact"], [cta category="..." label="..." subtext="..."], etc.
 * - Standard multiline paragraphs separated by blank lines
 * - Graceful fallback to paragraphs for unknown shortcodes and unclosed syntax
 */
export function parseArticleContent(rawContent: string): ArticleBlockNode[] {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const nodes: ArticleBlockNode[] = [];
  const lines = rawContent.split(/\r?\n/);
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const content = currentParagraphLines.join("\n").trim();
      if (content) {
        nodes.push({
          type: "paragraph",
          content,
        });
      }
      currentParagraphLines = [];
    }
  };

  const shortcodeRegex = /^\s*\[\s*([a-zA-Z0-9_-]+)([\s\S]*?)\]\s*$/;
  const headingRegex = /^(#{2,4})\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      // Blank line terminates current paragraph
      flushParagraph();
      continue;
    }

    // Check for markdown headings: ##, ###, ####
    const headingMatch = line.match(headingRegex);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length as 2 | 3 | 4;
      nodes.push({
        type: "heading",
        level,
        content: headingMatch[2].trim(),
      });
      continue;
    }

    // Check for standalone shortcode
    const shortcodeMatch = trimmedLine.match(shortcodeRegex);
    if (shortcodeMatch) {
      const tag = shortcodeMatch[1];
      const rawAttrs = shortcodeMatch[2];

      if (KNOWN_SHORTCODES.has(tag.toLowerCase())) {
        flushParagraph();
        const attrs = parseAttributes(rawAttrs);
        const node = createShortcodeNode(tag, attrs);
        if (node) {
          nodes.push(node);
          continue;
        }
      }
    }

    // Otherwise, standard paragraph line
    currentParagraphLines.push(line);
  }

  flushParagraph();

  return nodes;
}
