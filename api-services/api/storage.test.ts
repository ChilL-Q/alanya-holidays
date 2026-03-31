import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageService } from './storage';

// Mock supabase client
const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            storage: {
                from: vi.fn(),
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

            const result = await storageService.uploadImage(mockFile, 'products');
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
});
