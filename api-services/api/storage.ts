import { supabase } from '../supabase';

export const storageService = {
    async uploadPropertyImage(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        return data.publicUrl;
    },

    async uploadAvatar(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
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

    async uploadImage(file: File, bucket: 'properties' | 'services' | 'products' = 'properties') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
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
