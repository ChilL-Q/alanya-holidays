import { supabase } from '../supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']);

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

export const storageService = {
    async uploadPropertyImage(file: File) {
        validateFile(file);

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        return data.publicUrl;
    },

    async uploadAvatar(file: File) {
        validateFile(file);

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
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
        validateFile(file);

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
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
    }
};
