import { useEffect, useRef, useMemo, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { uploadForumImage } from '@/api-services/storage.service';
import { logger } from '@/lib/logger';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  inputId?: string;
  ariaLabel?: string;
  userId?: string;
  onImageUpload?: { (file: File): Promise<string> };
  modules?: Record<string, unknown>;
  insertContent?: { id: number; html: string } | null;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  maxLength,
  className = '',
  inputId,
  ariaLabel,
  userId,
  onImageUpload,
  modules: customModules,
  insertContent,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isInternalChangeRef = useRef(false);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const url = onImageUpload
          ? await onImageUpload(file)
          : await uploadForumImage(file, userId || 'anonymous');

        const editor = quillRef.current;
        if (editor) {
          const range = editor.getSelection(true);
          const index = range ? range.index : editor.getLength();
          editor.insertEmbed(index, 'image', url);
          editor.setSelection(index + 1, 0);
        }
      } catch (err) {
        logger.error('Failed to upload image in RichTextEditor:', err);
      }
    };
  }, [userId, onImageUpload]);

  const defaultModules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'strike', 'code'],
        [{ header: [2, 3, 4, false] }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  }), [handleImageUpload]);

  const initialValueRef = useRef(value);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous editor DOM if any
    container.innerHTML = '';
    const editorDiv = document.createElement('div');
    container.appendChild(editorDiv);

    const modules = customModules || defaultModules;
    if (modules && typeof modules === 'object' && 'toolbar' in modules) {
      const tb = (modules as Record<string, unknown>).toolbar;
      if (tb && typeof tb === 'object' && !('handlers' in tb && (tb as Record<string, unknown>).handlers)) {
        (tb as Record<string, unknown>).handlers = { image: handleImageUpload };
      }
    }

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      placeholder,
      modules,
      formats: [
        'bold', 'italic', 'strike', 'code',
        'header',
        'blockquote', 'code-block',
        'list',
        'link', 'image', 'video',
      ],
    });

    if (quill.root) {
      if (placeholder) {
        quill.root.setAttribute('placeholder', placeholder);
      }
      if (inputId) {
        quill.root.id = inputId;
      }
      if (ariaLabel) {
        quill.root.setAttribute('aria-label', ariaLabel);
      }
      Object.defineProperty(quill.root, 'value', {
        get() {
          return this.innerHTML;
        },
        set(val: string) {
          this.innerHTML = val;
        },
        configurable: true,
      });
    }

    const handleDomEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && 'value' in target && typeof (target as unknown as { value: string }).value === 'string') {
        onChange((target as unknown as { value: string }).value);
      } else {
        const html = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML;
        onChange(html);
      }
    };
    editorDiv.addEventListener('input', handleDomEvent);
    editorDiv.addEventListener('change', handleDomEvent);

    quillRef.current = quill;

    if (initialValueRef.current) {
      quill.root.innerHTML = initialValueRef.current;
    }

    quill.on('text-change', () => {
      if (isInternalChangeRef.current) return;
      const html = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML;
      onChange(html);
    });

    return () => {
      editorDiv.removeEventListener('input', handleDomEvent);
      editorDiv.removeEventListener('change', handleDomEvent);
      quillRef.current = null;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [ariaLabel, customModules, defaultModules, handleImageUpload, inputId, onChange, placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML;
    const isCleanEmpty = (currentHtml === '<p><br></p>' || !currentHtml) && !value;

    if (currentHtml !== value && !isCleanEmpty) {
      isInternalChangeRef.current = true;
      quill.root.innerHTML = value || '';
      isInternalChangeRef.current = false;
    }
  }, [value]);

  useEffect(() => {
    const editor = quillRef.current;
    if (!editor || !insertContent?.html) return;
    const range = editor.getSelection(true);
    const index = range?.index ?? Math.max(0, editor.getLength() - 1);
    editor.clipboard.dangerouslyPasteHTML(index, insertContent.html, 'user');
    editor.setSelection(index + 1, 0);
  }, [insertContent]);

  const textLength = value.replace(/<[^>]*>/g, '').length;
  const showCounter = maxLength !== undefined;

  return (
    <div className={`relative ${className}`} data-testid="rich-text-editor-container">
      <div
        ref={containerRef}
        className="bg-background-0 border border-background-200/70 rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100/60 transition-all overflow-hidden"
      />
      {showCounter && (
        <div className="flex justify-end mt-1">
          <span
            className={`text-xs ${
              textLength > maxLength ? 'text-primary-500' : 'text-foreground-400'
            }`}
          >
            {textLength}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
