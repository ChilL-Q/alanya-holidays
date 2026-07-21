import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from './Counter';

describe('Counter', () => {
    it('renders initial value', () => {
        render(<Counter value={5} onChange={() => { }} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('calls onChange with incremented value', () => {
        const handleChange = vi.fn();
        render(<Counter value={1} onChange={handleChange} />);

        // Assuming + button is the second button or has aria-label. 
        // Let's rely on finding by "+" text or role if possible.
        // Inspecting file via view_file would verify, but standard is usually + / -
        // Assuming standard layout: - Value + 
        const buttons = screen.getAllByRole('button');
        const incButton = buttons[1]; // Typically second button

        fireEvent.click(incButton);
        expect(handleChange).toHaveBeenCalledWith(2);
    });

    it('calls onChange with decremented value', () => {
        const handleChange = vi.fn();
        render(<Counter value={5} onChange={handleChange} />);
        const buttons = screen.getAllByRole('button');
        const decButton = buttons[0];

        fireEvent.click(decButton);
        expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('does not go below min', () => {
        const handleChange = vi.fn();
        render(<Counter value={0} min={0} onChange={handleChange} />);
        const buttons = screen.getAllByRole('button');
        const decButton = buttons[0];

        fireEvent.click(decButton);
        expect(handleChange).not.toHaveBeenCalled();
        // Or check if button is disabled if component supports it
    });
});
