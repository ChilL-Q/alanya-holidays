import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const { mockUploadForumImage } = vi.hoisted(() => ({
  mockUploadForumImage: vi.fn(),
}));

vi.mock('@/api-services/storage.service', () => ({
  uploadForumImage: mockUploadForumImage,
  storageService: {
    uploadForumImage: mockUploadForumImage,
  },
}));

// Mock ReactQuill for jsdom environment
let lastModulesPassed: any = null;
let lastRefPassed: any = null;

vi.mock('react-quill', () => {
  return {
    default: React.forwardRef((props: any, ref: any) => {
      lastModulesPassed = props.modules;
      lastRefPassed = ref;
      return (
        <div data-testid="mock-react-quill">
          <textarea
            data-testid="quill-textarea"
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
          />
        </div>
      );
    }),
  };
});

import RichTextEditor from './RichTextEditor';

describe('RichTextEditor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastModulesPassed = null;
    lastRefPassed = null;
  });

  it('renders the editor with placeholder and value', () => {
    const handleChange = vi.fn();
    render(
      <RichTextEditor
        value="<p>Hello world</p>"
        onChange={handleChange}
        placeholder="Share your thoughts..."
      />
    );

    expect(screen.getByTestId('mock-react-quill')).toBeInTheDocument();
    const textarea = screen.getByTestId('quill-textarea');
    expect(textarea).toHaveValue('<p>Hello world</p>');
    expect(textarea).toHaveAttribute('placeholder', 'Share your thoughts...');
  });

  it('renders character count when maxLength is specified', () => {
    const { rerender } = render(
      <RichTextEditor
        value="<p>Short</p>"
        onChange={() => {}}
        maxLength={50}
      />
    );

    // Strips HTML <p>Short</p> -> "Short" (length 5)
    expect(screen.getByText('5/50')).toBeInTheDocument();

    rerender(
      <RichTextEditor
        value="<p>This is a much longer text exceeding thirty characters</p>"
        onChange={() => {}}
        maxLength={30}
      />
    );

    expect(screen.getByText('54/30')).toHaveClass('text-primary-500');
  });

  it('configures custom image toolbar handler with uploadForumImage', async () => {
    render(
      <RichTextEditor
        value=""
        onChange={() => {}}
        userId="user-789"
      />
    );

    expect(lastModulesPassed).toBeDefined();
    expect(lastModulesPassed.toolbar.handlers.image).toBeDefined();

    // Mock Quill editor instance
    const mockInsertEmbed = vi.fn();
    const mockSetSelection = vi.fn();
    const mockGetSelection = vi.fn().mockReturnValue({ index: 3 });
    const mockGetEditor = vi.fn().mockReturnValue({
      insertEmbed: mockInsertEmbed,
      setSelection: mockSetSelection,
      getSelection: mockGetSelection,
      getLength: vi.fn().mockReturnValue(10),
    });

    if (lastRefPassed) {
      if (typeof lastRefPassed === 'function') {
        lastRefPassed({ getEditor: mockGetEditor });
      } else {
        lastRefPassed.current = { getEditor: mockGetEditor };
      }
    }

    mockUploadForumImage.mockResolvedValue('https://cdn.supabase.co/storage/v1/object/public/forum-media/user-789/img.png');

    // Trigger the image handler
    const imageHandler = lastModulesPassed.toolbar.handlers.image;

    // Spy on document.createElement to intercept input file creation
    const file = new File(['fake-img'], 'uploaded.png', { type: 'image/png' });
    const originalCreateElement = document.createElement.bind(document);
    let capturedInput: HTMLInputElement | null = null;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'input') {
        capturedInput = el as HTMLInputElement;
      }
      return el;
    });

    imageHandler();

    expect(capturedInput).not.toBeNull();
    const inputEl = capturedInput as unknown as HTMLInputElement;
    expect(inputEl.type).toBe('file');
    expect(inputEl.accept).toBe('image/*');

    // Simulate selecting a file
    Object.defineProperty(inputEl, 'files', {
      value: [file],
      writable: false,
    });

    if (inputEl.onchange) {
      inputEl.onchange(new Event('change'));
    }

    await waitFor(() => {
      expect(mockUploadForumImage).toHaveBeenCalledWith(file, 'user-789');
      expect(mockInsertEmbed).toHaveBeenCalledWith(3, 'image', 'https://cdn.supabase.co/storage/v1/object/public/forum-media/user-789/img.png');
      expect(mockSetSelection).toHaveBeenCalledWith(4, 0);
    });
  });

  it('uses custom onImageUpload callback when provided', async () => {
    const customUpload = vi.fn().mockResolvedValue('https://custom-cdn.com/my-pic.jpg');

    render(
      <RichTextEditor
        value=""
        onChange={() => {}}
        onImageUpload={customUpload}
      />
    );

    const mockInsertEmbed = vi.fn();
    const mockGetEditor = vi.fn().mockReturnValue({
      insertEmbed: mockInsertEmbed,
      setSelection: vi.fn(),
      getSelection: vi.fn().mockReturnValue(null),
      getLength: vi.fn().mockReturnValue(0),
    });

    if (lastRefPassed) {
      if (typeof lastRefPassed === 'function') {
        lastRefPassed({ getEditor: mockGetEditor });
      } else {
        lastRefPassed.current = { getEditor: mockGetEditor };
      }
    }

    const imageHandler = lastModulesPassed.toolbar.handlers.image;
    const file = new File(['fake-img'], 'custom.jpg', { type: 'image/jpeg' });
    let capturedInput: HTMLInputElement | null = null;
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'input') {
        capturedInput = el as HTMLInputElement;
      }
      return el;
    });

    imageHandler();

    const inputEl = capturedInput as unknown as HTMLInputElement;
    Object.defineProperty(inputEl, 'files', {
      value: [file],
      writable: false,
    });

    if (inputEl.onchange) {
      inputEl.onchange(new Event('change'));
    }

    await waitFor(() => {
      expect(customUpload).toHaveBeenCalledWith(file);
      expect(mockUploadForumImage).not.toHaveBeenCalled();
      expect(mockInsertEmbed).toHaveBeenCalledWith(0, 'image', 'https://custom-cdn.com/my-pic.jpg');
    });
  });

  it('handles image upload errors gracefully without throwing', async () => {
    mockUploadForumImage.mockRejectedValue(new Error('Network upload failure'));

    render(
      <RichTextEditor
        value=""
        onChange={() => {}}
      />
    );

    const imageHandler = lastModulesPassed.toolbar.handlers.image;
    const file = new File(['fake-img'], 'err.jpg', { type: 'image/jpeg' });
    let capturedInput: HTMLInputElement | null = null;
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'input') {
        capturedInput = el as HTMLInputElement;
      }
      return el;
    });

    imageHandler();

    const inputEl = capturedInput as unknown as HTMLInputElement;
    Object.defineProperty(inputEl, 'files', {
      value: [file],
      writable: false,
    });

    // Should not throw unhandled exception
    if (inputEl.onchange) {
      inputEl.onchange(new Event('change'));
    }

    await waitFor(() => {
      expect(mockUploadForumImage).toHaveBeenCalled();
    });
  });
});

