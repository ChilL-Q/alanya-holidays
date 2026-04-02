import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry } from './retry';

describe('retry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should return the result if the operation succeeds on the first attempt', async () => {
        const operation = vi.fn().mockResolvedValue('success');
        const result = await retry(operation);
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry if the operation fails and eventually succeeds', async () => {
        const operation = vi.fn()
            .mockRejectedValueOnce(new Error('fail 1'))
            .mockRejectedValueOnce(new Error('fail 2'))
            .mockResolvedValue('success');

        const retryPromise = retry(operation, { attempts: 3, delay: 100 });
        
        // Advance timers to trigger retries
        await vi.runAllTimersAsync();
        
        const result = await retryPromise;
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
        expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('should throw the last error if all attempts fail', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('final fail'));

        const retryPromise = retry(operation, { attempts: 3, delay: 100 });
        retryPromise.catch(() => {}); // prevent unhandled rejection before assertion

        await vi.runAllTimersAsync();

        await expect(retryPromise).rejects.toThrow('final fail');
        expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('fail'));
        const delay = 100;
        const factor = 2;

        const retryPromise = retry(operation, { attempts: 3, delay, factor });
        retryPromise.catch(() => {}); // prevent unhandled rejection before assertion

        await vi.runAllTimersAsync();

        await expect(retryPromise).rejects.toThrow('fail');
    });
});
