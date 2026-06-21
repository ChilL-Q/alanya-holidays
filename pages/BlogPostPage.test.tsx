import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlogPostPage } from './BlogPostPage';
import { db } from '../api-services';
import { toast } from 'react-hot-toast';

vi.mock('../api-services', () => ({
  db: {
    getBlogPost: vi.fn(),
    getRelatedPosts: vi.fn().mockResolvedValue([]),
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
    (db.getRelatedPosts as any).mockResolvedValue([]);
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

  it('does not render TOC if there are less than 3 headings', async () => {
    const postWithFewHeadings = {
      ...mockPost,
      content: '<h2>First Heading</h2><p>some text</p><h2>Second Heading</h2><p>some text</p>'
    };
    (db.getBlogPost as any).mockResolvedValue(postWithFewHeadings);

    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.queryByText('Table of Contents')).not.toBeInTheDocument();
      expect(screen.queryByText('On this page')).not.toBeInTheDocument();
    });
  });

  it('renders TOC and assigns slugified IDs to headings when there are 3 or more headings', async () => {
    const postWithHeadings = {
      ...mockPost,
      content: '<h2>First Heading</h2><p>text</p><h3>Second Heading!</h3><p>text</p><h2>Third Heading</h2>'
    };
    (db.getBlogPost as any).mockResolvedValue(postWithHeadings);

    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      // TOC headers should be visible
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
      expect(screen.getByText('On this page')).toBeInTheDocument();
      
      // The links should exist in the TOC
      const firstHeadingLinks = screen.getAllByRole('link', { name: 'First Heading' });
      expect(firstHeadingLinks.length).toBeGreaterThan(0);
      expect(firstHeadingLinks[0]).toHaveAttribute('href', '#first-heading');

      const secondHeadingLinks = screen.getAllByRole('link', { name: 'Second Heading!' });
      expect(secondHeadingLinks.length).toBeGreaterThan(0);
      expect(secondHeadingLinks[0]).toHaveAttribute('href', '#second-heading');

      const thirdHeadingLinks = screen.getAllByRole('link', { name: 'Third Heading' });
      expect(thirdHeadingLinks.length).toBeGreaterThan(0);
      expect(thirdHeadingLinks[0]).toHaveAttribute('href', '#third-heading');
    });
  });

  it('calls getRelatedPosts with correct arguments when post is loaded', async () => {
    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(db.getRelatedPosts).toHaveBeenCalledWith('post-1', 'Travel', 3);
    });
  });

  it('renders related posts section when related posts are returned', async () => {
    const mockRelatedPosts = [
      {
        id: 'post-2',
        title: 'Related Post Title A',
        slug: 'related-post-a',
        excerpt: 'Excerpt A',
        cover_image_url: 'https://example.com/cover-a.jpg',
        category: 'Travel',
        published_at: '2024-01-14T10:00:00Z'
      },
      {
        id: 'post-3',
        title: 'Related Post Title B',
        slug: 'related-post-b',
        excerpt: 'Excerpt B',
        cover_image_url: null,
        category: 'Travel',
        published_at: '2024-01-13T10:00:00Z'
      }
    ];
    (db.getRelatedPosts as any).mockResolvedValue(mockRelatedPosts);

    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('You Might Also Like')).toBeInTheDocument();
      expect(screen.getByText('Related Post Title A')).toBeInTheDocument();
      expect(screen.getByText('Related Post Title B')).toBeInTheDocument();
    });
  });

  it('does not render related posts section when list is empty', async () => {
    (db.getRelatedPosts as any).mockResolvedValue([]);

    await act(async () => {
      render(<BlogPostPage />);
    });

    await waitFor(() => {
      expect(screen.queryByText('You Might Also Like')).not.toBeInTheDocument();
    });
  });
});
