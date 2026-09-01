/**
 * Article Shortcode & AST Type Definitions
 * Specified in PROJECT.md Interface Contracts
 */

export type ArticleBlockNode =
  | { type: "html"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 2 | 3 | 4; content: string }
  | { type: "venue"; venueId: string; layout?: "card" | "compact" }
  | { type: "cta"; category: string; label: string; subtext?: string }
  | {
      type: "video";
      src: string;
      provider?: "youtube" | "vimeo" | "html5";
      caption?: string;
      trackSrc?: string;
      poster?: string;
    }
  | {
      type: "figure";
      src: string;
      caption?: string;
      credit?: string;
      alt?: string;
    }
  | {
      type: "callout";
      variant: "tip" | "info" | "warning" | "insider" | "quote";
      title?: string;
      content: string;
    }
  | {
      type: "pullquote";
      quote: string;
      author?: string;
      role?: string;
    }
  | {
      type: "lead";
      content: string;
      dropCap?: boolean;
    };
