/** Normalize a Supabase response to an array. Handles both array and single-object returns. */
export function toArray<T>(data: T | T[] | null | undefined): T[] {
    return Array.isArray(data) ? data : data ? [data] : [];
}