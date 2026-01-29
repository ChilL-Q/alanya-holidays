
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
    const defaultProps = {
        currentPage: 1,
        totalPages: 10,
        onPageChange: vi.fn(),
    };

    it('should not render if totalPages is 1', () => {
        const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render correct page numbers for small range', () => {
        render(<Pagination {...defaultProps} totalPages={5} />);
        // Should verify 1, 2, 3, 4, 5 are present
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('should call onPageChange when clicking a page number', () => {
        const onPageChange = vi.fn();
        render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

        fireEvent.click(screen.getByText('2'));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should handle Next/Previous buttons', () => {
        const onPageChange = vi.fn();
        render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);

        const prevBtn = screen.getByLabelText('Previous Page');
        const nextBtn = screen.getByLabelText('Next Page');

        fireEvent.click(prevBtn);
        expect(onPageChange).toHaveBeenCalledWith(1);

        fireEvent.click(nextBtn);
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should disable Previous button on first page', () => {
        render(<Pagination {...defaultProps} currentPage={1} />);
        expect(screen.getByLabelText('Previous Page')).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
        render(<Pagination {...defaultProps} currentPage={10} />);
        expect(screen.getByLabelText('Next Page')).toBeDisabled();
    });

    it('should render ellipses for complex ranges', () => {
        // Case: Middle page (e.g., current=5, total=10) -> 1 ... 4 5 6 ... 10
        render(<Pagination {...defaultProps} currentPage={5} totalPages={10} />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        // Should have 2 sets of ellipses
        const ellipses = screen.getAllByText('...');
        expect(ellipses).toHaveLength(2);
    });
});
