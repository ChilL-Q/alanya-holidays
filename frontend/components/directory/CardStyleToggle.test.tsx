import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { CardStyleToggle } from './CardStyleToggle';
import { CardStyleProvider } from '../../context/CardStyleContext';

const renderToggle = () =>
    render(
        <CardStyleProvider>
            <CardStyleToggle />
        </CardStyleProvider>,
    );

describe('CardStyleToggle', () => {
    beforeEach(() => localStorage.clear());

    it('defaults to the Box style', () => {
        renderToggle();
        expect(screen.getByRole('button', { name: /box/i })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /rectangle/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('switches to Rectangle and persists the choice', () => {
        renderToggle();
        fireEvent.click(screen.getByRole('button', { name: /rectangle/i }));
        expect(screen.getByRole('button', { name: /rectangle/i })).toHaveAttribute('aria-pressed', 'true');
        const stored = JSON.parse(localStorage.getItem('directory_card_style') || '{}');
        expect(stored.state?.cardStyle).toBe('rectangle');
    });

    it('restores a persisted Rectangle preference on mount', () => {
        localStorage.setItem('directory_card_style', JSON.stringify({ state: { cardStyle: 'rectangle' }, version: 0 }));
        renderToggle();
        expect(screen.getByRole('button', { name: /rectangle/i })).toHaveAttribute('aria-pressed', 'true');
    });
});

