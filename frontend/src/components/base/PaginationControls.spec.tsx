import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationControls } from './PaginationControls';

describe('PaginationControls', () => {
  describe('Numbered pagination', () => {
    it('renders page numbers and highlights current page', () => {
      const handlePageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={handlePageChange}
          mode="numbered"
        />,
      );

      // Page buttons 1, 2, 3, 4, 5
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      const activeBtn = screen.getByRole('button', { name: '2' });
      expect(activeBtn).toBeInTheDocument();
      expect(activeBtn).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();

      // Click page 4
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      expect(handlePageChange).toHaveBeenCalledWith(4);
    });

    it('navigates with previous and next buttons', () => {
      const handlePageChange = vi.fn();
      const { rerender } = render(
        <PaginationControls
          currentPage={1}
          totalPages={4}
          onPageChange={handlePageChange}
          mode="numbered"
        />,
      );

      const prevBtn = screen.getByRole('button', { name: /previous|prev/i });
      const nextBtn = screen.getByRole('button', { name: /next/i });

      // On first page, Previous should be disabled
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      fireEvent.click(nextBtn);
      expect(handlePageChange).toHaveBeenCalledWith(2);

      // On last page, Next should be disabled
      rerender(
        <PaginationControls
          currentPage={4}
          totalPages={4}
          onPageChange={handlePageChange}
          mode="numbered"
        />,
      );
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /previous|prev/i })).not.toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: /previous|prev/i }));
      expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('renders ellipsis for large number of pages', () => {
      render(
        <PaginationControls
          currentPage={5}
          totalPages={10}
          onPageChange={vi.fn()}
          mode="numbered"
        />,
      );

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
      const ellipsis = screen.getAllByText('…');
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  describe('Load More mode', () => {
    it('renders load more button and handles click', () => {
      const handleLoadMore = vi.fn();
      render(
        <PaginationControls
          hasMore={true}
          onLoadMore={handleLoadMore}
          mode="load-more"
          loadMoreText="Load More Discussions"
        />,
      );

      const loadMoreBtn = screen.getByRole('button', { name: /Load More Discussions/i });
      expect(loadMoreBtn).toBeInTheDocument();
      fireEvent.click(loadMoreBtn);
      expect(handleLoadMore).toHaveBeenCalledTimes(1);
    });

    it('displays loading spinner and disables button when isLoadingMore is true', () => {
      render(
        <PaginationControls
          hasMore={true}
          isLoadingMore={true}
          onLoadMore={vi.fn()}
          mode="load-more"
          loadingText="Loading more..."
        />,
      );

      const btn = screen.getByRole('button', { name: /Loading more\.\.\./i });
      expect(btn).toBeDisabled();
    });

    it('does not render Load More button when hasMore is false', () => {
      render(
        <PaginationControls
          hasMore={false}
          onLoadMore={vi.fn()}
          mode="load-more"
        />,
      );

      expect(screen.queryByRole('button', { name: /Load More/i })).not.toBeInTheDocument();
    });
  });

  describe('Item count summary', () => {
    it('renders showing X of Y summary when totalItems is provided', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={3}
          totalItems={25}
          pageSize={10}
          showItemCount={true}
          itemName="posts"
          mode="both"
          hasMore={true}
        />,
      );

      expect(screen.getByText(/showing/i)).toHaveTextContent(/25/);
    });
  });
});
