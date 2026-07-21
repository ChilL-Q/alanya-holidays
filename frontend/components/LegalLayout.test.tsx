import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalLayout } from './LegalLayout';

const mockSections = [
  { id: 'section-1', title: 'Section 1' },
  { id: 'section-2', title: 'Section 2' },
  { id: 'section-3', title: 'Section 3' },
];

const renderLegalLayout = (children: React.ReactNode) => {
  return render(
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="January 1, 2024"
      sections={mockSections}
    >
      {children}
    </LegalLayout>
  );
};

describe('LegalLayout', () => {
  describe('rendering', () => {
    it('should render with title and last updated date', () => {
      renderLegalLayout(<div>Content</div>);

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Last updated: January 1, 2024')).toBeInTheDocument();
    });

    it('should render calendar icon', () => {
      renderLegalLayout(<div>Content</div>);

      // Calendar icon should be present near the last updated text
      const lastUpdatedText = screen.getByText('Last updated: January 1, 2024');
      expect(lastUpdatedText.previousSibling).toBeInTheDocument();
    });

    it('should render table of contents', () => {
      renderLegalLayout(<div>Content</div>);

      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderLegalLayout(<p>Legal content here</p>);

      expect(screen.getByText('Legal content here')).toBeInTheDocument();
    });

    it('should have proper hero section with background image', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const heroSection = container.querySelector('.bg-slate-900');
      expect(heroSection).toBeInTheDocument();
    });

    it('should have responsive layout', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const mainContainer = container.querySelector('.max-w-7xl');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('sidebar navigation', () => {
    it('should render section links with correct hrefs', () => {
      renderLegalLayout(<div>Content</div>);

      const section1Link = screen.getByRole('link', { name: /Section 1/i });
      const section2Link = screen.getByRole('link', { name: /Section 2/i });
      const section3Link = screen.getByRole('link', { name: /Section 3/i });

      expect(section1Link).toHaveAttribute('href', '#section-1');
      expect(section2Link).toHaveAttribute('href', '#section-2');
      expect(section3Link).toHaveAttribute('href', '#section-3');
    });

    it('should have ChevronRight icons for each section', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      // Should have 3 section links, each with a ChevronRight
      const sectionLinks = container.querySelectorAll('a[href^="#section-"]');
      expect(sectionLinks).toHaveLength(3);
    });

    it('should have hover styles on section links', () => {
      renderLegalLayout(<div>Content</div>);

      const sectionLink = screen.getByRole('link', { name: /Section 1/i });
      expect(sectionLink).toHaveClass('hover:bg-slate-50');
    });
  });

  describe('main content area', () => {
    it('should have prose classes for typography', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const contentArea = container.querySelector('.prose');
      expect(contentArea).toHaveClass('dark:prose-invert');
      expect(contentArea).toHaveClass('prose-lg');
    });

    it('should have proper dark mode support', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      expect(container.querySelector('.dark\\:prose-invert')).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('should have sidebar taking 1/4 width on large screens', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const sidebar = container.querySelector('.lg\\:w-1\\/4');
      expect(sidebar).toBeInTheDocument();
    });

    it('should have main content taking 3/4 width on large screens', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const mainContent = container.querySelector('.lg\\:w-3\\/4');
      expect(mainContent).toBeInTheDocument();
    });

    it('should have sticky sidebar', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const stickyElement = container.querySelector('.sticky');
      expect(stickyElement).toHaveClass('top-24');
    });
  });

  describe('styling', () => {
    it('should have min-height for full page coverage', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      expect(container.firstChild).toHaveClass('min-h-screen');
    });

    it('should have proper padding', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      expect(container.querySelector('.pb-20')).toBeInTheDocument();
    });

    it('should have responsive hero section padding', () => {
      const { container } = renderLegalLayout(<div>Content</div>);

      const hero = container.querySelector('.pt-32');
      expect(hero).toHaveClass('pb-20');
    });
  });

  describe('accessibility', () => {
    it('should have semantic HTML structure', () => {
      renderLegalLayout(<div>Content</div>);

      // Should have navigation element for TOC
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderLegalLayout(<div>Content</div>);

      expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Table of Contents' })).toBeInTheDocument();
    });
  });
});
