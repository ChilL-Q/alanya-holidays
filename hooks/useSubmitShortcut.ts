import { useEffect } from 'react';

export const useSubmitShortcut = (callback: () => void, disabled = false) => {
    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (disabled) return;
            
            // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                callback();
            }
        };

        // We attach to window to catch it even if not focused on specific input, 
        // IF the modal is open. But usually for forms we want it on the container or globally if modal is active.
        // Better approach: Attach to the specific element if passed, OR window if used in a Modal that mounts/unmounts.
        // Since our Modals mount/unmount content, window listener is safe as long as the component using this hook is only rendered when modal is open.
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [callback, disabled]);
};
