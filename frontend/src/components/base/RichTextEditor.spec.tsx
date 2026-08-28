import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockUploadForumImage } = vi.hoisted(() => ({
  mockUploadForumImage: vi.fn(),
}));

vi.mock('@/api-services/storage.service', () => ({
  uploadForumImage: mockUploadForumImage,
  storageService: {
    uploadForumImage: mockUploadForumImage,
  },
}));

let lastQuillOptions: any = null;
let lastQuillInstance: any = null;
let textChangeCallbacks: Array<() => void> = [];

const captureQuillInstance = (instance: unknown) => {
  lastQuillInstance = instance;
};

vi.mock('quill', () => {
  return {
    default: class MockQuill {
      container: HTMLElement;
      options: any;
      root: HTMLDivElement;
      selection: { index: number } | null = { index: 3 };
      length = 10;
      insertEmbed = vi.fn();
      setSelection = vi.fn();
      getSelection = vi.fn().mockImplementation(() => this.selection);
      getLength = vi.fn().mockImplementation(() => this.length);
      on = vi.fn().mockImplementation((event: string, cb: () => void) => {
        if (event === 'text-change') {
          textChangeCallbacks.push(cb);
        }
      });

      constructor(container: HTMLElement, options: any) {
        this.container = container;
        this.options = options;
        lastQuillOptions = options;
        captureQuillInstance(this);

        this.root = document.createElement('div');
        this.root.className = 'ql-editor';
        this.root.setAttribute('data-testid', 'mock-quill-editor');
        container.appendChild(this.root);
      }
    },
  };
});

import RichTextEditor from './RichTextEditor';

describe('RichTextEditor Component (React 19 Native Quill)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastQuillOptions = null;
    lastQuillInstance = null;
    textChangeCallbacks = [];
  });

  it('instantiates native Quill editor with placeholder and initial value', () => {
    const handleChange = vi.fn();
    render(
      <RichTextEditor
        value="<p>Hello world</p>"
        onChange={handleChange}
        placeholder="Share your thoughts..."
      />
    );

    expect(screen.getByTestId('rich-text-editor-container')).toBeInTheDocument();
    expect(lastQuillInstance).not.toBeNull();
    expect(lastQuillOptions?.placeholder).toBe('Share your thoughts...');
    expect(lastQuillInstance.root.innerHTML).toBe('<p>Hello world</p>');
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

  it('triggers onChange when text-change event fires in Quill', () => {
    const handleChange = vi.fn();
    render(
      <RichTextEditor
        value=""
        onChange={handleChange}
      />
    );

    lastQuillInstance.root.innerHTML = '<p>Updated content</p>';
    textChangeCallbacks.forEach((cb) => cb());

    expect(handleChange).toHaveBeenCalledWith('<p>Updated content</p>');
  });

  it('configures custom image toolbar handler with uploadForumImage', async () => {
    render(
      <RichTextEditor
        value=""
        onChange={() => {}}
        userId="user-789"
      />
    );

    expect(lastQuillOptions).toBeDefined();
    expect(lastQuillOptions.modules.toolbar.handlers.image).toBeDefined();

    mockUploadForumImage.mockResolvedValue('https://cdn.supabase.co/storage/v1/object/public/forum-media/user-789/img.png');

    const imageHandler = lastQuillOptions.modules.toolbar.handlers.image;

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

    Object.defineProperty(inputEl, 'files', {
      value: [file],
      writable: false,
    });

    if (inputEl.onchange) {
      inputEl.onchange(new Event('change'));
    }

    await waitFor(() => {
      expect(mockUploadForumImage).toHaveBeenCalledWith(file, 'user-789');
      expect(lastQuillInstance.insertEmbed).toHaveBeenCalledWith(3, 'image', 'https://cdn.supabase.co/storage/v1/object/public/forum-media/user-789/img.png');
      expect(lastQuillInstance.setSelection).toHaveBeenCalledWith(4, 0);
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

    lastQuillInstance.selection = null;
    lastQuillInstance.length = 0;

    const imageHandler = lastQuillOptions.modules.toolbar.handlers.image;
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
      expect(lastQuillInstance.insertEmbed).toHaveBeenCalledWith(0, 'image', 'https://custom-cdn.com/my-pic.jpg');
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

    const imageHandler = lastQuillOptions.modules.toolbar.handlers.image;
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

    if (inputEl.onchange) {
      inputEl.onchange(new Event('change'));
    }

    await waitFor(() => {
      expect(mockUploadForumImage).toHaveBeenCalled();
    });
  });
});


