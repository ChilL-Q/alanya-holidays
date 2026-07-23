import { supabase } from '../supabase';
import { compressImage } from '../../utils/imageCompression';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);

// Blog-specific validation (stricter: 5MB, no gif/svg)
export const BLOG_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const BLOG_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const BLOG_ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

function validateFile(file: File) {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error(`File type ".${ext}" is not allowed. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`);
    }

    // MIME type is required — empty type is treated as invalid
    if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`MIME type "${file.type || 'unknown'}" is not allowed. Only image files are accepted`);
    }
}

function validateBlogMedia(file: File) {
    if (file.size > BLOG_MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${BLOG_MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!BLOG_ALLOWED_EXTENSIONS.has(ext)) {
        throw new Error(`File type ".${ext}" is not allowed. Allowed types: ${Array.from(BLOG_ALLOWED_EXTENSIONS).join(', ')}`);
    }

    if (!file.type || !BLOG_ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`MIME type "${file.type || 'unknown'}" is not allowed. Only JPEG, PNG, and WebP images are accepted`);
    }
}

export const storageService = {
    async uploadPropertyImage(rawFile: File) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateFile(rawFile);
        const file = await compressImage(rawFile);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        return data.publicUrl;
    },

    async uploadAvatar(rawFile: File) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateFile(rawFile);
        const file = await compressImage(rawFile, 800, 800);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            // If avatars bucket fails, try properties as fallback
            const { error: secondTryError } = await supabase.storage
                .from('properties')
                .upload(filePath, file);

            if (secondTryError) throw uploadError;

            const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
            return data.publicUrl;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    },

    async uploadImage(rawFile: File, bucket: 'properties' | 'services' | 'products' | 'directory' = 'properties') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateFile(rawFile);
        const file = await compressImage(rawFile);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            // Check if bucket exists first to avoid console noise (400 Bad Request)
            const { data: buckets } = await supabase.storage.listBuckets();
            const bucketExists = buckets?.some(b => b.id === bucket);

            if (!bucketExists && bucket !== 'properties') {
                console.warn(`Bucket '${bucket}' not found, falling back to 'properties'`);
                const { error: fallbackError } = await supabase.storage
                    .from('properties')
                    .upload(filePath, file);

                if (fallbackError) throw fallbackError;

                const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
                return data.publicUrl;
            }

            // Attempt to upload to requested bucket
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                // Additional fallback for other types of errors if needed
                if (bucket !== 'properties') {
                    console.warn(`Additional fallback for '${bucket}' error:`, uploadError);
                     const { error: fallbackError } = await supabase.storage
                        .from('properties')
                        .upload(filePath, file);

                    if (fallbackError) throw fallbackError;

                    const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
                    return data.publicUrl;
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    },

    // ============================================================
    // Blog Media
    // ============================================================

    /**
     * Upload a blog media file to the blog-media bucket.
     * Path: {userId}/{nanoid-like-uuid}.{ext}
     * Returns the public URL.
     */
    async uploadBlogMedia(rawFile: File): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateBlogMedia(rawFile);
        const file = await compressImage(rawFile);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('blog-media')
            .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('blog-media').getPublicUrl(fileName);
        return data.publicUrl;
    },

    /**
     * Upload multiple blog media files.
     * Returns array of public URLs.
     */
    async uploadBlogMediaBatch(files: File[]): Promise<string[]> {
        const urls: string[] = [];
        for (const file of files) {
            const url = await this.uploadBlogMedia(file);
            urls.push(url);
        }
        return urls;
    },

    /**
     * Delete a file from the blog-media bucket by its full path.
     * Path format: {userId}/{filename}.{ext}
     */
    async deleteBlogMedia(filePath: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Verify the file belongs to the user (RLS also enforces this)
        const pathParts = filePath.split('/');
        if (pathParts[0] !== user.id) {
            // Check if admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profile?.role !== 'admin') {
                throw new Error('Not authorized to delete this file');
            }
        }

        const { error } = await supabase.storage
            .from('blog-media')
            .remove([filePath]);

        if (error) throw error;
    },

    /**
     * Delete multiple files from the blog-media bucket.
     */
    async deleteBlogMediaBatch(filePaths: string[]): Promise<void> {
        if (filePaths.length === 0) return;
        const { error } = await supabase.storage
            .from('blog-media')
            .remove(filePaths);
        if (error) throw error;
    },

    // ============================================================
    // Category Images (admin-managed directory category tile photos)
    // ============================================================

    /**
     * Map of category id → public URL for admin-uploaded tile photos.
     * Files live at the bucket root as {categoryId}.{ext}. The updated_at
     * timestamp is appended as ?v= so overwrites bust the CDN cache.
     * Returns {} if the bucket is missing or empty (callers fall back to
     * the bundled /images/categories/ files).
     */
    async getCategoryImageOverrides(): Promise<Record<string, string>> {
        const { data, error } = await supabase.storage
            .from('category-images')
            .list('', { limit: 100 });
        if (error || !data) return {};

        const map: Record<string, string> = {};
        for (const file of data) {
            const dot = file.name.lastIndexOf('.');
            if (dot <= 0) continue;
            const categoryId = file.name.slice(0, dot);
            const { data: pub } = supabase.storage.from('category-images').getPublicUrl(file.name);
            const version = file.updated_at ?? file.created_at ?? '';
            map[categoryId] = version
                ? `${pub.publicUrl}?v=${encodeURIComponent(version)}`
                : pub.publicUrl;
        }
        return map;
    },

    /**
     * Upload (or replace) the tile photo for a category. Admin-only via RLS.
     * Returns the public URL with a cache-busting version param.
     */
    async uploadCategoryImage(categoryId: string, file: File): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateBlogMedia(file);

        const ext = file.name.split('.').pop()!.toLowerCase();
        const path = `${categoryId}.${ext}`;

        // Drop a previous override with a different extension so list()
        // never maps two files to the same category
        const { data: existing } = await supabase.storage
            .from('category-images')
            .list('', { search: categoryId });
        const stale = (existing ?? [])
            .filter(f => f.name.replace(/\.[^.]+$/, '') === categoryId && f.name !== path)
            .map(f => f.name);
        if (stale.length > 0) {
            await supabase.storage.from('category-images').remove(stale);
        }

        const { error } = await supabase.storage
            .from('category-images')
            .upload(path, file, { upsert: true, cacheControl: '300' });
        if (error) throw error;

        const { data } = supabase.storage.from('category-images').getPublicUrl(path);
        return `${data.publicUrl}?v=${Date.now()}`;
    },

    /**
     * Remove the admin override for a category, reverting the tile to the
     * bundled default image.
     */
    async removeCategoryImage(categoryId: string): Promise<void> {
        const { data: existing, error: listError } = await supabase.storage
            .from('category-images')
            .list('', { search: categoryId });
        if (listError) throw listError;

        const targets = (existing ?? [])
            .filter(f => f.name.replace(/\.[^.]+$/, '') === categoryId)
            .map(f => f.name);
        if (targets.length === 0) return;

        const { error } = await supabase.storage.from('category-images').remove(targets);
        if (error) throw error;
    },
};
