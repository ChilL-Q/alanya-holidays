// =============================================================================
// JSON-LD Schema Generators — single source of truth for structured data
// =============================================================================

const SCHEMA_CONTEXT = 'https://schema.org' as const;

// =============================================================================
// Building blocks
// =============================================================================

interface AddressOverrides {
    addressLocality?: string;
    streetAddress?: string;
}

/**
 * Standard PostalAddress for Alanya, Turkey.
 * Duplicated in 8+ pages before this utility existed.
 */
export function alanyaAddress(overrides?: AddressOverrides): object {
    return {
        '@type': 'PostalAddress',
        ...(overrides?.streetAddress && { streetAddress: overrides.streetAddress }),
        addressLocality: overrides?.addressLocality ?? 'Alanya',
        addressRegion: 'Antalya',
        addressCountry: 'TR',
    };
}

// =============================================================================
// FAQPage — duplicated in 4 files identically
// =============================================================================

interface FAQItem {
    question: string;
    answer: string;
}

/**
 * Build a FAQPage JSON-LD schema from an array of Q&A pairs.
 * Returns `null` if the array is empty (caller should filter it out).
 */
export function faqPageSchema(faqs: FAQItem[]): object | null {
    if (faqs.length === 0) return null;

    return {
        '@context': SCHEMA_CONTEXT,
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

// =============================================================================
// TaxiService — DirectoryCategoryPage + DistrictPage
// =============================================================================

interface TaxiServiceOptions {
    name: string;
    description: string;
    url: string;
    areaServed?: string;
    addressLocality?: string;
}

export function taxiServiceSchema(opts: TaxiServiceOptions): object {
    return {
        '@context': SCHEMA_CONTEXT,
        '@type': 'TaxiService',
        name: opts.name,
        description: opts.description,
        url: opts.url,
        address: alanyaAddress(
            opts.addressLocality ? { addressLocality: opts.addressLocality } : undefined
        ),
        areaServed: {
            '@type': 'City',
            name: opts.areaServed ?? 'Alanya',
        },
    };
}

// =============================================================================
// TouristAttraction — SeasonalPage + DistrictPage + AttractionPage
// =============================================================================

interface TouristAttractionOptions {
    name: string;
    description: string;
    url: string;
    addressLocality?: string;
    touristType?: string;
}

export function touristAttractionSchema(opts: TouristAttractionOptions): object {
    return {
        '@context': SCHEMA_CONTEXT,
        '@type': 'TouristAttraction',
        name: opts.name,
        description: opts.description,
        url: opts.url,
        address: alanyaAddress(
            opts.addressLocality ? { addressLocality: opts.addressLocality } : undefined
        ),
        touristType: opts.touristType ?? 'Leisure travelers',
    };
}

// =============================================================================
// ItemList — DirectoryCategoryPage
// =============================================================================

interface ItemListEntry {
    type: string;
    name: string;
    url: string;
    image?: string;
}

export function itemListSchema(items: ItemListEntry[]): object {
    return {
        '@context': SCHEMA_CONTEXT,
        '@type': 'ItemList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': item.type,
                name: item.name,
                url: item.url,
                image: item.image ?? '',
            },
        })),
    };
}
