import React from "react";
import { OFFICIAL_DATA_SOURCES, type DataSourceCitation } from "../data/regionalData";

interface OfficialSourcesFooterProps {
  sources?: DataSourceCitation[];
}

export default function OfficialSourcesFooter({ sources = OFFICIAL_DATA_SOURCES }: OfficialSourcesFooterProps) {
  return (
    <section id="sources" className="py-12 md:py-16 border-t border-background-200 dark:border-background-800 bg-background-100/50 dark:bg-background-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <i className="ri-shield-check-line" />
            <span>Open Data Governance & Attribution</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground-900 dark:text-foreground-50 tracking-tight">
            Official Data Sources & Registry Citations
          </h2>
          <p className="text-sm sm:text-base text-foreground-600 dark:text-foreground-400 mt-2">
            All demographic counts, international residency statistics, tourism volumes, and eco-certifications featured on this dashboard are compiled directly from primary Turkish governmental and international regulatory bodies.
          </p>
        </div>

        {/* 4 Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {sources.map((source) => (
            <div
              key={source.id}
              data-testid={`source-citation-${source.id}`}
              className="p-6 rounded-2xl bg-white dark:bg-background-800 border border-background-200 dark:border-background-700/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                      {source.period}
                    </span>
                    <h3 className="text-lg font-bold text-foreground-900 dark:text-foreground-50 mt-0.5">
                      {source.institution}
                    </h3>
                    <div className="text-xs text-foreground-500 italic">
                      {source.institutionTr}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center text-lg flex-shrink-0">
                    <i className={source.icon} />
                  </div>
                </div>

                <div className="text-xs font-semibold text-foreground-800 dark:text-foreground-200 mb-2">
                  Dataset: {source.reportName}
                </div>

                <p className="text-xs text-foreground-600 dark:text-foreground-300 leading-relaxed">
                  {source.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-background-100 dark:border-background-700/60 flex items-center justify-between">
                <span className="text-[11px] text-foreground-500">Official Portal Registry</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline"
                >
                  <span>Visit {source.institution.split(" ")[0]}</span>
                  <i className="ri-external-link-line" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Methodology Note Callout */}
        <div className="rounded-2xl p-6 bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 text-xs text-foreground-600 dark:text-foreground-300 leading-relaxed shadow-sm">
          <div className="flex items-center gap-2 font-bold text-foreground-900 dark:text-foreground-50 text-sm mb-2">
            <i className="ri-information-line text-primary-500 text-base" />
            <span>Methodological Note & Data Integrity</span>
          </div>
          <p>
            Population figures are governed by TÜİK&apos;s Address Based Population Registration System (ADNKS), which records Turkish citizens and foreign nationals holding valid residence permits of at least 3 months. Tourism arrival volumes are compiled by the Ministry of Culture and Tourism through automated border gate passport control terminals at Antalya Airport (AYT) and Gazipaşa-Alanya Airport (GZP). Blue Flag beach certifications are audited annually by TÜRÇEV under Foundation for Environmental Education (FEE) global criteria.
          </p>
        </div>
      </div>
    </section>
  );
}
