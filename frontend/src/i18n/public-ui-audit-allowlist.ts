/**
 * Narrow, reviewed exceptions for the static UI audit. These entries are not
 * translations: each hit is either a proper noun/brand or TypeScript syntax
 * that the audit's JSX-literal heuristic can mistake for visible copy.
 */
export type PublicUiAuditException = {
  path: string;
  category: "proper-noun" | "technical-token" | "non-ui-syntax";
  reason: string;
};

export const PUBLIC_UI_AUDIT_ALLOWLIST: readonly PublicUiAuditException[] = [
  {
    path: "src/pages/home/components/HeroSection.tsx",
    category: "proper-noun",
    reason: "ALANYA HOLIDAYS is the product brand and must remain unchanged.",
  },
  {
    path: "src/components/base/ErrorBoundary.tsx",
    category: "non-ui-syntax",
    reason: "React fallback renderer type signature; no user-facing literal.",
  },
  {
    path: "src/components/base/RichTextEditor.tsx",
    category: "non-ui-syntax",
    reason: "Callback type declaration; no user-facing literal.",
  },
  {
    path: "src/components/common/TrustBadge.tsx",
    category: "non-ui-syntax",
    reason: "Tag normalization implementation; no rendered copy.",
  },
  {
    path: "src/pages/home/components/FeaturedProducts.tsx",
    category: "non-ui-syntax",
    reason: "Numeric product-price comparisons; no rendered copy.",
  },
  {
    path: "src/pages/thread/components/OriginalPost.tsx",
    category: "technical-token",
    reason: "Image upload byte-limit comparison; no rendered copy.",
  },
  {
    path: "src/pages/thread/components/ReplyCard.tsx",
    category: "non-ui-syntax",
    reason: "Callback type declaration; no user-facing literal.",
  },
];

export default PUBLIC_UI_AUDIT_ALLOWLIST;
