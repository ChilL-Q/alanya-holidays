import { describe, it, expect } from 'vitest';
import { propertySchema, serviceSchema } from './schemas';

describe('Validation Schemas', () => {

    describe('propertySchema', () => {
        const validProperty = {
            title: 'Test Property Title',
            description: 'This is a valid description that is long enough for the schema.',
            price_per_night: 100,
            location: 'Alanya',
            type: 'villa',
            max_guests: 4,
            bedrooms: 2,
            beds: 2,
            bathrooms: 1,
            images: ['https://example.com/image.jpg'],
            host_id: '00000000-0000-0000-0000-000000000000' // Valid UUID format
        };

        it('validates a correct property', () => {
            const result = propertySchema.safeParse(validProperty);
            expect(result.success).toBe(true);
        });

        it('accepts optional cleaning_fee', () => {
            const withFee = { ...validProperty, cleaning_fee: 50 };
            const result = propertySchema.safeParse(withFee);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.cleaning_fee).toBe(50);
            }
        });

        it('rejects negative cleaning_fee', () => {
            const negativeFee = { ...validProperty, cleaning_fee: -10 };
            const result = propertySchema.safeParse(negativeFee);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('positive');
            }
        });
    });

    describe('serviceSchema', () => {
        const validService = {
            title: 'Wellness Massage',
            description: 'A relaxing massage service description.',
            price: 50,
            provider_id: '00000000-0000-0000-0000-000000000000',
            type: 'wellness' // Testing the new type
        };

        it('accepts wellness type', () => {
            const result = serviceSchema.safeParse(validService);
            expect(result.success).toBe(true);
            if(result.success) {
                expect(result.data.type).toBe('wellness');
            }
        });

        it('rejects invalid types', () => {
            const invalidType = { ...validService, type: 'spaceship' };
            const result = serviceSchema.safeParse(invalidType);
            expect(result.success).toBe(false);
        });
    });
});
