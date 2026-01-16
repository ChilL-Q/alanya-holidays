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

        // Note: You must create 'properties' and 'services' buckets in Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    }
};
