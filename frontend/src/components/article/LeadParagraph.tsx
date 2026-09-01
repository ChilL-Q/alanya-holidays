import React from "react";

export interface LeadParagraphProps {
  children: React.ReactNode;
  dropCap?: boolean;
  className?: string;
}

export default function LeadParagraph({
  children,
  dropCap = false,
  className = "",
}: LeadParagraphProps) {
  return (
    <p
      className={`text-lg md:text-xl leading-relaxed text-foreground-800 dark:text-foreground-100 font-normal mb-6 ${
        dropCap
          ? "first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:font-serif first-letter:text-primary-600 dark:first-letter:text-primary-400 first-letter:leading-none"
          : ""
      } ${className}`}
    >
      {children}
    </p>
  );
}
