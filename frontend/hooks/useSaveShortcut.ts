import { useEffect } from 'react';

export const useSaveShortcut = (callback: () => void, disabled = false) => {
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (disabled) return;
            
            // Cmd+S (Mac) or Ctrl+S (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault(); // Prevent "Save Page As"
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [callback, disabled]);
};
