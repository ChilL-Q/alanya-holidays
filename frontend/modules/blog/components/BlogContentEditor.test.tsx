import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BlogContentEditor } from './BlogContentEditor';

vi.mock('../../utils/formatBlogContent', () => ({
    formatBlogContent: (text: string, _imageUrls: string[]) => {
        // Minimal mock: wrap in <p>, convert ## to <h2>, handle **bold**
        let html = text;
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Wrap remaining lines in <p>
        html = html
            .split('\n')
            .map(line => (line.startsWith('<h2>') ? line : `<p>${line}</p>`))
            .join('\n');
        return html;
    },
}));

describe('BlogContentEditor', () => {
    const defaultProps = {
        content: '',
        onChange: vi.fn(),
        textareaRef: { current: null } as React.RefObject<HTMLTextAreaElement | null>,
    };

    it('renders textarea in write mode by default', () => {
        render(<BlogContentEditor {...defaultProps} content="Hello" />);
        expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
        expect(screen.getByText('Write')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('switches to preview mode and renders markdown as HTML', () => {
        render(<BlogContentEditor {...defaultProps} content="## My Heading" />);

        fireEvent.click(screen.getByText('Preview'));

        // textarea should be hidden
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        // heading should be rendered
        expect(screen.getByText('My Heading')).toBeInTheDocument();
        const heading = screen.getByText('My Heading');
        expect(heading.tagName).toBe('H2');
    });

    it('renders [image-N] as placeholder stubs in preview', () => {
        render(<BlogContentEditor {...defaultProps} content="Before [image-1] after" />);

        fireEvent.click(screen.getByText('Preview'));

        expect(screen.getByText(/📷 Image 1/)).toBeInTheDocument();
    });

    it('shows empty state in preview when content is empty', () => {
        render(<BlogContentEditor {...defaultProps} content="" />);

        fireEvent.click(screen.getByText('Preview'));

        expect(screen.getByText(/Nothing to preview/)).toBeInTheDocument();
    });

    it('switches back to write mode', () => {
        render(<BlogContentEditor {...defaultProps} content="Some text" />);

        fireEvent.click(screen.getByText('Preview'));
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Write'));
        expect(screen.getByDisplayValue('Some text')).toBeInTheDocument();
    });

    it('calls onChange when typing in textarea', () => {
        const onChange = vi.fn();
        render(<BlogContentEditor {...defaultProps} onChange={onChange} content="" />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New content' } });
        expect(onChange).toHaveBeenCalledWith('New content');
    });

    it('shows character counter when minLength is provided', () => {
        render(<BlogContentEditor {...defaultProps} content="Short" minLength={100} />);

        expect(screen.getByText('5 characters')).toBeInTheDocument();
        expect(screen.getByText(/Minimum 100 characters/)).toBeInTheDocument();
    });

    it('shows markdown hint in write mode', () => {
        render(<BlogContentEditor {...defaultProps} content="" />);
        expect(screen.getByText(/Supports markdown/)).toBeInTheDocument();
    });

    it('hides markdown hint in preview mode', () => {
        render(<BlogContentEditor {...defaultProps} content="test" />);
        fireEvent.click(screen.getByText('Preview'));
        expect(screen.queryByText(/Supports markdown/)).not.toBeInTheDocument();
    });

    it('shows preview footer text', () => {
        render(<BlogContentEditor {...defaultProps} content="hello" />);
        fireEvent.click(screen.getByText('Preview'));
        expect(screen.getByText(/This is a preview/)).toBeInTheDocument();
    });
});
