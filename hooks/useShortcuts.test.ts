import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useSaveShortcut } from './useSaveShortcut';
import { useSubmitShortcut } from './useSubmitShortcut';

describe('useSaveShortcut', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('calls callback on Cmd+S', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
    });

    it('calls callback on Ctrl+S', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
    });

    it('does not call callback if disabled', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback, true));

        const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback on wrong key', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 'a', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
    });
});

describe('useSubmitShortcut', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('calls callback on Cmd+Enter', () => {
        const callback = vi.fn();
        renderHook(() => useSubmitShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
    });

    it('calls callback on Ctrl+Enter', () => {
        const callback = vi.fn();
        renderHook(() => useSubmitShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
    });

    it('does not call callback if disabled', () => {
        const callback = vi.fn();
        renderHook(() => useSubmitShortcut(callback, true));

        const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
    });
});
