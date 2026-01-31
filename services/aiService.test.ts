import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the GoogleGenerativeAI class
const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
    const mockGen = vi.fn();
    const mockModel = vi.fn();
    return { mockGenerateContent: mockGen, mockGetGenerativeModel: mockModel };
});

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn(function() {
        return {
            getGenerativeModel: mockGetGenerativeModel
        };
    })
}));

describe('askLocalGuide', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
        vi.clearAllMocks();
        
        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => 'AI Response'
            }
        });
        mockGetGenerativeModel.mockReturnValue({
            generateContent: mockGenerateContent
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns AI response on success', async () => {
        const { askLocalGuide } = await import('./aiService');
        const response = await askLocalGuide(null, null, 'Hello');
        expect(response).toBe('AI Response');
        expect(mockGetGenerativeModel).toHaveBeenCalled();
        expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('handles property context', async () => {
        const { askLocalGuide } = await import('./aiService');
        await askLocalGuide('Villa', 'Center', 'Details?');
        const prompt = mockGenerateContent.mock.calls[0][0];
        expect(prompt).toContain('Villa');
        expect(prompt).toContain('Center');
    });

    it('tries multiple models on failure', async () => {
        const { askLocalGuide } = await import('./aiService');
        mockGenerateContent
            .mockRejectedValueOnce(new Error('First fail'))
            .mockResolvedValueOnce({
                response: {
                    text: () => 'Success after retry'
                }
            });

        const response = await askLocalGuide(null, null, 'Hello');
        expect(response).toBe('Success after retry');
        expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
    });

    it('returns rate limit message', async () => {
        const { askLocalGuide } = await import('./aiService');
        mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests'));
        
        const response = await askLocalGuide(null, null, 'Hello');
        expect(response).toContain('receiving too many requests');
    });

    it('returns error message if all models fail', async () => {
        const { askLocalGuide } = await import('./aiService');
        mockGenerateContent.mockRejectedValue(new Error('Fatal error'));
        
        try {
            await askLocalGuide(null, null, 'Hello');
        } catch (e: any) {
            expect(e.message).toContain('Fatal error');
        }
    });
});
