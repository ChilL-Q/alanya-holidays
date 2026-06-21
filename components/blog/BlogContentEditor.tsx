import React, { useState, useMemo } from 'react';
import { Eye, Pencil } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatBlogContent } from '../../utils/formatBlogContent';

const BLOG_PROSE_CLASSES = `prose prose-lg dark:prose-invert max-w-none
  prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
  prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
  prose-a:text-teal-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
  prose-img:rounded-xl prose-img:shadow-lg
  prose-ul:text-slate-700 dark:prose-ul:text-slate-300
  prose-li:text-slate-700 dark:prose-li:text-slate-300
  prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/50 dark:prose-blockquote:bg-teal-900/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic`;

interface BlogContentEditorProps {
    content: string;
    onChange: (value: string) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    placeholder?: string;
    rows?: number;
    minLength?: number;
    required?: boolean;
    textareaClassName?: string;
}

export const BlogContentEditor: React.FC<BlogContentEditorProps> = ({
    content,
    onChange,
    textareaRef,
    placeholder = 'Write the full content here...',
    rows = 14,
    minLength,
    required,
    textareaClassName,
}) => {
    const [mode, setMode] = useState<'write' | 'preview'>('write');

    const previewHtml = useMemo(() => {
        if (mode !== 'preview' || !content.trim()) return '';

        // Render markdown, passing empty imageUrls — placeholders stay as [image-N]
        let html = formatBlogContent(content.trim(), []);

        // Replace remaining [image-N] placeholders with visual stubs
        html = html.replace(
            /\[image-(\d+)\]/gi,
            (_match, num) =>
                `<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:24px 16px;margin:24px 0;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;color:#64748b;font-size:14px;font-weight:500;">📷 Image ${num}</div>`
        );

        return DOMPurify.sanitize(html);
    }, [mode, content]);

    return (
        <div>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-3 border-b border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setMode('write')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        mode === 'write'
                            ? 'border-teal-500 text-teal-700 dark:text-teal-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Pencil size={14} />
                    Write
                </button>
                <button
                    type="button"
                    onClick={() => setMode('preview')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        mode === 'preview'
                            ? 'border-teal-500 text-teal-700 dark:text-teal-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Eye size={14} />
                    Preview
                </button>
            </div>

            {/* Write mode */}
            {mode === 'write' && (
                <>
                    <textarea
                        name="blog-content"
                        ref={textareaRef}
                        value={content}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        required={required}
                        className={textareaClassName || 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-y'}
                    />
                    {minLength != null && (
                        <div className="flex justify-between mt-1.5">
                            <p className="text-xs text-slate-400">
                                Minimum {minLength} characters. Use [image-1] format to place images.
                            </p>
                            <p className={`text-xs ${content.length < minLength ? 'text-amber-500' : 'text-teal-500'}`}>
                                {content.length} characters
                            </p>
                        </div>
                    )}
                    <p className="mt-1.5 text-xs text-slate-400">
                        Supports markdown: <code>## Heading</code>, <code>- list item</code>, <code>**bold**</code>, <code>&gt; Don&apos;t Miss: important tip</code>.
                    </p>
                </>
            )}

            {/* Preview mode */}
            {mode === 'preview' && (
                <div className="min-h-[200px]">
                    {content.trim() ? (
                        <div
                            className={BLOG_PROSE_CLASSES}
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                    ) : (
                        <div className="flex items-center justify-center min-h-[200px] text-slate-400 dark:text-slate-500 text-sm italic">
                            Nothing to preview yet — switch to Write and add some content.
                        </div>
                    )}
                    <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 italic">
                        This is a preview. Switch to Write to edit.
                    </p>
                </div>
            )}
        </div>
    );
};
