import type React from "react";
import type { ArticleBlockNode } from "./types";
import { parseArticleContent } from "./parser";
import EmbeddedVenueCard from "./EmbeddedVenueCard";
import EmbeddedDirectoryCta from "./EmbeddedDirectoryCta";
import VideoEmbed from "./VideoEmbed";
import ArticleFigure from "./ArticleFigure";
import ArticleCallout from "./ArticleCallout";
import PullQuote from "./PullQuote";
import LeadParagraph from "./LeadParagraph";

export interface ArticleContentRendererProps {
  content?: string | ArticleBlockNode[];
  nodes?: ArticleBlockNode[];
  className?: string;
}

function renderInlineFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-foreground-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={index} className="italic text-foreground-900">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="text-primary-600 hover:text-primary-700 underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

function renderParagraphBlock(content: string, index: number): React.ReactNode {
  const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  const isBulletList = rawLines.length > 1 && rawLines.every((l) => /^[-*•\d.]+\s+/.test(l));

  if (isBulletList) {
    return (
      <ul key={`ul-${index}`} className="my-4 space-y-2.5 pl-2">
        {rawLines.map((item, itemIdx) => {
          const cleanItem = item.replace(/^[-*•\d.]+\s+/, "");
          return (
            <li
              key={`li-${itemIdx}`}
              className="flex items-start gap-3 text-foreground-900 text-base md:text-[17px] leading-relaxed"
            >
              <span className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 shrink-0 shadow-xs" />
              <span>{renderInlineFormattedText(cleanItem)}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div key={`p-${index}`} className="space-y-3 mb-5">
      {rawLines.map((line, lineIdx) => {
        const isHeaderLike =
          line.length < 85 &&
          !line.endsWith(".") &&
          !line.endsWith(",") &&
          (line.endsWith("?") ||
            line.endsWith(":") ||
            /^[A-Z0-9][A-Za-z0-9\s()–—/'-]+(?:\s*\([^)]+\))?$/.test(line)) &&
          (line.includes("Airport") ||
            line.includes("Transfers") ||
            line.includes("Benefits") ||
            line.includes("Features") ||
            line.includes("Tips") ||
            line.includes("Why") ||
            line.includes("Options") ||
            line.includes("Overview") ||
            line.endsWith("?"));

        if (isHeaderLike && rawLines.length > 1 && lineIdx === 0) {
          return (
            <h4
              key={`subh-${lineIdx}`}
              className="font-heading text-lg md:text-xl font-bold text-foreground-950 pt-3 pb-1 tracking-tight"
            >
              {renderInlineFormattedText(line)}
            </h4>
          );
        }

        if (/^[-*•]\s+/.test(line)) {
          return (
            <div
              key={`bullet-${lineIdx}`}
              className="flex items-start gap-3 text-foreground-900 text-base md:text-[17px] leading-relaxed pl-2"
            >
              <span className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 shrink-0 shadow-xs" />
              <span>{renderInlineFormattedText(line.replace(/^[-*•]\s+/, ""))}</span>
            </div>
          );
        }

        return (
          <p
            key={`line-${lineIdx}`}
            className="text-foreground-900 text-base md:text-[17px] leading-relaxed font-normal"
          >
            {renderInlineFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function ArticleContentRenderer({
  content,
  nodes,
  className = "",
}: ArticleContentRendererProps) {
  let blockNodes: ArticleBlockNode[] = [];

  if (nodes && Array.isArray(nodes)) {
    blockNodes = nodes;
  } else if (Array.isArray(content)) {
    blockNodes = content;
  } else if (typeof content === "string") {
    blockNodes = parseArticleContent(content);
  }

  if (blockNodes.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={`article-content-flow space-y-4 ${className}`}>
      {blockNodes.map((node, index) => {
        switch (node.type) {
          case "heading": {
            if (node.level === 2) {
              return (
                <h2
                  key={`h2-${index}`}
                  className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 dark:text-white mt-8 mb-4 tracking-tight border-b border-background-200/80 pb-2.5"
                >
                  {node.content}
                </h2>
              );
            }
            if (node.level === 3) {
              return (
                <h3
                  key={`h3-${index}`}
                  className="font-heading text-xl md:text-2xl font-bold text-foreground-950 dark:text-white mt-6 mb-3 tracking-tight"
                >
                  {node.content}
                </h3>
              );
            }
            return (
              <h4
                key={`h4-${index}`}
                className="font-heading text-lg md:text-xl font-bold text-foreground-950 dark:text-white mt-5 mb-2"
              >
                {node.content}
              </h4>
            );
          }

          case "paragraph": {
            return renderParagraphBlock(node.content, index);
          }

          case "lead": {
            return (
              <LeadParagraph key={`lead-${index}`} dropCap={node.dropCap}>
                {node.content}
              </LeadParagraph>
            );
          }

          case "venue": {
            return (
              <EmbeddedVenueCard
                key={`venue-${node.venueId}-${index}`}
                venueId={node.venueId}
                layout={node.layout}
              />
            );
          }

          case "cta": {
            return (
              <EmbeddedDirectoryCta
                key={`cta-${node.category}-${index}`}
                category={node.category}
                label={node.label}
                subtext={node.subtext}
              />
            );
          }

          case "video": {
            return (
              <VideoEmbed
                key={`video-${index}`}
                src={node.src}
                provider={node.provider}
                caption={node.caption}
                trackSrc={node.trackSrc}
                poster={node.poster}
              />
            );
          }

          case "figure": {
            return (
              <ArticleFigure
                key={`fig-${index}`}
                src={node.src}
                caption={node.caption}
                credit={node.credit}
                alt={node.alt}
                allowZoom={true}
              />
            );
          }

          case "callout": {
            return (
              <ArticleCallout
                key={`callout-${index}`}
                variant={node.variant}
                title={node.title}
                content={node.content}
              />
            );
          }

          case "pullquote": {
            return (
              <PullQuote
                key={`quote-${index}`}
                quote={node.quote}
                author={node.author}
                role={node.role}
              />
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
