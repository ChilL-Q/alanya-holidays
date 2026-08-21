export interface PullQuoteProps {
  quote: string;
  author?: string;
  role?: string;
  className?: string;
}

export default function PullQuote({
  quote,
  author,
  role,
  className = "",
}: PullQuoteProps) {
  const hasAttribution = Boolean(author);

  return (
    <blockquote
      className={`relative my-8 border-l-4 border-primary-500 pl-6 py-2 italic font-serif text-xl sm:text-2xl text-foreground-800 dark:text-foreground-100 leading-relaxed ${className}`}
    >
      <p className="font-serif italic">"{quote}"</p>
      {hasAttribution && (
        <footer className="mt-3 text-sm not-italic font-sans font-medium text-foreground-600 dark:text-foreground-400">
          — {author}
          {role && (
            <span className="text-foreground-400 dark:text-foreground-500">
              , {role}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}
