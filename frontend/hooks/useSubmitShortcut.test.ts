import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubmitShortcut } from './useSubmitShortcut';

describe('useSubmitShortcut', () => {
    it('calls callback on Meta+Enter', () => {
        const callback = vi.fn();
        renderHook(() => useSubmitShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('calls callback on Ctrl+Enter', () => {
        const callback = vi.fn();
        renderHook(() => useSubmitShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
    });

    it('does not call callback when disabled', () => {
        const callback = vi.fn();
        renderHook(() => useSubmitShortcut(callback, true));

        const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
    });
});
