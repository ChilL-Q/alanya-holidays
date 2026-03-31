import { vi } from 'vitest';

// Mock state that can be updated from tests
export const mockAuthState = { user: null as { id: string } | null };

// Mock useAuth function
export const useAuth = vi.fn(() => ({ user: mockAuthState.user }));

// Helper to set user from tests
export const setMockUser = (user: { id: string } | null) => {
    mockAuthState.user = user;
};
