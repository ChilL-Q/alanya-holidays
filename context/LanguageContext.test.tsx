import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Mock locale data
vi.mock('../locales/en', () => ({ en: { 'test.key': 'Test Value', 'test.param': 'Hello {name}' } }));
vi.mock('../locales/ru', () => ({ ru: { 'test.key': 'Тест Значение' } }));
vi.mock('../locales/tr', () => ({ tr: { 'test.key': 'Test Değer' } }));
vi.mock('../locales/ar', () => ({ ar: { 'test.key': 'قيمة الاختبار' } }));

const TestComponent = () => {
    const { language, setLanguage, t } = useLanguage();
    return (
        <div>
            <span data-testid="lang">{language}</span>
            <button onClick={() => setLanguage('tr')}>Change to TR</button>
            <span data-testid="trans">{t('test.key')}</span>
            <span data-testid="interp">{t('test.param', { name: 'World' })}</span>
            <span data-testid="missing">{t('missing.key')}</span>
        </div>
    );
};

describe('LanguageContext', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        document.documentElement.lang = 'en';
        document.dir = 'ltr';
        document.body.classList.remove('font-arabic');
        localStorage.removeItem('language');
    });

    it('provides default language "en"', async () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId('lang').textContent).toBe('en');
        });
        expect(document.documentElement.lang).toBe('en');
    });

    it('updates language and document attributes', async () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('lang').textContent).toBe('en');
        });

        const button = screen.getByText('Change to TR');
        act(() => {
            button.click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('lang').textContent).toBe('tr');
        });
        expect(document.documentElement.lang).toBe('tr');
        expect(document.dir).toBe('ltr');
    });

    it('handles RTL for Arabic', async () => {
        const TestComponentAr = () => {
            const { setLanguage } = useLanguage();
            return <button onClick={() => setLanguage('ar')}>Arabic</button>;
        };

        render(
            <LanguageProvider>
                <TestComponentAr />
            </LanguageProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Arabic')).toBeInTheDocument();
        });

        act(() => {
            screen.getByText('Arabic').click();
        });

        await waitFor(() => {
            expect(document.dir).toBe('rtl');
        });
        expect(document.documentElement.lang).toBe('ar');
        expect(document.body.classList.contains('font-arabic')).toBe(true);
    });

    it('translates keys correctly', async () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId('trans').textContent).toBe('Test Value');
        });
    });

    it('interpolates parameters', async () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId('interp').textContent).toBe('Hello World');
        });
    });

    it('returns key if translation missing', async () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId('missing').textContent).toBe('missing.key');
        });
    });

    it('throws error if used outside provider', () => {
        const spy = vi.spyOn(console, 'error');
        spy.mockImplementation(() => {});

        expect(() => render(<TestComponent />)).toThrow('useLanguage must be used within a LanguageProvider');

        spy.mockRestore();
    });
});