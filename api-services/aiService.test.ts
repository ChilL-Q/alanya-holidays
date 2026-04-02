import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn()
        }
    }
}));

describe('askLocalGuide', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns AI response on success', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: { answer: 'AI Response' },
            error: null
        });

        const { askLocalGuide } = await import('./aiService');
        const response = await askLocalGuide(null, null, 'Hello');
        
        expect(response).toBe('AI Response');
        expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-proxy', expect.any(Object));
    });

    it('handles property context', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: { answer: 'Details here' },
            error: null
        });

        const { askLocalGuide } = await import('./aiService');
        await askLocalGuide('Villa', 'Center', 'Details?');
        
        const callArgs = (supabase.functions.invoke as any).mock.calls[0][1];
        expect(callArgs.body.propertyName).toBe('Villa');
        expect(callArgs.body.location).toBe('Center');
    });

    it('returns rate limit message after retries', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: { error: '429 Too Many Requests' },
            error: null
        });

        const { askLocalGuide } = await import('./aiService');
        const response = await askLocalGuide(null, null, 'Hello');
        
        expect(response).toContain('receiving too many requests');
        // Should have retried 3 times
        expect(supabase.functions.invoke).toHaveBeenCalledTimes(3);
    });

    it('returns fallback recommendations if edge function fails after retries', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({
            data: null,
            error: new Error('NetworkError')
        });

        const { askLocalGuide } = await import('./aiService');
        const response = await askLocalGuide(null, null, 'Hello');
        
        expect(response).toContain('top recommendations for your Alanya holiday');
        expect(response).toContain('Alanya Castle');
        // Should have retried 3 times
        expect(supabase.functions.invoke).toHaveBeenCalledTimes(3);
    });
});
