import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  jsonLd?: object | null;
  noIndex?: boolean;
}

const SITE_NAME = 'Alanya Holidays';
const DEFAULT_IMAGE = '/og-default.jpg';
const BASE_URL = 'https://alanya-holidays.com';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  type = 'website',
  keywords = [],
  jsonLd = null,
  noIndex = false
}) => {
  const location = useLocation();
  const canonicalUrl = BASE_URL + location.pathname;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  const metaDescription = description ||
    'Premium vacation rentals in Alanya, Turkey. Book villas, apartments and holiday homes with best price guarantee.';

  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@alanyaholidays" />

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
