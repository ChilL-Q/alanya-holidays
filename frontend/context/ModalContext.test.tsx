import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ModalProvider, useModal } from './ModalContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ModalProvider>{children}</ModalProvider>
);

describe('ModalContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with no active modal', () => {
        const { result } = renderHook(() => useModal(), { wrapper });

        expect(result.current.activeModal).toBeNull();
    });

    it('sets active modal to login when openLogin is called', () => {
        const { result } = renderHook(() => useModal(), { wrapper });

        act(() => {
            result.current.openLogin();
        });

        expect(result.current.activeModal).toBe('login');
    });

    it('sets active modal to register when openRegister is called', () => {
        const { result } = renderHook(() => useModal(), { wrapper });

        act(() => {
            result.current.openRegister();
        });

        expect(result.current.activeModal).toBe('register');
    });

    it('clears active modal when closeModal is called', () => {
        const { result } = renderHook(() => useModal(), { wrapper });

        act(() => {
            result.current.openLogin();
        });
        expect(result.current.activeModal).toBe('login');

        act(() => {
            result.current.closeModal();
        });
        expect(result.current.activeModal).toBeNull();
    });

    it('throws error when used outside ModalProvider', () => {
        // Suppress console.error for this test to keep output clean
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => renderHook(() => useModal())).toThrow('useModal must be used within a ModalProvider');
        
        consoleSpy.mockRestore();
    });
});
