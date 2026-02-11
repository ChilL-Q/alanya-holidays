import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSaveShortcut } from './useSaveShortcut';

describe('useSaveShortcut', () => {
    it('calls callback on Meta+S', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('calls callback on Ctrl+S', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback));

        const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
        vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(callback).toHaveBeenCalled();
    });

    it('does not call callback when disabled', () => {
        const callback = vi.fn();
        renderHook(() => useSaveShortcut(callback, true));

        const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
        window.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
    });
});
