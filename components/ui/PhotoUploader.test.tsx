import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoUploader } from './PhotoUploader';

describe('PhotoUploader', () => {
    const mockOnChange = vi.fn();
    const defaultProps = {
        files: [] as File[],
        onChange: mockOnChange,
        maxFiles: 10,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders upload area', () => {
        render(<PhotoUploader {...defaultProps} />);

        expect(screen.getByText('Click or drag photos here')).toBeInTheDocument();
        expect(screen.getByText('Upload up to 10 photos (JPG, PNG)')).toBeInTheDocument();
    });

    it('renders upload icon', () => {
        render(<PhotoUploader {...defaultProps} />);

        // Upload icon should be present
        const iconContainer = screen.getByText('Click or drag photos here').previousSibling;
        expect(iconContainer).toBeInTheDocument();
    });

    it('opens file input when upload area clicked', () => {
        render(<PhotoUploader {...defaultProps} />);

        const uploadArea = screen.getByText('Click or drag photos here').closest('div');
        const fileInput = document.querySelector('input[type="file"]');

        if (uploadArea && fileInput) {
            fireEvent.click(uploadArea);
            expect(fileInput).toBeInTheDocument();
        }
    });

    it('handles file selection', () => {
        render(<PhotoUploader {...defaultProps} />);

        const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
        const fileInput = document.querySelector('input[type="file"]');

        if (fileInput) {
            fireEvent.change(fileInput, { target: { files: [file] } });
            expect(mockOnChange).toHaveBeenCalled();
        }
    });

    it('filters only image files', () => {
        render(<PhotoUploader {...defaultProps} />);

        const imageFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
        const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });
        const fileInput = document.querySelector('input[type="file"]');

        if (fileInput) {
            fireEvent.change(fileInput, { target: { files: [imageFile, textFile] } });
            expect(mockOnChange).toHaveBeenCalledWith([imageFile]);
        }
    });

    it('respects maxFiles limit', () => {
        render(<PhotoUploader {...defaultProps} maxFiles={2} />);

        const file1 = new File(['image'], 'test1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['image'], 'test2.jpg', { type: 'image/jpeg' });
        const file3 = new File(['image'], 'test3.jpg', { type: 'image/jpeg' });
        const fileInput = document.querySelector('input[type="file"]');

        if (fileInput) {
            fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });
            expect(mockOnChange).toHaveBeenCalledWith([file1, file2]);
        }
    });

    it('shows file previews when files provided', () => {
        const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
        render(<PhotoUploader {...defaultProps} files={[file]} />);

        expect(screen.getByAltText('Preview 0')).toBeInTheDocument();
    });

    it('shows multiple file previews', () => {
        const file1 = new File(['image'], 'test1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['image'], 'test2.jpg', { type: 'image/jpeg' });
        render(<PhotoUploader {...defaultProps} files={[file1, file2]} />);

        expect(screen.getByAltText('Preview 0')).toBeInTheDocument();
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    });

    it('removes file when remove button clicked', () => {
        const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
        render(<PhotoUploader {...defaultProps} files={[file]} />);

        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);

        expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('remove button has correct styling', () => {
        const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
        render(<PhotoUploader {...defaultProps} files={[file]} />);

        const removeButton = screen.getByRole('button');
        expect(removeButton).toHaveClass('bg-white/90');
        expect(removeButton).toHaveClass('text-rose-500');
    });

    it('handles drag enter event', () => {
        render(<PhotoUploader {...defaultProps} />);

        const uploadArea = screen.getByText('Click or drag photos here').closest('div');

        if (uploadArea) {
            fireEvent.dragEnter(uploadArea);
            expect(uploadArea).toHaveClass('border-teal-500');
        }
    });

    it('handles drag leave event', () => {
        render(<PhotoUploader {...defaultProps} />);

        const uploadArea = screen.getByText('Click or drag photos here').closest('div');

        if (uploadArea) {
            fireEvent.dragEnter(uploadArea);
            fireEvent.dragLeave(uploadArea);
            expect(uploadArea).not.toHaveClass('border-teal-500');
        }
    });

    it('handles drop event', () => {
        render(<PhotoUploader {...defaultProps} />);

        const uploadArea = screen.getByText('Click or drag photos here').closest('div');
        const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

        if (uploadArea) {
            fireEvent.drop(uploadArea, {
                dataTransfer: {
                    files: [file],
                    types: ['Files'],
                },
            });
            expect(mockOnChange).toHaveBeenCalled();
        }
    });
});
