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

describe('storageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadPropertyImage', () => {
        it('uploads image and returns public URL', async () => {
            const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
            
            const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'path/to/img.png' }, error: null });
            const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/properties/path/to/img.png' } });
            
            const mockBucket = {
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl
            };
            
            // Assuming the implementation uses 'properties' bucket
            mockSupabase.storage.from.mockReturnValue(mockBucket as any);

            const result = await storageService.uploadPropertyImage(mockFile);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('properties');
            expect(mockUpload).toHaveBeenCalled();
            expect(result).toContain('https://test.supabase.co');
        });
        
        it('throws error if upload fails', async () => {
            const mockFile = new File(['content'], 'test.png', { type: 'image/png' });
            const mockUpload = vi.fn().mockResolvedValue({ data: null, error: { message: 'Upload failed' } });
            
            mockSupabase.storage.from.mockReturnValue({ upload: mockUpload } as any);

            await expect(storageService.uploadPropertyImage(mockFile)).rejects.toThrow('Upload failed');
        });
    });
});
