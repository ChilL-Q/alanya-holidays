import React, { useState, useMemo } from 'react';
import { Eye, Pencil } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatBlogContent } from '../../utils/formatBlogContent';
import { BLOG_PROSE_CLASSES } from '../../utils/blogProseStyles';

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

const TabButton: React.FC<{
    label: string;
    icon: React.ComponentType<{ size: number }>;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            isActive
                ? 'border-teal-500 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
    >
        <Icon size={14} />
        {label}
    </button>
);

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
        if (!content.trim()) return '';

        // Render markdown, passing empty imageUrls — placeholders stay as [image-N]
        let html = formatBlogContent(content.trim(), []);

        // Replace remaining [image-N] placeholders with visual stubs
        html = html.replace(
            /\[image-(\d+)\]/gi,
            (_match, num) =>
                `<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:24px 16px;margin:24px 0;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;color:#64748b;font-size:14px;font-weight:500;">📷 Image ${num}</div>`
        );

        return DOMPurify.sanitize(html);
    }, [content]);

    return (
        <div>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-3 border-b border-slate-200 dark:border-slate-700">
                <TabButton
                    label="Write"
                    icon={Pencil}
                    isActive={mode === 'write'}
                    onClick={() => setMode('write')}
                />
                <TabButton
                    label="Preview"
                    icon={Eye}
                    isActive={mode === 'preview'}
                    onClick={() => setMode('preview')}
                />
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
                    {previewHtml ? (
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
