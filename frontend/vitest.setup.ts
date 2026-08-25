import '@testing-library/jest-dom';
import React from 'react';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Global mock for react-quill in React 19 jsdom environment (findDOMNode removed)
vi.mock('react-quill', () => {
  return {
    default: React.forwardRef((props: Record<string, unknown>, ref: React.ForwardedRef<unknown>) => {
      if (ref) {
        const dummyEditor = {
          insertEmbed: vi.fn(),
          setSelection: vi.fn(),
          getSelection: vi.fn().mockReturnValue({ index: 0 }),
          getLength: vi.fn().mockReturnValue(10),
        };
        if (typeof ref === 'function') {
          ref({ getEditor: () => dummyEditor });
        } else if (typeof ref === 'object' && ref !== null) {
          (ref as { current: unknown }).current = { getEditor: () => dummyEditor };
        }
      }
      return React.createElement(
        'div',
        { 'data-testid': 'mock-react-quill' },
        React.createElement('textarea', {
          'data-testid': 'quill-textarea',
          placeholder: typeof props.placeholder === 'string' ? props.placeholder : undefined,
          value: typeof props.value === 'string' ? props.value : '',
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (typeof props.onChange === 'function') {
              props.onChange(e.target.value);
            }
          },
        })
      );
    }),
  };
});

// Suppress expected console noise (error-path tests, act() warnings, etc.)
// Tests that need to assert on console.error can still use expect(console.error).toHaveBeenCalled()
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
