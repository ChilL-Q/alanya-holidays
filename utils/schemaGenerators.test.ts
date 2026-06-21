import { describe, it, expect } from 'vitest';
import {
    alanyaAddress,
    faqPageSchema,
    taxiServiceSchema,
    touristAttractionSchema,
    itemListSchema,
} from './schemaGenerators';

describe('schemaGenerators', () => {
    describe('alanyaAddress', () => {
        it('returns default Alanya address', () => {
            const addr = alanyaAddress() as Record<string, string>;
            expect(addr['@type']).toBe('PostalAddress');
            expect(addr.addressLocality).toBe('Alanya');
            expect(addr.addressRegion).toBe('Antalya');
            expect(addr.addressCountry).toBe('TR');
        });

        it('allows overriding addressLocality', () => {
            const addr = alanyaAddress({ addressLocality: 'Mahmutlar' }) as Record<string, string>;
            expect(addr.addressLocality).toBe('Mahmutlar');
            expect(addr.addressRegion).toBe('Antalya');
        });

        it('includes streetAddress when provided', () => {
            const addr = alanyaAddress({ streetAddress: 'Kesefli Mah.' }) as Record<string, string>;
            expect(addr.streetAddress).toBe('Kesefli Mah.');
        });

        it('omits streetAddress when not provided', () => {
            const addr = alanyaAddress() as Record<string, string>;
            expect(addr).not.toHaveProperty('streetAddress');
        });
    });

    describe('faqPageSchema', () => {
        it('returns null for empty faqs array', () => {
            expect(faqPageSchema([])).toBeNull();
        });

        it('builds correct FAQPage schema', () => {
            const faqs = [
                { question: 'Q1?', answer: 'A1.' },
                { question: 'Q2?', answer: 'A2.' },
            ];
            const schema = faqPageSchema(faqs) as Record<string, unknown>;

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('FAQPage');

            const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
            expect(mainEntity).toHaveLength(2);
            expect(mainEntity[0]['@type']).toBe('Question');
            expect(mainEntity[0].name).toBe('Q1?');

            const answer = mainEntity[0].acceptedAnswer as Record<string, string>;
            expect(answer['@type']).toBe('Answer');
            expect(answer.text).toBe('A1.');
        });
    });

    describe('taxiServiceSchema', () => {
        it('builds correct TaxiService schema with defaults', () => {
            const schema = taxiServiceSchema({
                name: 'Alanya Transfer',
                description: 'Airport transfer service',
                url: 'https://example.com/transfer',
            }) as Record<string, unknown>;

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('TaxiService');
            expect(schema.name).toBe('Alanya Transfer');

            const areaServed = schema.areaServed as Record<string, string>;
            expect(areaServed.name).toBe('Alanya');

            const address = schema.address as Record<string, string>;
            expect(address.addressLocality).toBe('Alanya');
        });

        it('allows custom areaServed and addressLocality', () => {
            const schema = taxiServiceSchema({
                name: 'Test',
                description: 'Test',
                url: 'https://example.com',
                areaServed: 'Mahmutlar',
                addressLocality: 'Mahmutlar',
            }) as Record<string, unknown>;

            const areaServed = schema.areaServed as Record<string, string>;
            expect(areaServed.name).toBe('Mahmutlar');

            const address = schema.address as Record<string, string>;
            expect(address.addressLocality).toBe('Mahmutlar');
        });
    });

    describe('touristAttractionSchema', () => {
        it('builds correct TouristAttraction schema with defaults', () => {
            const schema = touristAttractionSchema({
                name: 'Alanya Castle',
                description: 'Historic castle',
                url: 'https://example.com/castle',
            }) as Record<string, unknown>;

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('TouristAttraction');
            expect(schema.touristType).toBe('Leisure travelers');
        });

        it('allows custom touristType', () => {
            const schema = touristAttractionSchema({
                name: 'Test',
                description: 'Test',
                url: 'https://example.com',
                touristType: 'Adventure travelers',
            }) as Record<string, unknown>;

            expect(schema.touristType).toBe('Adventure travelers');
        });
    });

    describe('itemListSchema', () => {
        it('builds correct ItemList with positions', () => {
            const items = [
                { type: 'Restaurant', name: 'Cafe A', url: 'https://example.com/a', image: 'img.jpg' },
                { type: 'Restaurant', name: 'Cafe B', url: 'https://example.com/b' },
            ];
            const schema = itemListSchema(items) as Record<string, unknown>;

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('ItemList');

            const elements = schema.itemListElement as Array<Record<string, unknown>>;
            expect(elements).toHaveLength(2);
            expect(elements[0].position).toBe(1);
            expect(elements[1].position).toBe(2);

            const item1 = elements[0].item as Record<string, string>;
            expect(item1['@type']).toBe('Restaurant');
            expect(item1.image).toBe('img.jpg');

            const item2 = elements[1].item as Record<string, string>;
            expect(item2).not.toHaveProperty('image');
        });

        it('handles empty items array', () => {
            expect(itemListSchema([])).toBeNull();
        });
    });
});
