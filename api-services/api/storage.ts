import { supabase } from '../supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);

// Blog-specific validation (stricter: 5MB, no gif/svg)
const BLOG_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BLOG_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BLOG_ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

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

    // Check MIME type (if available on client side)
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`MIME type "${file.type}" is not allowed. Only image files are accepted`);
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

    if (file.type && !BLOG_ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(`MIME type "${file.type}" is not allowed. Only JPEG, PNG, and WebP images are accepted`);
    }
}

export const storageService = {
    async uploadPropertyImage(file: File) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateFile(file);

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

    async uploadAvatar(file: File) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateFile(file);

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

    async uploadImage(file: File, bucket: 'properties' | 'services' | 'products' | 'directory' = 'properties') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateFile(file);

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
    async uploadBlogMedia(file: File): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        validateBlogMedia(file);

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
};
