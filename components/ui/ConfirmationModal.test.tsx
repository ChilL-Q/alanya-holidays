import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
    it('renders correctly when open', () => {
        render(
            <ConfirmationModal
                isOpen={true}
                title="Are you sure?"
                message="This action cannot be undone."
                onConfirm={() => { }}
                onClose={() => { }}
            />
        );

        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('calls onConfirm when confirmed', () => {
        const handleConfirm = vi.fn();
        render(
            <ConfirmationModal
                isOpen={true}
                title="Title"
                message="Message"
                onConfirm={handleConfirm}
                onClose={() => { }}
            />
        );

        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);
        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancelled', () => {
        const handleClose = vi.fn();
        render(
            <ConfirmationModal
                isOpen={true}
                title="Title"
                message="Message"
                onConfirm={() => { }}
                onClose={handleClose}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
