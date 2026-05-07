import { supabase } from '../supabase';
import { getUserRole } from '../auth';

export interface PlatformTestimonial {
    id: string;
    name: string;
    role: string | null;
    content: string;
    rating: number;
    is_visible: boolean;
    created_at: string;
}

export const testimonialService = {
    /**
     * Get all public (visible) testimonials
     */
    async getPublicTestimonials(): Promise<PlatformTestimonial[]> {
        const { data, error } = await supabase
            .from('platform_testimonials')
            .select('*')
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PlatformTestimonial[];
    },

    /**
     * Get all testimonials (Admin only)
     */
    async getAllTestimonials(): Promise<PlatformTestimonial[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Not authorized');

        const { data, error } = await supabase
            .from('platform_testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PlatformTestimonial[];
    },

    /**
     * Create a new testimonial (Admin only)
     */
    async createTestimonial(testimonialData: {
        name: string;
        role?: string;
        content: string;
        rating?: number;
        is_visible?: boolean;
    }): Promise<PlatformTestimonial> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Not authorized');

        const { data, error } = await supabase
            .from('platform_testimonials')
            .insert([{
                name: testimonialData.name,
                role: testimonialData.role || null,
                content: testimonialData.content,
                rating: testimonialData.rating ?? 5,
                is_visible: testimonialData.is_visible ?? true,
            }])
            .select()
            .single();

        if (error) throw error;
        return data as PlatformTestimonial;
    },

    /**
     * Toggle visibility (Admin only)
     */
    async toggleVisibility(id: string, isVisible: boolean): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Not authorized');

        const { error } = await supabase
            .from('platform_testimonials')
            .update({ is_visible: isVisible })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete testimonial (Admin only)
     */
    async deleteTestimonial(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Not authorized');

        const { error } = await supabase
            .from('platform_testimonials')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
