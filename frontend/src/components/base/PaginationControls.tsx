import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface PaginationControlsProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  mode?: 'numbered' | 'load-more' | 'both';
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreText?: string;
  loadingText?: string;
  totalItems?: number;
  pageSize?: number;
  showItemCount?: boolean;
  itemName?: string;
  className?: string;
}

function getPageRange(currentPage: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '…', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  mode = 'numbered',
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  loadMoreText = 'Load More',
  loadingText = 'Loading...',
  totalItems,
  pageSize = 10,
  showItemCount = false,
  itemName = 'items',
  className = '',
}) => {
  const showNumbered = mode === 'numbered' || mode === 'both';
  const showLoadMore = mode === 'load-more' || mode === 'both';

  const startItem = totalItems !== undefined ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 0;
  const endItem = totalItems !== undefined ? Math.min(currentPage * pageSize, totalItems) : 0;

  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}
    >
      {/* Item count summary */}
      {showItemCount && totalItems !== undefined && (
        <div className="text-xs md:text-sm text-foreground-500 font-medium">
          Showing {totalItems > 0 ? `${startItem}–${endItem}` : 0} of {totalItems} {itemName}
        </div>
      )}

      {/* Numbered pagination */}
      {showNumbered && totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Previous button */}
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-background-200 text-xs md:text-sm font-medium text-foreground-700 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Previous</span>
          </button>

          {/* Page numbers */}
          {pages.map((page, index) => {
            if (page === '…') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-xs md:text-sm text-foreground-400 select-none"
                >
                  …
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                aria-label={`${page}`}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onPageChange?.(page)}
                className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-primary-500 text-white shadow-xs'
                    : 'border border-background-200 text-foreground-700 hover:bg-background-100'
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* Next button */}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-background-200 text-xs md:text-sm font-medium text-foreground-700 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* Load More button */}
      {showLoadMore && hasMore && (
        <div className="flex justify-center w-full sm:w-auto">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => onLoadMore?.()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-xs md:text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoadingMore ? loadingText : loadMoreText}</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default PaginationControls;
