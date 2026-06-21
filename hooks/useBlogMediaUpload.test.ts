import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBlogMediaUpload } from './useBlogMediaUpload';
import { db } from '../api-services';
import { toast } from 'react-hot-toast';

vi.mock('../api-services', () => ({
    db: {
        uploadBlogMediaBatch: vi.fn(),
    },
    BLOG_MAX_FILE_SIZE: 5 * 1024 * 1024,
    BLOG_ALLOWED_EXTENSIONS: new Set(['jpg', 'jpeg', 'png', 'webp']),
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn().mockReturnValue('toast-id'),
    }
}));

const DUMMY_DATA_URL = 'data:image/png;base64,dummy';

describe('useBlogMediaUpload', () => {
    let mockSetContent: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetContent = vi.fn();

        const MockFileReader = vi.fn().mockImplementation(function (this: any) {
            this.readAsDataURL = vi.fn().mockImplementation(function (this: any) {
                this.onload({ target: { result: DUMMY_DATA_URL } });
            });
        });
        vi.stubGlobal('FileReader', MockFileReader);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('initializes with empty files and previews', () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        expect(result.current.mediaFiles).toEqual([]);
        expect(result.current.mediaPreviews).toEqual([]);
        expect(result.current.uploading).toBe(false);
    });

    it('adds valid selected files', async () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

        await act(async () => {
            result.current.handleFileSelect({
                target: { files: [file] }
            } as any);
        });

        expect(result.current.mediaFiles).toEqual([file]);
        expect(result.current.mediaPreviews).toEqual([DUMMY_DATA_URL]);
    });

    it('validates file size limit', async () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

        await act(async () => {
            result.current.handleFileSelect({
                target: { files: [largeFile] }
            } as any);
        });

        expect(result.current.mediaFiles).toEqual([]);
        expect(toast.error).toHaveBeenCalledWith('large.jpg exceeds 5MB limit');
    });

    it('validates file format extensions', async () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        const invalidFile = new File(['text'], 'test.txt', { type: 'text/plain' });

        await act(async () => {
            result.current.handleFileSelect({
                target: { files: [invalidFile] }
            } as any);
        });

        expect(result.current.mediaFiles).toEqual([]);
        expect(toast.error).toHaveBeenCalledWith('test.txt is not a supported format (jpg, png, webp)');
    });

    it('removes a media file by index', async () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        const file1 = new File(['1'], 'img1.png', { type: 'image/png' });
        const file2 = new File(['2'], 'img2.png', { type: 'image/png' });

        await act(async () => {
            result.current.handleFileSelect({
                target: { files: [file1, file2] }
            } as any);
        });

        expect(result.current.mediaFiles.length).toBe(2);

        await act(async () => {
            result.current.removeMedia(0);
        });

        expect(result.current.mediaFiles).toEqual([file2]);
    });

    it('clears all media lists', async () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        const file = new File(['1'], 'img1.png', { type: 'image/png' });

        await act(async () => {
            result.current.handleFileSelect({
                target: { files: [file] }
            } as any);
        });

        expect(result.current.mediaFiles.length).toBe(1);

        act(() => {
            result.current.clearMedia();
        });

        expect(result.current.mediaFiles).toEqual([]);
        expect(result.current.mediaPreviews).toEqual([]);
    });

    it('inserts [image-N] format placeholder into content', () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));

        // Mock textarea ref and selection
        const mockTextarea = {
            value: 'Hello World',
            selectionStart: 6,
            selectionEnd: 6,
            focus: vi.fn(),
            setSelectionRange: vi.fn(),
        };
        (result.current.textareaRef as any).current = mockTextarea;

        act(() => {
            result.current.insertPlaceholder(0);
        });

        expect(mockSetContent).toHaveBeenCalledWith('Hello [image-1]World');
    });

    it('uploads images successfully and returns URLs', async () => {
        const { result } = renderHook(() => useBlogMediaUpload({ setContent: mockSetContent }));
        const file = new File(['1'], 'img1.png', { type: 'image/png' });

        await act(async () => {
            result.current.handleFileSelect({
                target: { files: [file] }
            } as any);
        });

        const mockUrls = ['https://example.com/img1.png'];
        (db.uploadBlogMediaBatch as any).mockResolvedValue(mockUrls);

        let urls: string[] = [];
        await act(async () => {
            urls = await result.current.uploadImages();
        });

        expect(db.uploadBlogMediaBatch).toHaveBeenCalledWith([file]);
        expect(urls).toEqual(mockUrls);
        expect(toast.success).toHaveBeenCalledWith('Images uploaded', { id: 'toast-id' });
    });
});
