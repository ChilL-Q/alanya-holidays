import { useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadForumImage } from '@/api-services/storage.service';
import { logger } from '@/lib/logger';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  userId?: string;
  onImageUpload?: (file: File) => Promise<string>;
  modules?: Record<string, unknown>;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  maxLength,
  className = '',
  userId,
  onImageUpload,
  modules: customModules,
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null);

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

        const editor = quillRef.current?.getEditor
          ? quillRef.current.getEditor()
          : quillRef.current?.editor;

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

  const modules = useMemo(() => {
    if (customModules) return customModules;
    return {
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
    };
  }, [customModules, handleImageUpload]);

  const formats = [
    'bold', 'italic', 'strike', 'code',
    'header',
    'blockquote', 'code-block',
    'list',
    'link', 'image', 'video',
  ];

  const textLength = value.replace(/<[^>]*>/g, '').length;
  const showCounter = maxLength !== undefined;

  return (
    <div className={`relative ${className}`} data-testid="rich-text-editor-container">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        className="bg-background-0 border border-background-200/70 rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100/60 transition-all"
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
