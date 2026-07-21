export interface RetryOptions {
    /** Number of attempts before giving up. Default: 3 */
    attempts?: number;
    /** Initial delay in milliseconds. Default: 200ms */
    delay?: number;
    /** Multiplication factor for exponential backoff. Default: 2.0 */
    factor?: number;
}

/**
 * Retries an asynchronous operation with exponential backoff.
 * 
 * @param operation - The asynchronous function to retry
 * @param options - Configuration for retry behavior
 * @returns The result of the operation
 * @throws The last error encountered if all attempts fail
 */
export async function retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        attempts = 3,
        delay = 200,
        factor = 2.0
    } = options;

    let lastError: Error | unknown;
    let currentDelay = delay;

    for (let i = 0; i < attempts; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (i < attempts - 1) {
                console.warn(
                    `Retry attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`,
                    error
                );
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= factor;
            }
        }
    }

    throw lastError;
}
