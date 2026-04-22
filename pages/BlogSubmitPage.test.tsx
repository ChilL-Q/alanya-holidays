import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogSubmitPage } from './BlogSubmitPage';
import { db } from '../api-services';
import { toast } from 'react-hot-toast';

const mockNavigate = vi.fn();

vi.mock('../api-services', () => ({
  db: {
    createBlogSubmission: vi.fn(),
    uploadBlogMediaBatch: vi.fn(),
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', full_name: 'Test User', email: 'test@test.com' },
    isAuthenticated: true
  })
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

vi.mock('react-hot-toast', () => ({
  toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn().mockReturnValue('toast-id') },
  default: { error: vi.fn(), success: vi.fn(), loading: vi.fn().mockReturnValue('toast-id') }
}));

const TITLE_PLACEHOLDER = /10 Hidden Beaches/i;
const CONTENT_PLACEHOLDER = /Write your article here/i;
const LONG_CONTENT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText(TITLE_PLACEHOLDER), { target: { value: 'A Valid Title' } });
  fireEvent.change(screen.getByPlaceholderText(CONTENT_PLACEHOLDER), { target: { value: LONG_CONTENT } });
}

describe('BlogSubmitPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the blog submit form', async () => {
    await act(async () => {
      render(<BlogSubmitPage />);
    });

    expect(screen.getByText(/Share Your Story/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(TITLE_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(CONTENT_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Article/i })).toBeInTheDocument();
  });

  it('shows error toast when title is too short', async () => {
    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(TITLE_PLACEHOLDER), { target: { value: 'Abc' } });
      fireEvent.change(screen.getByPlaceholderText(CONTENT_PLACEHOLDER), { target: { value: LONG_CONTENT } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    expect(toast.error).toHaveBeenCalledWith('Title must be at least 5 characters');
  });

  it('shows error toast when content is too short', async () => {
    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(TITLE_PLACEHOLDER), { target: { value: 'Valid Title' } });
      fireEvent.change(screen.getByPlaceholderText(CONTENT_PLACEHOLDER), { target: { value: 'Short' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    expect(toast.error).toHaveBeenCalledWith('Content must be at least 100 characters');
  });

  it('calls createBlogSubmission on valid submission', async () => {
    (db.uploadBlogMediaBatch as any).mockResolvedValue(['https://example.com/image1.jpg']);
    (db.createBlogSubmission as any).mockResolvedValue(undefined);

    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fillForm();
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    await waitFor(() => {
      expect(db.createBlogSubmission).toHaveBeenCalledWith({
        title: 'A Valid Title',
        content: LONG_CONTENT,
        video_url: undefined,
        media_urls: [],
      });
    });
  });

  it('navigates to success page on successful submission', async () => {
    (db.uploadBlogMediaBatch as any).mockResolvedValue([]);
    (db.createBlogSubmission as any).mockResolvedValue(undefined);

    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fillForm();
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/blog/submission-success');
    });
  });

  it('shows loading state while submitting', async () => {
    (db.uploadBlogMediaBatch as any).mockResolvedValue([]);
    (db.createBlogSubmission as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(undefined), 100)));

    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fillForm();
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    expect(screen.getByText(/Processing\.\.\./)).toBeInTheDocument();
  });

  it('shows success toast on submission', async () => {
    (db.uploadBlogMediaBatch as any).mockResolvedValue([]);
    (db.createBlogSubmission as any).mockResolvedValue(undefined);

    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fillForm();
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Article submitted successfully!', expect.anything());
    });
  });

  it('shows error toast on submission failure', async () => {
    (db.uploadBlogMediaBatch as any).mockResolvedValue([]);
    (db.createBlogSubmission as any).mockRejectedValue(new Error('Database error'));

    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fillForm();
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Database error');
    });
  });

  it('submit button is disabled while submitting', async () => {
    (db.uploadBlogMediaBatch as any).mockResolvedValue([]);
    (db.createBlogSubmission as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(undefined), 100)));

    await act(async () => {
      render(<BlogSubmitPage />);
    });

    await act(async () => {
      fillForm();
      fireEvent.submit(screen.getByRole('button', { name: /Submit Article/i }).closest('form')!);
    });

    const btn = screen.getByText(/Processing\.\.\./i).closest('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders back to blog link', async () => {
    await act(async () => {
      render(<BlogSubmitPage />);
    });

    const backLink = screen.getByText(/Back to Blog/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/blog');
  });
});
