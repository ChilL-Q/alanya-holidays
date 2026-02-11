import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { useEffect } from 'react';

const TestComponent = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-value">{theme}</span>
            <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
    );
};

describe('ThemeContext', () => {
    it('provides default theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    });

    it('toggles theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const button = screen.getByText('Toggle Theme');

        act(() => {
            button.click();
        });
        expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        act(() => {
            button.click();
        });
        expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
