import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisaConsult } from './VisaConsult';
import { messagesService } from '../api-services/api/misc';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockAlert = vi.fn();
vi.stubGlobal('alert', mockAlert);

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        BrowserRouter: (actual as any).BrowserRouter
    };
});

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../api-services/api/misc', () => ({
    messagesService: {
        sendMessage: vi.fn()
    }
}));

// Helper: fill and optionally submit the form
async function fillForm() {
    fireEvent.change(screen.getByPlaceholderText('visa.consult.form.name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('+90 5XX XXX XX XX'), { target: { value: '+90 530 123 45 67' } });
    fireEvent.change(screen.getByPlaceholderText('visa.consult.form.message'), { target: { value: 'Tourist visa question' } });
}

describe('VisaConsult', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        mockAlert.mockClear();
    });

    it('renders visa consult page with heading', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('visa.consult.title')).toBeInTheDocument();
        expect(screen.getByText('visa.consult.subtitle')).toBeInTheDocument();
    });

    it('renders WhatsApp contact section', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('visa.consult.agent')).toBeInTheDocument();
        const whatsappLink = screen.getByRole('link');
        expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/905300846177');
    });

    it('renders consultation form', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('visa.consult.form.title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('visa.consult.form.name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('+90 5XX XXX XX XX')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('visa.consult.form.message')).toBeInTheDocument();
    });

    it('renders visa type selector with all options', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
        expect(options[0]).toHaveValue('tourist');
        expect(options[1]).toHaveValue('residence');
        expect(options[2]).toHaveValue('other');
    });

    it('allows filling out the form', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        await act(async () => { fillForm(); });

        expect((screen.getByPlaceholderText('visa.consult.form.name') as HTMLInputElement).value).toBe('John Doe');
        expect((screen.getByPlaceholderText('email@example.com') as HTMLInputElement).value).toBe('john@example.com');
        expect((screen.getByPlaceholderText('+90 5XX XXX XX XX') as HTMLInputElement).value).toBe('+90 530 123 45 67');
        expect((screen.getByPlaceholderText('visa.consult.form.message') as HTMLTextAreaElement).value).toBe('Tourist visa question');
    });

    it('submits form with correct data', async () => {
        (messagesService.sendMessage as any).mockResolvedValue(true);

        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        await act(async () => { fillForm(); });
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'visa.consult.form.submit' }).closest('form')!);
        });

        await waitFor(() => {
            expect(messagesService.sendMessage).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+90 530 123 45 67',
                visa_type: 'tourist',
                message: '[TOURIST] Tourist visa question'
            });
        });
    });

    it('shows success state after submission', async () => {
        (messagesService.sendMessage as any).mockResolvedValue(true);

        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        await act(async () => { fillForm(); });
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'visa.consult.form.submit' }).closest('form')!);
        });

        await waitFor(() => {
            expect(screen.getByText('visa.consult.form.success')).toBeInTheDocument();
        });
    });

    it('handles submission error via alert', async () => {
        (messagesService.sendMessage as any).mockRejectedValue(new Error('Network error'));

        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        await act(async () => { fillForm(); });
        await act(async () => {
            fireEvent.submit(screen.getByRole('button', { name: 'visa.consult.form.submit' }).closest('form')!);
        });

        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith('visa.consult.form.error');
        });
    });

    it('navigates back when back button clicked', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        await act(async () => {
            fireEvent.click(screen.getByText('list_prop.back'));
        });

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('renders description and disclaimer text', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('visa.consult.desc')).toBeInTheDocument();
        expect(screen.getByText('visa.consult.availability')).toBeInTheDocument();
        expect(screen.getByText('visa.consult.disclaimer')).toBeInTheDocument();
    });

    it('submit button is disabled while loading', async () => {
        (messagesService.sendMessage as any).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(true), 200))
        );

        await act(async () => {
            render(
                <BrowserRouter>
                    <VisaConsult />
                </BrowserRouter>
            );
        });

        await act(async () => { fillForm(); });

        fireEvent.submit(screen.getByRole('button', { name: 'visa.consult.form.submit' }).closest('form')!);

        await waitFor(() => {
            const btn = screen.getByRole('button', { name: /Sending.../i }) as HTMLButtonElement;
            expect(btn.disabled).toBe(true);
        });
    });
});
