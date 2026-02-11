import { describe, it, expect } from 'vitest';
import { getCarImage } from './carImages';

describe('getCarImage', () => {
    it('returns correct image for known car model', () => {
        expect(getCarImage('Fiat', 'Egea')).toContain('fiat-egea');
        expect(getCarImage('Renault', 'Clio')).toContain('renault-clio');
    });

    it('returns default image for unknown car model', () => {
        expect(getCarImage('Unknown', 'Car 123')).toBeDefined();
        expect(getCarImage('Unknown', 'Car 123')).toContain('https://images.unsplash.com');
    });

    it('handles case insensitivity', () => {
        expect(getCarImage('fiat', 'egea')).toContain('fiat-egea');
    });

    it('handles empty input', () => {
        expect(getCarImage('', '')).toBeDefined();
    });
});
