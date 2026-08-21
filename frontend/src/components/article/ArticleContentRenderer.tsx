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
                  className="font-heading text-2xl md:text-3xl font-bold text-foreground-900 dark:text-white mt-8 mb-3 tracking-tight"
                >
                  {node.content}
                </h2>
              );
            }
            if (node.level === 3) {
              return (
                <h3
                  key={`h3-${index}`}
                  className="font-heading text-xl md:text-2xl font-bold text-foreground-900 dark:text-white mt-6 mb-2 tracking-tight"
                >
                  {node.content}
                </h3>
              );
            }
            return (
              <h4
                key={`h4-${index}`}
                className="font-heading text-lg md:text-xl font-semibold text-foreground-900 dark:text-white mt-4 mb-2"
              >
                {node.content}
              </h4>
            );
          }

          case "paragraph": {
            return (
              <p
                key={`p-${index}`}
                className="text-foreground-700 dark:text-foreground-200 leading-relaxed text-base md:text-lg mb-4 whitespace-pre-line"
              >
                {node.content}
              </p>
            );
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
