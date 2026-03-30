import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
    it('calls handler when clicking outside', () => {
        const handler = vi.fn();
        const ref = { current: document.createElement('div') };
        document.body.appendChild(ref.current);

        renderHook(() => useClickOutside({ current: ref.current } as any, handler));

        // Click outside
        document.dispatchEvent(new MouseEvent('mousedown'));
        expect(handler).toHaveBeenCalled();

        document.body.removeChild(ref.current);
    });

    it('does not call handler when clicking inside', () => {
        const handler = vi.fn();
        const ref = { current: document.createElement('div') };
        document.body.appendChild(ref.current);

        renderHook(() => useClickOutside({ current: ref.current } as any, handler));

        // Click inside
        ref.current.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(handler).not.toHaveBeenCalled();

        document.body.removeChild(ref.current);
    });
});
