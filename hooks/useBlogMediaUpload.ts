import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { db } from '../api-services';
import { BLOG_MAX_FILE_SIZE, BLOG_ALLOWED_EXTENSIONS } from '../api-services';
import { MAX_BLOG_IMAGES } from '../utils/formatBlogContent';

export interface UseBlogMediaUploadOptions {
    setContent: (val: string) => void;
}

export function useBlogMediaUpload({ setContent }: UseBlogMediaUploadOptions) {
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertPlaceholder = (index: number) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const placeholder = `[image-${index + 1}]`;

        const newContent = text.substring(0, start) + placeholder + text.substring(end);
        setContent(newContent);

        // Focus back on textarea and position cursor after placeholder
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 0);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = MAX_BLOG_IMAGES - mediaFiles.length;
        const toAdd = files.slice(0, remaining);

        const valid: File[] = [];
        for (const file of toAdd) {
            if (file.size > BLOG_MAX_FILE_SIZE) {
                toast.error(`${file.name} exceeds ${BLOG_MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
                continue;
            }
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!BLOG_ALLOWED_EXTENSIONS.has(ext || '')) {
                toast.error(`${file.name} is not a supported format (jpg, png, webp)`);
                continue;
            }
            valid.push(file);
        }

        if (!valid.length) return;

        setMediaFiles(prev => [...prev, ...valid]);

        Promise.all(
            valid.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
                    reader.readAsDataURL(file);
                });
            })
        )
        .then(newPreviews => {
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        })
        .catch(err => {
            toast.error(err instanceof Error ? err.message : 'Error reading files');
        });

        e.target.value = '';
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (): Promise<string[]> => {
        if (mediaFiles.length === 0) return [];
        setUploading(true);
        const toastId = toast.loading('Uploading images...');
        try {
            const urls = await db.uploadBlogMediaBatch(mediaFiles);
            toast.success('Images uploaded', { id: toastId });
            return urls;
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Failed to upload images';
            toast.error(errMsg, { id: toastId });
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const clearMedia = () => {
        setMediaFiles([]);
        setMediaPreviews([]);
    };

    return {
        mediaFiles,
        mediaPreviews,
        uploading,
        setUploading,
        fileInputRef,
        textareaRef,
        insertPlaceholder,
        handleFileSelect,
        removeMedia,
        uploadImages,
        clearMedia,
    };
}
