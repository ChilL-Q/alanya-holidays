import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from './storage';

// Mock supabase client
const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            storage: {
                from: vi.fn(),
                listBuckets: vi.fn(),
            },
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
            }
        }
    }
});

vi.mock('../supabase', () => ({
    supabase: mockSupabase,
    config: {
        storageUrl: 'https://test.supabase.co/storage/v1'
    }
}));

const makeBucket = (uploadError: any = null, publicUrl = 'https://test.supabase.co/img.png') => ({
    upload: vi.fn().mockResolvedValue({ data: {}, error: uploadError }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl } }),
    listBuckets: vi.fn().mockResolvedValue({ data: [{ id: 'properties' }] })
});

describe('storageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadPropertyImage', () => {
        it('uploads image and returns public URL', async () => {
            const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
            const bucket = makeBucket();
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            const result = await storageService.uploadPropertyImage(mockFile);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('properties');
            expect(bucket.upload).toHaveBeenCalled();
            expect(result).toContain('https://test.supabase.co');
        });

        it('throws error if upload fails', async () => {
            const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
            const bucket = makeBucket({ message: 'Upload failed' });
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            await expect(storageService.uploadPropertyImage(mockFile)).rejects.toEqual({ message: 'Upload failed' });
        });
    });

    describe('uploadAvatar', () => {
        it('uploads avatar to avatars bucket and returns URL', async () => {
            const mockFile = new File(['content'], 'avatar.png', { type: 'image/png' });
            const bucket = makeBucket();
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            const result = await storageService.uploadAvatar(mockFile);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('avatars');
            expect(result).toBe('https://test.supabase.co/img.png');
        });

        it('falls back to properties bucket if avatars fails', async () => {
            const mockFile = new File(['content'], 'avatar.png', { type: 'image/png' });
            // First call (avatars) fails, second (properties) succeeds
            const failBucket = makeBucket({ message: 'avatars fail' });
            const successBucket = makeBucket();
            mockSupabase.storage.from
                .mockReturnValueOnce(failBucket as any)
                .mockReturnValueOnce(successBucket as any)
                .mockReturnValueOnce(successBucket as any);

            const result = await storageService.uploadAvatar(mockFile);
            expect(result).toBe('https://test.supabase.co/img.png');
        });
    });

    describe('uploadImage', () => {
        it('uploads to specified bucket and returns URL', async () => {
            const mockFile = new File(['content'], 'img.jpg', { type: 'image/jpeg' });
            const bucket = makeBucket();
            // listBuckets returns services bucket
            mockSupabase.storage.listBuckets = vi.fn().mockResolvedValue({ data: [{ id: 'services' }] });
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            const result = await storageService.uploadImage(mockFile, 'services');
            expect(result).toBe('https://test.supabase.co/img.png');
        });

        it('falls back to properties if bucket not found', async () => {
            const mockFile = new File(['content'], 'img.jpg', { type: 'image/jpeg' });
            const bucket = makeBucket();
            // listBuckets returns only properties (no products)
            mockSupabase.storage.listBuckets = vi.fn().mockResolvedValue({ data: [{ id: 'properties' }] });
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            await storageService.uploadImage(mockFile, 'products');
            // Should fallback to properties bucket
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('properties');
        });

        it('defaults to properties bucket when no bucket specified', async () => {
            const mockFile = new File(['content'], 'img.jpg', { type: 'image/jpeg' });
            const bucket = makeBucket();
            mockSupabase.storage.listBuckets = vi.fn().mockResolvedValue({ data: [{ id: 'properties' }] });
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            await storageService.uploadImage(mockFile);
            expect(mockSupabase.storage.from).toHaveBeenCalledWith('properties');
        });
    });

    // ============================================================
    // uploadBlogMedia
    // ============================================================

    describe('uploadBlogMedia', () => {
        it('uploads a valid file and returns public URL', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const mockFile = new File(['content'], 'blog-image.png', { type: 'image/png' });
            const bucket = makeBucket();
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            const result = await storageService.uploadBlogMedia(mockFile);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('blog-media');
            expect(bucket.upload).toHaveBeenCalled();
            expect(result).toBe('https://test.supabase.co/img.png');
        });

        it('throws when user is not authenticated', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
            const mockFile = new File(['content'], 'blog-image.png', { type: 'image/png' });

            await expect(storageService.uploadBlogMedia(mockFile)).rejects.toThrow('Not authenticated');
        });

        it('throws when file exceeds 5MB', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const mockFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });

            await expect(storageService.uploadBlogMedia(mockFile)).rejects.toThrow('File size exceeds maximum allowed size of 5MB');
        });

        it('throws when file type is gif', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const mockFile = new File(['content'], 'animated.gif', { type: 'image/gif' });

            await expect(storageService.uploadBlogMedia(mockFile)).rejects.toThrow('File type ".gif" is not allowed');
        });

        it('throws when file type is svg', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const mockFile = new File(['content'], 'icon.svg', { type: 'image/svg+xml' });

            await expect(storageService.uploadBlogMedia(mockFile)).rejects.toThrow('File type ".svg" is not allowed');
        });

        it('throws when file extension is not allowed', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

            await expect(storageService.uploadBlogMedia(mockFile)).rejects.toThrow('File type ".pdf" is not allowed');
        });

        it('throws when MIME type is not allowed', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const mockFile = new File(['content'], 'data.bin', { type: 'application/octet-stream' });
            // Override extension to bypass extension check
            Object.defineProperty(mockFile, 'name', { value: 'image.txt' });

            await expect(storageService.uploadBlogMedia(mockFile)).rejects.toThrow('File type ".txt" is not allowed');
        });
    });

    // ============================================================
    // deleteBlogMedia
    // ============================================================

    describe('deleteBlogMedia', () => {
        it('successfully deletes a file owned by the user', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            const bucket = {
                remove: vi.fn().mockResolvedValue({ data: null, error: null })
            };
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            await storageService.deleteBlogMedia('test-user-id/some-file.png');

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('blog-media');
            expect(bucket.remove).toHaveBeenCalledWith(['test-user-id/some-file.png']);
        });

        it('throws when trying to delete another user\'s file as non-admin', async () => {
            // User is 'test-user-id', file belongs to 'other-user-id'
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            mockSupabase.from = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null })
                    })
                })
            });

            await expect(storageService.deleteBlogMedia('other-user-id/some-file.png'))
                .rejects.toThrow('Not authorized to delete this file');
        });

        it('allows admin to delete another user\'s file', async () => {
            mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });
            mockSupabase.from = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
                    })
                })
            });
            const bucket = {
                remove: vi.fn().mockResolvedValue({ data: null, error: null })
            };
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            // Should not throw
            await storageService.deleteBlogMedia('other-user-id/some-file.png');
            expect(bucket.remove).toHaveBeenCalledWith(['other-user-id/some-file.png']);
        });
    });

    // ============================================================
    // deleteBlogMediaBatch
    // ============================================================

    describe('deleteBlogMediaBatch', () => {
        it('does nothing when given an empty array', async () => {
            await storageService.deleteBlogMediaBatch([]);

            expect(mockSupabase.storage.from).not.toHaveBeenCalled();
        });

        it('deletes multiple files in a single call', async () => {
            const bucket = {
                remove: vi.fn().mockResolvedValue({ data: null, error: null })
            };
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            const paths = [
                'test-user-id/file1.png',
                'test-user-id/file2.jpg',
                'test-user-id/file3.webp'
            ];

            await storageService.deleteBlogMediaBatch(paths);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('blog-media');
            expect(bucket.remove).toHaveBeenCalledWith(paths);
        });

        it('throws error when deletion fails', async () => {
            const bucket = {
                remove: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } })
            };
            mockSupabase.storage.from.mockReturnValue(bucket as any);

            await expect(storageService.deleteBlogMediaBatch(['test-user-id/file.png']))
                .rejects.toEqual({ message: 'Delete failed' });
        });
    });
});
