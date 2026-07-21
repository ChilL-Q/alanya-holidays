export const formatEventDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
        });
    } catch {
        return iso;
    }
};

export const formatEventTime = (iso: string): string => {
    try {
        return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
};

export const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
};
