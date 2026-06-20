import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogPostPage } from './BlogPostPage';
import { db } from '../api-services';
import { toast } from 'react-hot-toast';

vi.mock('../api-services', () => ({
  db: {
    getBlogPost: vi.fn(),
  }
}));

vi.mock('react-hot-toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  default: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ slug: 'test-slug' }),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

vi.mock('dompurify', () => ({
  default: { sanitize: (content: string) => content }
}));

vi.mock('../components/seo/SEOHead', () => ({
  SEOHead: () => null
}));

describe('BlogPostPage', () => {
  const mockPost = {
    id: 'post-1',
    title: 'Test Blog Post',
    excerpt: 'This is a test excerpt',
    content: '<p>This is the full content of the test blog post with enough words to calculate read time properly.</p>',
    cover_image_url: 'https://example.com/cover.jpg',
    published_at: '2024-01-15T10:00:00Z',
    author: {
      full_name: 'Test Author',
      avatar_url: 'https://example.com/avatar.jpg'
    },
    views: 1234,
    category: 'Travel',
    tags: [
      { id: 'tag-1', name: 'Alanya' },
      { id: 'tag-2', name: 'Guide' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (db.getBlogPost as any).mockResolvedValue(mockPost);
  });

  it('renders loading state initially', async () => {
    (db.getBlogPost as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPost), 100))
    );

    render(<BlogPostPage />);

    expect(screen.getByText('Loading article...')).toBeInTheDocument();
  });

  it('fetches blog post on mount', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(db.getBlogPost).toHaveBeenCalledWith('test-slug', true);
    });
  });

  it('displays blog post title', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });
  });

  it('displays blog post content', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/full content of the test blog post/i)).toBeInTheDocument();
    });
  });

  it('displays blog post cover image', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      const img = screen.getByRole('img', { name: mockPost.title });
      expect(img).toHaveAttribute('src', mockPost.cover_image_url);
    });
  });

  it('displays published date', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
    });
  });

  it('displays author name', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });
  });

  it('displays read time', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/min read/i)).toBeInTheDocument();
    });
  });

  it('displays view count', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/1[,.]?234/)).toBeInTheDocument();
    });
  });

  it('displays category tag', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      const travelElements = screen.getAllByText('Travel');
      expect(travelElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays tags', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Alanya')).toBeInTheDocument();
      expect(screen.getByText('Guide')).toBeInTheDocument();
    });
  });

  it('shows breadcrumb', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });
  });

  it('handles missing blog post gracefully', async () => {
    (db.getBlogPost as any).mockResolvedValue(null);

    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Article Not Found')).toBeInTheDocument();
    });
  });

  it('copies link to clipboard and shows toast when Web Share API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
  });

  it('renders SEO Head component', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(db.getBlogPost).toHaveBeenCalled();
    });
  });
});
